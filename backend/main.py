import json
import logging
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")

from .database import init_db, get_db
from .websocket_manager import manager
from .routers import weeks, historical, webhook, live, calendar, intelligence, forecast, markets, news, journal, prep
from .scheduler import setup_scheduler

app = FastAPI(title="ES Trading Intelligence API")

DIST = Path(__file__).parent.parent / "frontend" / "dist"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()
    from .migrations import run_migrations
    run_migrations()
    setup_scheduler()
    from .fetchers import bootstrap_if_empty, fetch_and_score_news
    from .database import SessionLocal
    db = SessionLocal()
    try:
        await bootstrap_if_empty(db)
    finally:
        db.close()

    # Prime news on startup (non-blocking — runs in background)
    import asyncio as _asyncio
    async def _initial_news():
        from .database import SessionLocal as SL
        _db = SL()
        try:
            await fetch_and_score_news(_db)
        except Exception as exc:
            logger.warning("Initial news fetch failed (non-fatal): %s", exc)
        finally:
            _db.close()
    _asyncio.create_task(_initial_news())


app.include_router(weeks.router, prefix="/weeks", tags=["weeks"])
app.include_router(historical.router, prefix="/historical", tags=["historical"])
app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
app.include_router(live.router, prefix="/live", tags=["live"])
app.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
app.include_router(markets.router, prefix="/markets", tags=["markets"])
app.include_router(news.router,    prefix="/news",    tags=["news"])
app.include_router(journal.router, prefix="/journal", tags=["journal"])
app.include_router(prep.router,    prefix="/prep",    tags=["prep"])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current live state on connect
        from .models import LiveData
        from .symbols import GLOBAL_SYMBOL
        db_gen = get_db()
        db = next(db_gen)
        try:
            # Initial state is ES (the default symbol); the client re-seeds per-symbol
            # via getLive(symbol) and filters WS messages by msg.symbol.
            es_live = db.query(LiveData).filter(
                LiveData.symbol == "ES", LiveData.key == "es_price").first()
            vix_live = db.query(LiveData).filter(
                LiveData.symbol == GLOBAL_SYMBOL, LiveData.key == "vix").first()
        finally:
            db.close()
            try: next(db_gen)
            except StopIteration: pass

        init_msg = json.dumps({
            "type": "price_update",
            "symbol": "ES",
            "price": es_live.value if es_live else None,
            "vix": vix_live.value if vix_live else None,
            "source": (es_live.source if es_live and es_live.value else None),
        })
        await websocket.send_text(init_msg)

        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve Vite's hashed asset bundles
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="static-assets")

# SPA catch-all — must be registered last so API routes match first
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"error": "Frontend not built. Run: cd frontend && npm run build"}
