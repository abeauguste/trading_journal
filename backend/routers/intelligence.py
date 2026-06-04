import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import IntelligenceReport, AtrSnapshot, WebhookEvent
from ..symbols import SYMBOL_CONFIG, validate_symbol


def _resolve(symbol):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    return sym


def _wh_q(db, symbol):
    from sqlalchemy import or_
    prefixes = SYMBOL_CONFIG[symbol]["ticker_prefixes"]
    return db.query(WebhookEvent).filter(or_(*[WebhookEvent.ticker.like(f"{p}%") for p in prefixes]))


router = APIRouter()

@router.get("/latest")
def get_latest_intelligence(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = _resolve(symbol)
    report = db.query(IntelligenceReport).filter(IntelligenceReport.symbol == sym).order_by(IntelligenceReport.generated_at.desc()).first()
    if not report:
        return {"report": None, "message": "No intelligence report yet. Waiting for first webhook."}
    try:
        data = json.loads(report.report_json)
    except Exception:
        data = {}
    data["report_id"] = report.id
    return {"report": data, "generated_at": report.generated_at.isoformat() if report.generated_at else None}

@router.get("/atr")
def get_atr_intelligence(symbol: str = "ES", limit: int = 100, db: Session = Depends(get_db)):
    sym = _resolve(symbol)
    snapshots = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == sym).order_by(AtrSnapshot.computed_at.desc()).limit(limit).all()
    total = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == sym).count()
    current = None
    weekly  = None
    monthly = None
    if snapshots:
        latest = snapshots[0]
        current = {
            "atr_value": latest.atr_value,
            "regime": latest.regime,
            "percentile_rank": latest.percentile_rank,
            "rolling_20_avg": latest.rolling_20_avg,
        }
        week_snaps  = [s for s in snapshots if s.event_week  == latest.event_week]
        month_snaps = [s for s in snapshots if s.event_month == latest.event_month]
        if week_snaps:
            weekly = {"high": max(s.atr_value for s in week_snaps), "low": min(s.atr_value for s in week_snaps),
                      "avg": round(sum(s.atr_value for s in week_snaps)/len(week_snaps), 2), "label": latest.event_week}
        if month_snaps:
            monthly = {"high": max(s.atr_value for s in month_snaps), "low": min(s.atr_value for s in month_snaps),
                       "avg": round(sum(s.atr_value for s in month_snaps)/len(month_snaps), 2), "label": latest.event_month}
    history = [{"id": s.id, "atr_value": s.atr_value, "rolling_20_avg": s.rolling_20_avg,
                "percentile_rank": s.percentile_rank, "regime": s.regime, "event_date": s.event_date,
                "computed_at": s.computed_at.isoformat() if s.computed_at else None} for s in snapshots]
    return {"current": current, "weekly": weekly, "monthly": monthly, "history": history, "total_events": total}

@router.post("/generate")
async def generate_intelligence(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = _resolve(symbol)
    latest_event = _wh_q(db, sym).order_by(WebhookEvent.received_at.desc()).first()
    if not latest_event:
        return {"message": "No webhook events yet. Fire a test webhook first."}
    latest_snapshot = db.query(AtrSnapshot).filter(
        AtrSnapshot.webhook_event_id == latest_event.id
    ).first()
    from ..intelligence import compute_atr_snapshot, generate_intelligence_report
    if not latest_snapshot and latest_event.atr:
        latest_snapshot, atr_stats = compute_atr_snapshot(latest_event, db, sym)
        db.add(latest_snapshot)
        db.commit()
    else:
        atr_stats = {}
    report = await generate_intelligence_report(
        db=db, webhook_event=latest_event,
        atr_snapshot=latest_snapshot, atr_stats=atr_stats,
        triggered_by="manual", symbol=sym,
    )
    db.add(report)
    db.commit()
    return {"status": "ok", "report_id": report.id}
