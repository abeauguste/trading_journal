import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LiveData, AtrSnapshot
from ..schemas import LiveDataOut, LiveDataIn
from ..websocket_manager import manager
from ..symbols import SYMBOL_CONFIG, validate_symbol, upsert_live, get_vix

router = APIRouter()


def _atr_value(rows: dict, db: Session, symbol: str):
    """Return ATR from live_data if present, else fall back to latest AtrSnapshot."""
    if "atr" in rows and rows["atr"].value is not None:
        return rows["atr"].value
    snap = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol).order_by(AtrSnapshot.id.desc()).first()
    return snap.atr_value if snap else None


def get_live_state(db: Session, symbol: str = "ES") -> LiveDataOut:
    cfg = SYMBOL_CONFIG[symbol]
    rows = {r.key: r for r in db.query(LiveData).filter(
        LiveData.symbol == symbol,
        LiveData.key.in_([
            cfg["price_key"], "atr",
            "vwap_daily", "vwap_weekly", "vwap_monthly", "vwap_quarterly", "vwap_yearly",
            "ttm_wave_a", "ttm_wave_b",
            cfg["high_key"], cfg["low_key"],
        ])
    ).all()}
    es_live  = rows.get(cfg["price_key"])
    vix_val  = get_vix(db)
    source = None
    if es_live and es_live.value is not None:
        source = es_live.source
    return LiveDataOut(
        price=es_live.value if es_live else None,
        vix=vix_val,
        source=source,
        atr=_atr_value(rows, db, symbol),
        vwap_daily=rows["vwap_daily"].value if "vwap_daily" in rows else None,
        vwap_weekly=rows["vwap_weekly"].value if "vwap_weekly" in rows else None,
        vwap_monthly=rows["vwap_monthly"].value if "vwap_monthly" in rows else None,
        vwap_quarterly=rows["vwap_quarterly"].value if "vwap_quarterly" in rows else None,
        vwap_yearly=rows["vwap_yearly"].value if "vwap_yearly" in rows else None,
        ttm_wave_a=rows["ttm_wave_a"].value if "ttm_wave_a" in rows else None,
        ttm_wave_b=rows["ttm_wave_b"].value if "ttm_wave_b" in rows else None,
        es_high=rows[cfg["high_key"]].value if cfg["high_key"] in rows else None,
        es_low=rows[cfg["low_key"]].value if cfg["low_key"] in rows else None,
        updated_at=(es_live.updated_at.isoformat() if es_live and es_live.updated_at else None),
    )


def _resolve_symbol(symbol: str) -> str:
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    return sym


@router.get("", response_model=LiveDataOut)
def get_live(symbol: str = "ES", db: Session = Depends(get_db)):
    return get_live_state(db, _resolve_symbol(symbol))


@router.post("", response_model=LiveDataOut)
async def set_live(data: LiveDataIn, symbol: str = "ES", db: Session = Depends(get_db)):
    sym = _resolve_symbol(symbol)
    cfg = SYMBOL_CONFIG[sym]
    now = datetime.now(timezone.utc)

    if data.price is not None:
        upsert_live(db, sym, cfg["price_key"], data.price, "manual", now)

    if data.vix is not None:
        from ..symbols import GLOBAL_SYMBOL
        upsert_live(db, GLOBAL_SYMBOL, "vix", data.vix, "manual", now)

    db.commit()
    state = get_live_state(db, sym)

    msg = json.dumps({
        "type": "price_update",
        "symbol": sym,
        "price": state.price,
        "vix": state.vix,
        "source": state.source,
    })
    await manager.broadcast(msg)

    return state


@router.delete("", response_model=LiveDataOut)
async def clear_live(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = _resolve_symbol(symbol)
    cfg = SYMBOL_CONFIG[sym]
    now = datetime.now(timezone.utc)

    live = db.query(LiveData).filter(LiveData.symbol == sym, LiveData.key == cfg["price_key"]).first()
    if live:
        live.value = None
        live.source = None
        live.updated_at = now

    from ..symbols import GLOBAL_SYMBOL
    vix = db.query(LiveData).filter(LiveData.symbol == GLOBAL_SYMBOL, LiveData.key == "vix").first()
    if vix:
        vix.value = None
        vix.source = None
        vix.updated_at = now

    db.commit()

    msg = json.dumps({"type": "price_update", "symbol": sym, "price": None, "vix": None, "source": None})
    await manager.broadcast(msg)

    return LiveDataOut(price=None, vix=None, source=None)
