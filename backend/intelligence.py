import json
import logging
import os
import re
from datetime import datetime, date, timezone, timedelta
from statistics import mean
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from .models import (
    AtrSnapshot, IntelligenceReport, WebhookEvent, EconomicEvent, EarningsEvent,
    VixHistory, LiveData, WeeklyForecast, DailyForecast,
)
from .symbols import SYMBOL_CONFIG, GLOBAL_SYMBOL, get_vix as _get_vix

logger = logging.getLogger("intelligence")


def _wh_filter(query, symbol):
    """Scope a WebhookEvent query to the ticker prefixes for `symbol`."""
    prefixes = SYMBOL_CONFIG[symbol]["ticker_prefixes"]
    from sqlalchemy import or_
    return query.filter(or_(*[WebhookEvent.ticker.like(f"{p}%") for p in prefixes]))

# ---------------------------------------------------------------------------
# News headline scoring via Claude Haiku
# ---------------------------------------------------------------------------

_NEWS_MODEL = "claude-haiku-4-5-20251001"

_NEWS_SYSTEM = (
    "You are a macro strategist scoring news headlines for ES futures (S&P 500 E-mini) traders. "
    "Output ONLY valid JSON — no prose, no markdown fences."
)

_NEWS_USER_TMPL = """\
Score each headline 1-10 for how much it could move ES futures in the next 1-2 sessions.

Scoring guide:
- 9-10: Major regime event — FOMC decision, surprise CPI/NFP, war outbreak, debt crisis
- 7-8:  Material catalyst — Fed speaker, tariff announcement, geopolitical tension, large earnings miss/beat
- 5-6:  Background context — secondary data, mid-cap earnings, general market commentary
- 1-4:  Not relevant — lifestyle, micro-cap, opinion, unrelated politics

Also classify:
- bias: "BULL" (lifts ES), "BEAR" (pressures ES), or "NEUTRAL" (unclear)
- reason: ONE sentence max 120 chars explaining the score

Return ONLY a JSON object (same headline order):
{{"results": [{{"score": <int>, "bias": "<BULL|BEAR|NEUTRAL>", "reason": "<str>"}}]}}

Headlines:
{headlines}"""

_BULL_KW = ["rally","surge","gain","beat","record","dovish","de-escalation","deal","rate cut","ceasefire","truce","soft landing"]
_BEAR_KW = ["plunge","crash","hawkish","recession","miss","downgrade","hot inflation","spike","selloff","default"]
_HIGH_KW = [
    # Economic data releases
    "fomc","federal reserve","fed ","powell","cpi","ppi","nfp","payroll","gdp",
    "inflation","employment","jobless","retail sales","ism","jobs report",
    # Rate policy
    "rate cut","rate hike","rate decision","interest rate","basis point",
    # Trade & tariffs (core use case)
    "tariff","trade war","trade deal","trade dispute","import duty","export ban",
    # Geopolitical (core use case)
    "sanctions","iran","russia","ukraine","north korea","taiwan","military strike",
    "war","escalation","conflict","ceasefire",
    # Fiscal & macro
    "recession","debt ceiling","government shutdown","financial crisis","banking crisis",
    "credit downgrade","sovereign debt",
    # Key market movers
    "trump","congress","white house","treasury","opec","crude oil","energy crisis",
]

def _fallback_score(headline: str) -> Dict[str, Any]:
    t = (headline or "").lower()
    score = 5
    if any(k in t for k in _HIGH_KW): score = 7
    bull = sum(1 for k in _BULL_KW if k in t)
    bear = sum(1 for k in _BEAR_KW if k in t)
    bias = "BULL" if bull > bear else "BEAR" if bear > bull else "NEUTRAL"
    if bull or bear: score = min(10, score + 1)
    return {"score": score, "bias": bias, "reason": "keyword fallback (no API key)"}


async def score_news_headlines(headlines: List[str]) -> List[Dict[str, Any]]:
    """Batch-score headlines via Claude Haiku. Returns list aligned by index.
    Falls back to keyword scoring if API key is missing or call fails."""
    n = len(headlines)
    if n == 0:
        return []

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set — using keyword fallback scorer")
        return [_fallback_score(h) for h in headlines]

    try:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=api_key)
        numbered = "\n".join(f"{i+1}. {h}" for i, h in enumerate(headlines))
        msg = await client.messages.create(
            model=_NEWS_MODEL,
            max_tokens=4000,
            system=_NEWS_SYSTEM,
            messages=[{"role": "user", "content": _NEWS_USER_TMPL.format(headlines=numbered)}],
        )
        raw = "".join(b.text for b in msg.content if hasattr(b, "text")).strip()
        # Strip accidental markdown fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        payload = json.loads(raw)
        results = payload.get("results", [])
        # Pad or trim to match input length
        while len(results) < n:
            results.append({"score": 0, "bias": "NEUTRAL", "reason": ""})
        results = results[:n]
        # Normalize each item
        out = []
        for r in results:
            try:
                score = max(1, min(10, int(r.get("score", 0))))
            except (TypeError, ValueError):
                score = 0
            bias = str(r.get("bias", "NEUTRAL")).upper()
            if bias not in ("BULL", "BEAR", "NEUTRAL"):
                bias = "NEUTRAL"
            out.append({
                "score": score,
                "bias": bias,
                "reason": str(r.get("reason", ""))[:120],
            })
        return out
    except Exception as exc:
        logger.error("score_news_headlines failed: %s — using keyword fallback", exc)
        return [_fallback_score(h) for h in headlines]


# ---------------------------------------------------------------------------

