from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EconomicEvent, EarningsEvent

router = APIRouter()

@router.get("/economic")
def get_economic_calendar(days_back: int = 1, days_ahead: int = 21, db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=days_back)).isoformat()
    end   = (today + timedelta(days=days_ahead)).isoformat()
    events = db.query(EconomicEvent).filter(
        EconomicEvent.event_date >= start,
        EconomicEvent.event_date <= end,
    ).order_by(EconomicEvent.event_date, EconomicEvent.event_time).all()
    result = []
    warnings = []
    for e in events:
        try:
            edate = datetime.strptime(e.event_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        days_away = (edate - today).days
        item = {
            "id": e.id, "event_name": e.event_name, "event_type": e.event_type,
            "event_date": e.event_date, "event_time": e.event_time,
            "impact": e.impact, "actual": e.actual, "forecast": e.forecast,
            "previous": e.previous, "days_away": days_away, "source": e.source,
        }
        result.append(item)
        if e.impact == "HIGH" and 0 <= days_away <= 21:
            warnings.append({
                "type": e.event_type,
                "message": f"{e.event_name} in {days_away} day{'s' if days_away != 1 else ''}" + (f" ({e.event_time})" if e.event_time else ""),
                "urgency": "HIGH", "days_away": days_away,
            })
    return {"events": result, "warnings": warnings, "fetched_at": datetime.now(timezone.utc).isoformat()}

@router.get("/earnings")
def get_earnings_calendar(weeks_ahead: int = 2, db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    end   = today + timedelta(weeks=weeks_ahead)
    earnings = db.query(EarningsEvent).filter(
        EarningsEvent.earnings_date >= today.isoformat(),
        EarningsEvent.earnings_date <= end.isoformat(),
    ).order_by(EarningsEvent.earnings_date).all()
    result = []
    high_impact = []
    for e in earnings:
        try:
            edate = datetime.strptime(e.earnings_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        days_away = (edate - today).days
        result.append({
            "id": e.id, "ticker": e.ticker, "company_name": e.company_name,
            "earnings_date": e.earnings_date, "timing": e.timing,
            "eps_estimate": e.eps_estimate, "revenue_estimate": e.revenue_estimate,
            "is_es_mover": True, "days_away": days_away,
        })
        high_impact.append(e.ticker)
    return {"earnings": result, "high_impact_tickers": list(set(high_impact)), "fetched_at": datetime.now(timezone.utc).isoformat()}

@router.post("/refresh")
async def refresh_calendars(db: Session = Depends(get_db)):
    from ..fetchers import fetch_economic_calendar, fetch_earnings_calendar, fetch_vix_history
    econ_count = await fetch_economic_calendar(db, days_ahead=30)
    earn_count = await fetch_earnings_calendar(db, weeks_ahead=2)
    vix_count  = await fetch_vix_history(db, days=10)
    return {"economic_events": econ_count, "earnings": earn_count, "vix_records": vix_count}
