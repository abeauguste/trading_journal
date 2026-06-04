import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import WeeklyForecast, DailyForecast
from ..symbols import validate_symbol

router = APIRouter()


def _current_week_label() -> str:
    today = date.today()
    weekday = today.weekday()
    monday = today - timedelta(days=weekday) if weekday < 5 else today + timedelta(days=(7 - weekday))
    return monday.strftime("%G-W%V")


@router.get("/current")
def get_current_forecast(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    week_label = _current_week_label()
    wf = db.query(WeeklyForecast).filter(WeeklyForecast.symbol == sym, WeeklyForecast.week_label == week_label).first()
    if not wf:
        return {"forecast": None, "daily": [], "fallback": True}

    daily = (
        db.query(DailyForecast)
        .filter(DailyForecast.weekly_forecast_id == wf.id)
        .order_by(DailyForecast.day_index)
        .all()
    )

    try:
        fj = json.loads(wf.forecast_json)
    except Exception:
        fj = {}

    forecast_out = {
        "id": wf.id,
        "week_label": wf.week_label,
        "week_start_date": wf.week_start_date,
        "week_end_date": wf.week_end_date,
        "as_of_price": wf.as_of_price,
        "as_of_vix": wf.as_of_vix,
        "vwap_daily": wf.vwap_daily,
        "vwap_weekly": wf.vwap_weekly,
        "vwap_monthly": wf.vwap_monthly,
        "vwap_quarterly": wf.vwap_quarterly,
        "vwap_yearly": wf.vwap_yearly,
        "weekly_bias": wf.weekly_bias,
        "vwap_posture_label": wf.vwap_posture_label,
        "atr_current": wf.atr_current,
        "atr_regime": wf.atr_regime,
        "vix_current": wf.vix_current,
        "vix_regime": wf.vix_regime,
        "squeeze_state": wf.squeeze_state,
        "momentum_signal": wf.momentum_signal,
        "has_fomc_this_week": wf.has_fomc_this_week,
        "has_cpi_this_week": wf.has_cpi_this_week,
        "bull_entry": wf.bull_entry,
        "bull_target": wf.bull_target,
        "bull_stop": wf.bull_stop,
        "bear_entry": wf.bear_entry,
        "bear_target": wf.bear_target,
        "bear_stop": wf.bear_stop,
        "triggered_by": wf.triggered_by,
        "generated_at": wf.generated_at.isoformat() if wf.generated_at else None,
        "updated_at": wf.updated_at.isoformat() if wf.updated_at else None,
        "narrative": fj.get("narrative"),
        "vwap_posture": fj.get("vwap_posture"),
        "risk_events": fj.get("risk_events", []),
        "bull_scenario": fj.get("bull_scenario"),
        "bear_scenario": fj.get("bear_scenario"),
    }

    daily_out = []
    for d in daily:
        try:
            re = json.loads(d.risk_events_json) if d.risk_events_json else []
        except Exception:
            re = []
        daily_out.append({
            "id": d.id,
            "day_date": d.day_date,
            "day_label": d.day_label,
            "day_index": d.day_index,
            "event_summary": d.event_summary,
            "has_high_impact_event": d.has_high_impact_event,
            "day_bias": d.day_bias,
            "size_guidance": d.size_guidance,
            "level_daily_vwap": d.level_daily_vwap,
            "level_weekly_vwap": d.level_weekly_vwap,
            "level_support_1": d.level_support_1,
            "level_resistance_1": d.level_resistance_1,
            "max_loss_pts": d.max_loss_pts,
            "momentum_signal": d.momentum_signal,
            "day_narrative": d.day_narrative,
            "risk_events": re,
        })

    return {"forecast": forecast_out, "daily": daily_out, "fallback": False}


@router.post("/generate")
async def generate_forecast(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    from ..intelligence import upsert_weekly_forecast
    from ..websocket_manager import manager

    wf = await upsert_weekly_forecast(db, triggered_by="manual", symbol=sym)
    await manager.broadcast(json.dumps({"type": "forecast_updated", "symbol": sym, "week_label": wf.week_label}))
    return {"status": "ok", "week_label": wf.week_label}