def get_vix_regime(vix: Optional[float]) -> str:
    if vix is None: return "UNKNOWN"
    if vix < 15: return "COMPLACENT"
    if vix < 25: return "ELEVATED"
    if vix < 35: return "FEAR"
    return "PANIC"

def compute_atr_snapshot(event: WebhookEvent, db: Session, symbol: str = "ES"):
    if event.atr is None:
        return None, {}
    recent = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol).order_by(AtrSnapshot.computed_at.desc()).limit(99).all()
    all_atrs = [s.atr_value for s in reversed(recent)] + [event.atr]
    window_20 = all_atrs[-20:]
    rolling_20_avg = mean(window_20)
    rolling_20_max = max(window_20)
    rolling_20_min = min(window_20)
    pool = all_atrs[:-1]
    count_below = sum(1 for a in pool if a < event.atr)
    percentile_rank = count_below / len(pool) if pool else 0.5
    sorted_pool = sorted(all_atrs)
    n = len(sorted_pool)
    p25 = sorted_pool[max(0, int(n * 0.25))]
    p75 = sorted_pool[max(0, int(n * 0.75))]
    if event.atr > p75: regime = "EXPANDED"
    elif event.atr < p25: regime = "COMPRESSED"
    else: regime = "NORMAL"
    received = event.received_at or datetime.now(timezone.utc)
    event_date  = received.strftime("%Y-%m-%d")
    event_week  = received.strftime("%G-W%V")
    event_month = received.strftime("%Y-%m")
    # Query week/month snapshots directly — `recent` only has the last 99 rows ordered by time,
    # not filtered by week/month, so filtering it in-memory misses older events in the same period.
    week_snaps  = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol, AtrSnapshot.event_week  == event_week).all()
    month_snaps = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol, AtrSnapshot.event_month == event_month).all()
    week_atrs   = [s.atr_value for s in week_snaps]  + [event.atr]
    month_atrs  = [s.atr_value for s in month_snaps] + [event.atr]
    atr_stats = {
        "weekly_high": max(week_atrs), "weekly_low": min(week_atrs),
        "monthly_high": max(month_atrs), "monthly_low": min(month_atrs),
        "expanded_threshold": p75, "compressed_threshold": p25,
    }
    snapshot = AtrSnapshot(
        symbol=symbol,
        webhook_event_id=event.id, ticker=event.ticker,
        atr_value=event.atr, close_price=event.close,
        vwap_value=event.vwap, squeeze=event.squeeze,
        event_date=event_date, event_week=event_week, event_month=event_month,
        rolling_20_avg=rolling_20_avg, rolling_20_max=rolling_20_max,
        rolling_20_min=rolling_20_min, percentile_rank=percentile_rank,
        regime=regime,
    )
    return snapshot, atr_stats

def compute_vwap_posture(price: float, atr: Optional[float], db: Session, symbol: str = "ES"):
    def posture_label(p, v):
        if v is None: return None
        diff = p - v
        if abs(diff) < 0.25: return "AT"
        return "ABOVE" if diff > 0 else "BELOW"
    def atr_dist(p, v, a):
        if v is None or a is None or a == 0: return None
        return round(abs(p - v) / a, 2)
    vwap_keys = ["vwap_daily", "vwap_weekly", "vwap_monthly", "vwap_quarterly", "vwap_yearly"]
    rows = db.query(LiveData).filter(LiveData.symbol == symbol, LiveData.key.in_(vwap_keys)).all()
    vwap_map = {r.key: r.value for r in rows}
    dvwap = vwap_map.get("vwap_daily")
    wvwap = vwap_map.get("vwap_weekly")
    mvwap = vwap_map.get("vwap_monthly")
    qvwap = vwap_map.get("vwap_quarterly")
    yvwap = vwap_map.get("vwap_yearly")
    dp = posture_label(price, dvwap)
    wp = posture_label(price, wvwap)
    mp = posture_label(price, mvwap)
    above = [x for x in [dp, wp, mp] if x == "ABOVE"]
    if len(above) == 3:   summary = "FULL BULL STACK — price above all three VWAP anchors"
    elif len(above) == 2: summary = "MIXED BULL — above two of three VWAPs"
    elif len(above) == 1: summary = "MIXED BEAR — below two of three VWAPs"
    else:                 summary = "FULL BEAR STACK — price below all three VWAP anchors"
    return {
        "daily":     {"vwap": dvwap, "posture": dp, "distance_pts": round(price - dvwap, 2) if dvwap else None, "distance_atr_units": atr_dist(price, dvwap, atr)},
        "weekly":    {"vwap": wvwap, "posture": wp, "distance_pts": round(price - wvwap, 2) if wvwap else None, "distance_atr_units": atr_dist(price, wvwap, atr)},
        "monthly":   {"vwap": mvwap, "posture": mp, "distance_pts": round(price - mvwap, 2) if mvwap else None, "distance_atr_units": atr_dist(price, mvwap, atr)},
        "quarterly": {"vwap": qvwap, "posture": posture_label(price, qvwap), "distance_pts": round(price - qvwap, 2) if qvwap else None, "distance_atr_units": atr_dist(price, qvwap, atr)},
        "yearly":    {"vwap": yvwap, "posture": posture_label(price, yvwap), "distance_pts": round(price - yvwap, 2) if yvwap else None, "distance_atr_units": atr_dist(price, yvwap, atr)},
        "summary": summary,
    }

def get_risk_events(db: Session, days_ahead: int = 14):
    today = datetime.now(timezone.utc).date()
    cutoff = today + timedelta(days=days_ahead)
    events = db.query(EconomicEvent).filter(
        EconomicEvent.event_date >= today.isoformat(),
        EconomicEvent.event_date <= cutoff.isoformat(),
        EconomicEvent.impact == "HIGH",
    ).order_by(EconomicEvent.event_date).all()
    result = []
    fomc_days = None
    cpi_days  = None
    for e in events:
        try:
            edate = datetime.strptime(e.event_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        days_away = (edate - today).days
        if e.event_type == "FOMC" and fomc_days is None: fomc_days = days_away
        if e.event_type == "CPI"  and cpi_days  is None: cpi_days  = days_away
        result.append({
            "event_type": e.event_type, "event_name": e.event_name,
            "event_date": e.event_date, "event_time": e.event_time,
            "days_away": days_away, "impact": e.impact,
            "forecast": e.forecast, "previous": e.previous,
            "warning": f"{e.event_name} in {days_away} day{'s' if days_away != 1 else ''}" + (f" — {e.event_time}" if e.event_time else ""),
        })
    # Add earnings
    earn_events = db.query(EarningsEvent).filter(
        EarningsEvent.earnings_date >= today.isoformat(),
        EarningsEvent.earnings_date <= cutoff.isoformat(),
    ).order_by(EarningsEvent.earnings_date).all()
    earn_tickers = []
    for e in earn_events:
        try:
            edate = datetime.strptime(e.earnings_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        days_away = (edate - today).days
        earn_tickers.append(e.ticker)
        result.append({
            "event_type": "EARNINGS", "event_name": f"{e.ticker} Earnings",
            "event_date": e.earnings_date, "event_time": e.timing,
            "days_away": days_away, "impact": "HIGH",
            "warning": f"{e.ticker} earnings {e.timing or ''} — ES correlated name",
        })
    return result, fomc_days, cpi_days, earn_tickers

def build_weekly_plan_suggestion(vwap_posture, atr_regime, squeeze, risk_events, vix_regime) -> str:
    lines = []
    lines.append(vwap_posture.get("summary", ""))
    atr_pct = atr_regime.get("percentile_rank", 0.5)
    regime  = atr_regime.get("regime", "NORMAL")
    lines.append(f"ATR is in the {regime} regime at the {int(atr_pct*100)}th percentile.")
    if squeeze in ("long", "buy"):   lines.append("Squeeze is active bullish — momentum expanding.")
    elif squeeze in ("short","sell"): lines.append("Squeeze is active bearish — momentum expanding short.")
    fomc_warn = next((e for e in risk_events if e["event_type"] == "FOMC"), None)
    cpi_warn  = next((e for e in risk_events if e["event_type"] == "CPI"), None)
    if fomc_warn: lines.append(f"FOMC in {fomc_warn['days_away']} day(s) — reduce size, expect vol expansion.")
    if cpi_warn:  lines.append(f"CPI print in {cpi_warn['days_away']} day(s) — risk-off ahead of release.")
    earn_events = [e for e in risk_events if e["event_type"] == "EARNINGS"]
    if earn_events:
        tickers = ", ".join(e["event_name"].split()[0] for e in earn_events)
        lines.append(f"Earnings this week: {tickers} — be flat into announcements.")
    if vix_regime == "PANIC":   lines.append("VIX in PANIC — no directional trades, defensive only.")
    elif vix_regime == "FEAR":  lines.append("VIX elevated — reduce size, use wider stops.")
    return " ".join(lines)

def _get_trading_week_for(target: date):
    """Return (monday, friday, week_label) for the ISO week containing `target`."""
    weekday = target.weekday()  # 0=Mon, 6=Sun
    monday = target - timedelta(days=weekday) if weekday < 5 else target + timedelta(days=(7 - weekday))
    friday = monday + timedelta(days=4)
    week_label = monday.strftime("%G-W%V")
    return monday, friday, week_label

def _get_trading_week():
    return _get_trading_week_for(date.today())


def get_next_trading_day(from_date: date) -> date:
    """Return the next trading day after `from_date`, skipping weekends."""
    weekday = from_date.weekday()  # 0=Mon ... 6=Sun
    if weekday == 4:   # Friday → Monday
        return from_date + timedelta(days=3)
    elif weekday == 5: # Saturday → Monday
        return from_date + timedelta(days=2)
    elif weekday == 6: # Sunday → Monday
        return from_date + timedelta(days=1)
    else:              # Mon–Thu → next calendar day
        return from_date + timedelta(days=1)


def update_daily_levels(dvwap: Optional[float], wvwap: Optional[float], atr: Optional[float], db: Session, symbol: str = "ES") -> int:
    """Update only the 5 numeric level fields on remaining DailyForecast rows using live webhook data.
    Defensive: returns 0 if no WeeklyForecast exists. Does NOT commit — caller must commit."""
    if not (dvwap and wvwap and atr):
        return 0
    try:
        from zoneinfo import ZoneInfo
        today_et = datetime.now(ZoneInfo("America/New_York")).date()
    except ImportError:
        today_et = date.today()

    _, _, week_label = _get_trading_week_for(today_et)
    wf = db.query(WeeklyForecast).filter(WeeklyForecast.symbol == symbol, WeeklyForecast.week_label == week_label).first()
    if not wf:
        return 0

    lower_vwap = min(dvwap, wvwap)
    upper_vwap = max(dvwap, wvwap)
    support = round(lower_vwap - 0.5 * atr, 2)
    res = round(upper_vwap + 0.5 * atr, 2)
    max_loss = round(0.5 * atr, 2)

    remaining = (
        db.query(DailyForecast)
        .filter(
            DailyForecast.weekly_forecast_id == wf.id,
            DailyForecast.day_index == today_et.weekday(),
        )
        .all()
    )
    now = datetime.now(timezone.utc)
    for df in remaining:
        df.level_daily_vwap = dvwap
        df.level_weekly_vwap = wvwap
        df.level_support_1 = support
        df.level_resistance_1 = res
        df.max_loss_pts = max_loss
        df.updated_at = now

    logger.debug("update_daily_levels: patched today (day_index=%d) — dvwap=%.2f atr=%.2f", today_et.weekday(), dvwap, atr)
    return len(remaining)


async def refresh_next_day_forecast(db: Session, symbol: str = "ES") -> tuple:
    """Refresh the DailyForecast for the next trading day with current live data.
    On Friday evenings, upserts the full next-week WeeklyForecast instead."""
    try:
        from zoneinfo import ZoneInfo
        today_et = datetime.now(ZoneInfo("America/New_York")).date()
    except ImportError:
        today_et = date.today()  # fallback for Python < 3.9
    next_day = get_next_trading_day(today_et)

    # Friday 6PM → next day is Monday, create/update *next* week's full forecast
    if next_day.weekday() == 0:
        wf = await upsert_weekly_forecast(db, triggered_by="eod_advance", target_date=next_day, symbol=symbol)
        return wf, next_day

    # Otherwise: update only the target day's DailyForecast row
    monday, friday, week_label = _get_trading_week_for(today_et)
    wf = db.query(WeeklyForecast).filter(WeeklyForecast.symbol == symbol, WeeklyForecast.week_label == week_label).first()
    if not wf:
        wf = await upsert_weekly_forecast(db, triggered_by="eod_advance", symbol=symbol)
        return wf, next_day

    # Read fresh live data
    live_rows = db.query(LiveData).filter(LiveData.symbol == symbol).all()
    live_map = {r.key: r.value for r in live_rows}
    dvwap = live_map.get("vwap_daily")
    wvwap = live_map.get("vwap_weekly")
    atr_snap = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol).order_by(AtrSnapshot.computed_at.desc()).first()
    atr_val = atr_snap.atr_value if atr_snap else None
    latest_wh = _wh_filter(db.query(WebhookEvent), symbol).order_by(WebhookEvent.received_at.desc()).first()
    squeeze = latest_wh.squeeze if latest_wh else None
    mom_signal = "BULLISH" if squeeze in ("long", "buy") else "BEARISH" if squeeze in ("short", "sell") else "NEUTRAL"
    vix_val = _get_vix(db)
    vix_regime = get_vix_regime(vix_val)

    # Compute level fields once — same VWAP/ATR snapshot for all remaining days
    support = res = max_loss = None
    if dvwap and wvwap and atr_val:
        lower_vwap = min(dvwap, wvwap)
        upper_vwap = max(dvwap, wvwap)
        support = round(lower_vwap - 0.5 * atr_val, 2)
        res = round(upper_vwap + 0.5 * atr_val, 2)
        max_loss = round(0.5 * atr_val, 2)

    # Build per-day event map for the whole week
    risk_events, _, _, _ = get_risk_events(db, days_ahead=14)
    week_events_map = {}
    for e in risk_events:
        week_events_map.setdefault(e["event_date"], []).append(e)

    # Query only the next day's DailyForecast row
    remaining = (
        db.query(DailyForecast)
        .filter(
            DailyForecast.weekly_forecast_id == wf.id,
            DailyForecast.day_index == next_day.weekday(),
        )
        .order_by(DailyForecast.day_index)
        .all()
    )
    if not remaining:
        wf = await upsert_weekly_forecast(db, triggered_by="eod_advance", symbol=symbol)
        return wf, next_day

    weekly_bias = wf.weekly_bias or "NEUTRAL"
    now = datetime.now(timezone.utc)

    for df in remaining:
        day_events = week_events_map.get(df.day_date, [])
        has_hi = any(e["event_type"] in ("FOMC", "CPI", "NFP", "GDP") for e in day_events)

        if vix_regime == "PANIC":
            day_bias = "NEUTRAL"
            size_guide = "FLAT"
        elif has_hi:
            day_bias = "NEUTRAL"
            size_guide = "HALF SIZE"
        else:
            day_bias = weekly_bias
            size_guide = "FULL SIZE" if vix_regime in ("COMPLACENT", "ELEVATED") else "HALF SIZE"

        event_summary = ", ".join(e["event_name"] for e in day_events[:3]) if day_events else None
        day_narrative = f"{df.day_label}: Bias {day_bias}."
        if event_summary:
            day_narrative += f" Events: {event_summary}."
        day_narrative += f" Size: {size_guide}."
        if max_loss:
            day_narrative += f" Max loss: {max_loss} pts."

        df.level_daily_vwap = dvwap
        df.level_weekly_vwap = wvwap
        df.level_support_1 = support
        df.level_resistance_1 = res
        df.max_loss_pts = max_loss
        df.momentum_signal = mom_signal
        df.day_bias = day_bias
        df.size_guidance = size_guide
        df.event_summary = event_summary
        df.has_high_impact_event = has_hi
        df.day_narrative = day_narrative
        df.risk_events_json = json.dumps(day_events)
        df.updated_at = now

    db.commit()
    logger.info(
        "EOD advance: refreshed next-day row (day_index=%d, date=%s) — dvwap=%.2f ATR=%.2f",
        next_day.weekday(), next_day.isoformat(), dvwap or 0, atr_val or 0,
    )
    return wf, next_day


def _snapshot_weekly_forecast(db: Session, wf: WeeklyForecast, symbol: str = "ES") -> None:
    """
    Upsert a HistoricalSnapshot row for the given WeeklyForecast,
    then enforce the FIFO cap of 10 'forecast'-sourced rows.
    Failures are non-fatal — caller wraps in try/except.
    """
    from .models import HistoricalSnapshot

    fields = dict(
        symbol=symbol,
        date=wf.week_start_date,
        sheet=f"Week of {wf.week_start_date}",  # matches seed data format for chart x-axis
        contract=symbol,
        open=wf.as_of_price,       # chart reads h.open
        vwap_d=wf.vwap_daily,      # chart reads h.vwap_d
        vwap_w=wf.vwap_weekly,     # chart reads h.vwap_w
        vwap_m=wf.vwap_monthly,    # chart reads h.vwap_m
        vwap_quarterly=wf.vwap_quarterly,
        vwap_yearly=wf.vwap_yearly,
        posture=wf.vwap_posture_label,
        plan=wf.weekly_bias,
        week_label=wf.week_label,
        weekly_bias=wf.weekly_bias,
        atr_current=wf.atr_current,
        bull_entry=wf.bull_entry,
        bull_target=wf.bull_target,
        bull_stop=wf.bull_stop,
        bear_entry=wf.bear_entry,
        bear_target=wf.bear_target,
        bear_stop=wf.bear_stop,
        source="forecast",
    )

    # Upsert by (week_label, source)
    snap = db.query(HistoricalSnapshot).filter(
        HistoricalSnapshot.symbol == symbol,
        HistoricalSnapshot.week_label == wf.week_label,
        HistoricalSnapshot.source == "forecast",
    ).first()

    if snap:
        for k, v in fields.items():
            setattr(snap, k, v)
    else:
        snap = HistoricalSnapshot(**fields)
        db.add(snap)

    db.flush()

    # FIFO: keep only the 10 most recent forecast weeks (ordered by week_label, not id)
    forecast_rows = (
        db.query(HistoricalSnapshot)
        .filter(HistoricalSnapshot.symbol == symbol, HistoricalSnapshot.source == "forecast")
        .order_by(HistoricalSnapshot.week_label.asc())
        .all()
    )
    if len(forecast_rows) > 10:
        overflow = forecast_rows[: len(forecast_rows) - 10]
        for old in overflow:
            db.delete(old)
        db.flush()
        logger.info("FIFO: pruned %d old historical snapshot(s), kept 10", len(overflow))


async def upsert_weekly_forecast(db: Session, triggered_by: str = "manual", target_date: date = None, symbol: str = "ES") -> WeeklyForecast:
    if target_date is not None:
        monday, friday, week_label = _get_trading_week_for(target_date)
    else:
        monday, friday, week_label = _get_trading_week()
    now = datetime.now(timezone.utc)
    try:
        from zoneinfo import ZoneInfo
        today_et = datetime.now(ZoneInfo("America/New_York")).date()
    except ImportError:
        today_et = date.today()

    # Live data
    live_rows = db.query(LiveData).filter(LiveData.symbol == symbol).all()
    live_map = {r.key: r.value for r in live_rows}
    price = live_map.get(SYMBOL_CONFIG[symbol]["price_key"])
    vix_val = _get_vix(db)
    dvwap = live_map.get("vwap_daily")
    wvwap = live_map.get("vwap_weekly")
    mvwap = live_map.get("vwap_monthly")
    qvwap = live_map.get("vwap_quarterly")
    yvwap = live_map.get("vwap_yearly")

    # Latest ATR snapshot
    atr_snap = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == symbol).order_by(AtrSnapshot.computed_at.desc()).first()
    atr_val = atr_snap.atr_value if atr_snap else None
    atr_regime = atr_snap.regime if atr_snap else None

    # Latest squeeze state
    latest_wh = _wh_filter(db.query(WebhookEvent), symbol).order_by(WebhookEvent.received_at.desc()).first()
    squeeze = latest_wh.squeeze if latest_wh else None

    # VWAP posture
    vwap_posture = compute_vwap_posture(price, atr_val, db, symbol) if price is not None else {"summary": "No price data"}

    # Regime signals
    vix_regime = get_vix_regime(vix_val)
    mom_signal = "BULLISH" if squeeze in ("long", "buy") else "BEARISH" if squeeze in ("short", "sell") else "NEUTRAL"

    # Weekly bias from VWAP stack
    summary_text = vwap_posture.get("summary", "")
    if "FULL BULL" in summary_text or "MIXED BULL" in summary_text:
        weekly_bias = "BULL"
    elif "FULL BEAR" in summary_text or "MIXED BEAR" in summary_text:
        weekly_bias = "BEAR"
    else:
        weekly_bias = "NEUTRAL"

    # Risk events for this week
    risk_events, fomc_days, cpi_days, earn_tickers = get_risk_events(db, days_ahead=14)
    has_fomc = any(e["event_type"] == "FOMC" for e in risk_events)
    has_cpi = any(e["event_type"] == "CPI" for e in risk_events)

    # Bull / Bear scenarios (ATR-based)
    if price and atr_val and atr_val > 0:
        bull_entry = price
        bull_target = round(price + 2 * atr_val, 2)
        bull_stop = round(price - 0.5 * atr_val, 2)
        bear_entry = price
        bear_target = round(price - 2 * atr_val, 2)
        bear_stop = round(price + 0.5 * atr_val, 2)
    else:
        bull_entry = bull_target = bull_stop = None
        bear_entry = bear_target = bear_stop = None

    # Weekly narrative
    parts = [summary_text] if summary_text else []
    if atr_regime:
        parts.append(f"ATR regime: {atr_regime}.")
    if vix_val:
        parts.append(f"VIX {vix_val:.2f} — {vix_regime}.")
    if has_fomc:
        parts.append("FOMC this week — expect volatility expansion and wide ranges.")
    if has_cpi:
        parts.append("CPI this week — risk-off ahead of release.")
    if earn_tickers:
        parts.append(f"Key earnings: {', '.join(earn_tickers[:5])}.")
    if weekly_bias == "BULL":
        parts.append("Bias BULL — look for pullbacks to VWAP for long entries.")
    elif weekly_bias == "BEAR":
        parts.append("Bias BEAR — look for rallies to VWAP for short entries.")
    narrative = " ".join(parts)

    # Upsert WeeklyForecast — query first so we can preserve week-open scenario levels
    wf = db.query(WeeklyForecast).filter(WeeklyForecast.symbol == symbol, WeeklyForecast.week_label == week_label).first()
    is_week_open = triggered_by in ("scheduler", "sunday_open") or wf is None or wf.bull_entry is None

    # Preserve existing scenario levels in JSON when not a week-open trigger
    existing_fj = {}
    if wf and not is_week_open:
        try:
            existing_fj = json.loads(wf.forecast_json) if wf.forecast_json else {}
        except Exception:
            existing_fj = {}

    forecast_json_data = {
        "week_label": week_label,
        "as_of_price": price if is_week_open else existing_fj.get("as_of_price", price),
        "vwap_posture": vwap_posture,
        "vix_regime": vix_regime,
        "atr_regime": atr_regime,
        "momentum": {
            "squeeze_state": squeeze,
            "signal": mom_signal,
            "histogram": latest_wh.ttm_wave_a if latest_wh else None,
            "wave_a": latest_wh.ttm_wave_b if latest_wh else None,
        },
        "risk_events": risk_events,
        "weekly_bias": weekly_bias,
        "narrative": narrative,
        "bull_scenario": (
            {"entry": bull_entry, "target": bull_target, "stop": bull_stop, "r_r": 4.0}
            if is_week_open and bull_entry else existing_fj.get("bull_scenario")
        ),
        "bear_scenario": (
            {"entry": bear_entry, "target": bear_target, "stop": bear_stop, "r_r": 4.0}
            if is_week_open and bear_entry else existing_fj.get("bear_scenario")
        ),
    }

    # Price-anchored scenario levels are frozen after initial week-open generation.
    scenario_fields = dict(
        as_of_price=price,
        atr_current=atr_val,
        bull_entry=bull_entry, bull_target=bull_target, bull_stop=bull_stop,
        bear_entry=bear_entry, bear_target=bear_target, bear_stop=bear_stop,
    ) if is_week_open else {}

    wf_fields = dict(
        as_of_vix=vix_val,
        vwap_daily=dvwap, vwap_weekly=wvwap, vwap_monthly=mvwap,
        vwap_quarterly=qvwap, vwap_yearly=yvwap,
        weekly_bias=weekly_bias,
        vwap_posture_label=summary_text or None,
        atr_regime=atr_regime,
        vix_current=vix_val, vix_regime=vix_regime,
        squeeze_state=squeeze, momentum_signal=mom_signal,
        has_fomc_this_week=has_fomc, has_cpi_this_week=has_cpi,
        triggered_by=triggered_by,
        forecast_json=json.dumps(forecast_json_data),
        updated_at=now,
        **scenario_fields,
    )
    if wf:
        for k, v in wf_fields.items():
            setattr(wf, k, v)
    else:
        wf = WeeklyForecast(
            symbol=symbol,
            week_label=week_label,
            week_start_date=monday.isoformat(),
            week_end_date=friday.isoformat(),
            generated_at=now,
            **wf_fields,
        )
        db.add(wf)
    db.flush()

    # Build day-level event map for the week
    week_events_map: dict[str, list] = {}
    for e in risk_events:
        edate = e["event_date"]
        week_events_map.setdefault(edate, []).append(e)

    day_labels_list = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    for i, day_label in enumerate(day_labels_list):
        day_date_obj = monday + timedelta(days=i)
        day_date = day_date_obj.isoformat()
        day_events = week_events_map.get(day_date, [])
        has_hi = any(e["event_type"] in ("FOMC", "CPI", "NFP", "GDP") for e in day_events)

        if vix_regime == "PANIC":
            day_bias = "NEUTRAL"
            size_guide = "FLAT"
        elif has_hi:
            day_bias = "NEUTRAL"
            size_guide = "HALF SIZE"
        else:
            day_bias = weekly_bias
            size_guide = "FULL SIZE" if vix_regime in ("COMPLACENT", "ELEVATED") else "HALF SIZE"

        event_summary = ", ".join(e["event_name"] for e in day_events[:3]) if day_events else None

        # Key levels — populate up to and including the target date.
        # target_date is set when called from an EOD advance or Sunday open, meaning
        # that day's plan should be populated with current live data.
        effective_today = target_date if target_date is not None else today_et
        is_future_day = day_date_obj > effective_today
        if is_future_day:
            day_dvwap = day_wvwap = support = res = max_loss = None
        else:
            day_dvwap = dvwap
            day_wvwap = wvwap
            support = res = max_loss = None
            if dvwap and wvwap and atr_val:
                lower_vwap = min(dvwap, wvwap)
                upper_vwap = max(dvwap, wvwap)
                support = round(lower_vwap - 0.5 * atr_val, 2)
                res = round(upper_vwap + 0.5 * atr_val, 2)
                max_loss = round(0.5 * atr_val, 2)

        day_narrative = f"{day_label}: Bias {day_bias}."
        if event_summary:
            day_narrative += f" Events: {event_summary}."
        day_narrative += f" Size: {size_guide}."
        if max_loss:
            day_narrative += f" Max loss: {max_loss} pts."

        df = db.query(DailyForecast).filter(
            DailyForecast.symbol == symbol,
            DailyForecast.weekly_forecast_id == wf.id,
            DailyForecast.day_index == i,
        ).first()
        df_fields = dict(
            day_date=day_date, day_label=day_label,
            event_summary=event_summary,
            has_high_impact_event=has_hi,
            day_bias=day_bias, size_guidance=size_guide,
            level_daily_vwap=day_dvwap, level_weekly_vwap=day_wvwap,
            level_support_1=support, level_resistance_1=res,
            max_loss_pts=max_loss, momentum_signal=mom_signal,
            day_narrative=day_narrative,
            risk_events_json=json.dumps(day_events),
            updated_at=now,
        )
        if df:
            for k, v in df_fields.items():
                setattr(df, k, v)
        else:
            db.add(DailyForecast(
                symbol=symbol,
                weekly_forecast_id=wf.id,
                day_index=i,
                generated_at=now,
                **df_fields,
            ))

    db.commit()
    db.refresh(wf)

    # Auto-snapshot into HistoricalSnapshot (FIFO, max 10 forecast rows)
    try:
        _snapshot_weekly_forecast(db, wf, symbol)
        db.commit()
    except Exception as exc:
        logger.warning("Historical snapshot failed (non-fatal): %s", exc)

    logger.info("Weekly forecast upserted: %s (triggered_by=%s)", week_label, triggered_by)
    return wf


def compute_day_type(
    price: Optional[float],
    pdc: Optional[float],
    rth_open: Optional[float],
    vwap_posture_summary: str,
    atr_regime: str,
    vix_regime: str,
    squeeze_state: Optional[str],
    has_high_impact_event_today: bool,
) -> dict:
    # Guard: no price means we can't compute gap — return safe default
    if not price:
        return {"type": "RANGE_DAY", "confidence": 0.20, "implication":
                "Insufficient price data — defaulting to range day stance. Reduce size until data arrives.",
                "gap_pts": None, "gap_pct": None}
    # Step 1: gap
    if pdc and pdc > 0:
        ref = rth_open if rth_open else price
        gap_pts = ref - pdc
        gap_pct = gap_pts / pdc * 100
    else:
        gap_pts = 0.0
        gap_pct = 0.0

    # Step 2: posture flags
    posture_bull = "BULL" in vwap_posture_summary
    posture_bear = "BEAR" in vwap_posture_summary
    posture_full_bull = "FULL BULL" in vwap_posture_summary
    posture_full_bear = "FULL BEAR" in vwap_posture_summary

    # Step 3: gap alignment — only meaningful when there's an actual gap (>0.1%)
    has_gap = abs(gap_pct) > 0.1
    gap_dir_bull = gap_pct > 0
    gap_aligned = has_gap and ((gap_dir_bull and posture_bull) or (not gap_dir_bull and posture_bear))
    gap_opposed = has_gap and not gap_aligned

    # Step 4: scores
    elevated = 0
    if vix_regime in ("FEAR", "PANIC"):       elevated += 4
    if has_high_impact_event_today:            elevated += 4
    if atr_regime == "EXPANDED":               elevated += 2

    trend = 0
    if abs(gap_pct) >= 0.3 and gap_aligned:   trend += 3
    if posture_full_bull or posture_full_bear: trend += 3
    if atr_regime == "EXPANDED":               trend += 2
    if squeeze_state in ("long", "short"):     trend += 2

    gap_go = 0
    if abs(gap_pct) >= 0.3:                   gap_go += 4
    if gap_aligned:                            gap_go += 3
    if atr_regime in ("NORMAL", "EXPANDED"):   gap_go += 2
    if squeeze_state in ("long", "short"):     gap_go += 1

    gap_fade = 0
    if abs(gap_pct) >= 0.3:                   gap_fade += 3
    if gap_opposed:                            gap_fade += 4
    if atr_regime == "COMPRESSED":             gap_fade += 2
    if vix_regime in ("ELEVATED", "FEAR"):     gap_fade += 1

    range_day = 0
    if abs(gap_pct) < 0.15:                   range_day += 3
    if atr_regime == "COMPRESSED":             range_day += 3
    if not posture_full_bull and not posture_full_bear: range_day += 2
    if squeeze_state not in ("long", "short"): range_day += 2

    # Step 5: winner
    IMPLICATIONS = {
        "TREND_DAY":    ("Conditions favor a directional trend day — trade in the direction of the VWAP stack and gap. "
                         "Let winners run; avoid fading early moves and look for pullbacks to VWAP as re-entries."),
        "GAP_AND_GO":   ("Gap is opening in the direction of VWAP posture — favor continuation on the first 15-minute breakout. "
                         "Target prior day's range extension; cut quickly if price reverses to fill the gap."),
        "GAP_AND_FADE": ("Gap is opening against VWAP structure — look to fade the gap into prior day's close zone. "
                         "Use a tight stop above/below the Globex extreme; first 30 minutes are key for confirmation."),
        "RANGE_DAY":    ("Market is likely to rotate within a defined range — sell the top of the PDH/PDL range and buy the bottom. "
                         "Reduce size, avoid breakout trades, and respect both sides of VWAP anchors as acceptance zones."),
        "ELEVATED_VOL": ("High-impact event risk is elevated — reduce position size to half and widen stops to avoid noise. "
                         "Wait for the event to pass before initiating directional trades; be prepared for sudden range expansion."),
    }

    if elevated >= 5:
        winner = "ELEVATED_VOL"
        confidence = min(1.0, elevated / 8.0)
    else:
        candidates = {"TREND_DAY": trend, "GAP_AND_GO": gap_go, "GAP_AND_FADE": gap_fade, "RANGE_DAY": range_day}
        winner = max(candidates, key=candidates.get)
        confidence = min(1.0, candidates[winner] / 8.0)
    confidence = max(0.20, confidence)

    return {
        "type": winner,
        "confidence": round(confidence, 2),
        "implication": IMPLICATIONS[winner],
        "gap_pts": round(gap_pts, 2),
        "gap_pct": round(gap_pct, 3),
    }


async def generate_intelligence_report(db: Session, webhook_event: WebhookEvent,
                                       atr_snapshot: Optional[AtrSnapshot],
                                       atr_stats: dict, triggered_by: str = "webhook",
                                       symbol: str = "ES") -> IntelligenceReport:
    price = webhook_event.close
    atr   = webhook_event.atr
    squeeze = webhook_event.squeeze

    # Read VWAP values from LiveData
    vwap_posture = compute_vwap_posture(price, atr, db, symbol) if price is not None else {"summary": "No price data"}

    # ATR regime
    atr_regime_data = {}
    if atr_snapshot:
        atr_regime_data = {
            "current_atr": atr, "regime": atr_snapshot.regime,
            "percentile_rank": atr_snapshot.percentile_rank,
            "rolling_20_avg": atr_snapshot.rolling_20_avg,
            "rolling_20_max": atr_snapshot.rolling_20_max,
            "rolling_20_min": atr_snapshot.rolling_20_min,
            "weekly_high": atr_stats.get("weekly_high"), "weekly_low": atr_stats.get("weekly_low"),
            "monthly_high": atr_stats.get("monthly_high"), "monthly_low": atr_stats.get("monthly_low"),
        }

    # VIX (GLOBAL)
    vix_val  = _get_vix(db)
    vix_regime = get_vix_regime(vix_val)

    # Risk events
    risk_events, fomc_days, cpi_days, earn_tickers = get_risk_events(db)

    # Momentum
    mom_signal = "BULLISH" if squeeze in ("long","buy") else "BEARISH" if squeeze in ("short","sell") else "NEUTRAL"

    # Weekly plan text
    plan_text = build_weekly_plan_suggestion(vwap_posture, atr_regime_data, squeeze, risk_events, vix_regime)

    # Day type classification
    pdc_row = db.query(LiveData).filter(LiveData.symbol == symbol, LiveData.key == "pdc").first()
    rth_open_row = db.query(LiveData).filter(LiveData.symbol == symbol, LiveData.key == "rth_open").first()
    pdc_val = pdc_row.value if pdc_row else None
    rth_open_val = rth_open_row.value if rth_open_row else None
    has_event_today = any(e.get("days_away") == 0 for e in risk_events)
    day_type_result = compute_day_type(
        price if price else None, pdc_val, rth_open_val,
        vwap_posture.get("summary", ""),
        atr_snapshot.regime if atr_snapshot else "NORMAL",
        vix_regime or "ELEVATED",
        squeeze,
        has_event_today,
    )

    report_data = {
        "report_id": None,  # filled after insert
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "triggered_by": triggered_by,
        "as_of_price": price,
        "vwap_posture": vwap_posture,
        "atr_regime": atr_regime_data,
        "momentum": {
            "squeeze_state": squeeze,
            "signal": mom_signal,
            "histogram": webhook_event.ttm_wave_a,  # TTM Squeeze momentum histogram (val)
            "wave_a": webhook_event.ttm_wave_b,     # TTM Wave A histogram
        },
        "vix": {"current": vix_val, "regime": vix_regime},
        "risk_events_this_week": risk_events,
        "weekly_plan_suggestion": plan_text,
        "day_type": day_type_result,
        "data_quality": {
            "webhook_event_count": db.query(WebhookEvent).count(),
            "vwap_source": "tradingview_webhook",
            "vix_source": "yfinance" if vix_val is not None else "unknown",
        }
    }

    report = IntelligenceReport(
        symbol=symbol,
        triggered_by=triggered_by,
        webhook_event_id=webhook_event.id,
        vwap_daily_posture=vwap_posture.get("daily", {}).get("posture"),
        vwap_weekly_posture=vwap_posture.get("weekly", {}).get("posture"),
        vwap_monthly_posture=vwap_posture.get("monthly", {}).get("posture"),
        atr_current=atr,
        atr_regime=atr_snapshot.regime if atr_snapshot else None,
        atr_percentile=atr_snapshot.percentile_rank if atr_snapshot else None,
        atr_weekly_high=atr_stats.get("weekly_high"),
        atr_monthly_high=atr_stats.get("monthly_high"),
        momentum_signal=mom_signal,
        fomc_days_away=fomc_days,
        cpi_days_away=cpi_days,
        vix_current=vix_val,
        vix_regime=vix_regime,
        report_json=json.dumps(report_data),
        day_type=day_type_result["type"],
        day_type_confidence=day_type_result["confidence"],
        day_type_implication=day_type_result["implication"],
        gap_pts=day_type_result["gap_pts"],
        gap_pct=day_type_result["gap_pct"],
    )
    return report
