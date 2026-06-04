import json
import logging
import os
from datetime import datetime, timezone, timedelta, date

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import WebhookEvent, LiveData, VixHistory, DailyBar
from ..schemas import WebhookPayload, WebhookEventOut, WebhookEventsResponse
from ..websocket_manager import manager
from ..symbols import SYMBOL_CONFIG, validate_symbol, resolve_symbol_from_ticker, upsert_live, get_vix, GLOBAL_SYMBOL

router = APIRouter()
logger = logging.getLogger("webhook")

# Optional secret key — set env var WEBHOOK_SECRET to enforce validation.
# If not set, all payloads are accepted (useful during dev).
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")


def _classify_session(tv_time_ms: Optional[str]) -> tuple:
    """Returns (session_type, trade_date_et).
    session_type: 'RTH' | 'GLOBEX' | 'PRE' | 'UNKNOWN'
    trade_date_et: the RTH session date this bar belongs to."""
    if not tv_time_ms:
        return "UNKNOWN", None
    try:
        from zoneinfo import ZoneInfo
        # tv_time is Unix milliseconds as a string; fall back gracefully if ISO string
        try:
            ts = int(tv_time_ms) / 1000
        except (ValueError, TypeError):
            return "UNKNOWN", None
        dt_utc = datetime.fromtimestamp(ts, tz=timezone.utc)
        dt_et = dt_utc.astimezone(ZoneInfo("America/New_York"))
        h, m = dt_et.hour, dt_et.minute
        t_min = h * 60 + m
        rth_open_min  = 9  * 60 + 30   # 570
        rth_close_min = 16 * 60         # 960

        if rth_open_min <= t_min < rth_close_min:
            return "RTH", dt_et.date()
        elif t_min >= rth_close_min:
            # After 4pm — belongs to NEXT trading day's globex
            next_date = dt_et.date() + timedelta(days=1)
            while next_date.weekday() >= 5:  # skip weekends
                next_date += timedelta(days=1)
            return "GLOBEX", next_date
        else:
            # Before 9:30 — pre-market, belongs to today's RTH session
            return "PRE", dt_et.date()
    except Exception:
        return "UNKNOWN", None


def _monday_of(d):
    from datetime import timedelta as _td
    return d - _td(days=d.weekday())


def _update_daily_bar(payload, session: str, trade_date, db: Session, now, symbol: str = "ES"):
    if trade_date is None or session == "UNKNOWN":
        return

    from zoneinfo import ZoneInfo
    try:
        today_et = datetime.now(ZoneInfo("America/New_York")).date()
    except ImportError:
        today_et = date.today()

    def _ul(key, val):
        upsert_live(db, symbol, key, val, "tradingview", now)

    bar = db.query(DailyBar).filter(DailyBar.symbol == symbol, DailyBar.trade_date == trade_date.isoformat()).first()

    if session == "RTH":
        if bar is None:
            # First RTH bar today
            # Determine if it's the first day of the week / month
            is_week_first = trade_date.weekday() == 0  # Monday
            is_month_first = trade_date.day == 1

            # Get weekly/monthly open from prior bars if not first
            weekly_open = payload.open if is_week_first else None
            monthly_open = payload.open if is_month_first else None

            # If not week/month first, carry forward from most recent bar
            latest = None
            if not is_week_first or not is_month_first:
                latest = db.query(DailyBar).filter(DailyBar.symbol == symbol).order_by(DailyBar.trade_date.desc()).first()
                if latest:
                    if not is_week_first:
                        weekly_open = latest.weekly_open
                    if not is_month_first:
                        monthly_open = latest.monthly_open

            bar = DailyBar(
                symbol=symbol,
                trade_date=trade_date.isoformat(),
                rth_open=payload.open,
                rth_high=payload.high or payload.close,
                rth_low=payload.low or payload.close,
                rth_close=payload.close,
                rth_open_time=payload.time,
                is_week_first_day=is_week_first,
                is_month_first_day=is_month_first,
                weekly_open=weekly_open,
                monthly_open=monthly_open,
                updated_at=now,
            )
            db.add(bar)

            if is_week_first and payload.open:
                _ul("weekly_open", payload.open)
            if is_month_first and payload.open:
                _ul("monthly_open", payload.open)

            # Prior Week High/Low (Feature 4)
            if is_week_first:
                from datetime import timedelta as _td
                _pwm = _monday_of(trade_date) - _td(days=7)
                _pwf = _pwm + _td(days=4)
                _pwbars = db.query(DailyBar).filter(
                    DailyBar.symbol == symbol,
                    DailyBar.trade_date >= _pwm.isoformat(),
                    DailyBar.trade_date <= _pwf.isoformat(),
                    DailyBar.rth_sealed == True,
                ).all()
                _highs = [b.rth_high for b in _pwbars if b.rth_high is not None]
                _lows = [b.rth_low for b in _pwbars if b.rth_low is not None]
                if _highs: bar.pwh = max(_highs)
                if _lows: bar.pwl = min(_lows)
            else:
                # carry forward from the most-recent bar ('latest' is set above
                # whenever not is_week_first, which holds in this branch)
                _latest_pw = latest if latest is not None else db.query(DailyBar).filter(DailyBar.symbol == symbol).order_by(DailyBar.trade_date.desc()).first()
                if _latest_pw:
                    bar.pwh = _latest_pw.pwh
                    bar.pwl = _latest_pw.pwl
            if bar.pwh is not None: _ul("pwh", bar.pwh)
            if bar.pwl is not None: _ul("pwl", bar.pwl)
        else:
            # Update rolling RTH high/low
            if payload.high and (bar.rth_high is None or payload.high > bar.rth_high):
                bar.rth_high = payload.high
            if payload.low and (bar.rth_low is None or payload.low < bar.rth_low):
                bar.rth_low = payload.low
            bar.rth_close = payload.close
            bar.updated_at = now

        # Update live_data keys for current RTH session
        _ul("rth_high", bar.rth_high)
        _ul("rth_low", bar.rth_low)
        _ul("rth_open", bar.rth_open)

        # Opening Range tracking (Feature 1) — runs for both new and existing bars
        try:
            from zoneinfo import ZoneInfo
            _ts = int(payload.time) / 1000
            _dt_et = datetime.fromtimestamp(_ts, tz=timezone.utc).astimezone(ZoneInfo("America/New_York"))
            _tmin = _dt_et.hour * 60 + _dt_et.minute
            # OR5 (09:30-09:35)
            if _tmin < 9*60+35:
                if not bar.or5_sealed:
                    if payload.high is not None:
                        bar.or5_high = payload.high if bar.or5_high is None else max(bar.or5_high, payload.high)
                    if payload.low is not None:
                        bar.or5_low = payload.low if bar.or5_low is None else min(bar.or5_low, payload.low)
            elif not bar.or5_sealed:
                bar.or5_sealed = True
            _ul("or5_high", bar.or5_high)
            _ul("or5_low", bar.or5_low)
            # OR15 (09:30-09:45)
            if _tmin < 9*60+45:
                if not bar.or15_sealed:
                    if payload.high is not None:
                        bar.or15_high = payload.high if bar.or15_high is None else max(bar.or15_high, payload.high)
                    if payload.low is not None:
                        bar.or15_low = payload.low if bar.or15_low is None else min(bar.or15_low, payload.low)
            elif not bar.or15_sealed:
                bar.or15_sealed = True
            _ul("or15_high", bar.or15_high)
            _ul("or15_low", bar.or15_low)
        except Exception:
            pass

        # Check if PDH/PDL/PDC needs promoting (i.e., yesterday's bar was sealed or missing from live_data)
        # Find yesterday's sealed bar
        yesterday = trade_date - timedelta(days=1)
        while yesterday.weekday() >= 5:
            yesterday -= timedelta(days=1)
        pdh_row = db.query(LiveData).filter(LiveData.symbol == symbol, LiveData.key == "pdh").first()
        # Promote if pdh is missing or stale
        if pdh_row is None or pdh_row.value is None:
            yesterday_bar = db.query(DailyBar).filter(DailyBar.symbol == symbol, DailyBar.trade_date == yesterday.isoformat()).first()
            if yesterday_bar:
                _ul("pdh", yesterday_bar.rth_high)
                _ul("pdl", yesterday_bar.rth_low)
                _ul("pdc", yesterday_bar.rth_close or yesterday_bar.rth_high)

    elif session in ("GLOBEX", "PRE"):
        if bar is None:
            bar = DailyBar(symbol=symbol, trade_date=trade_date.isoformat(), updated_at=now)
            db.add(bar)
        if bar.globex_open is None and session == "GLOBEX":
            bar.globex_open = payload.open
            # When Globex starts (first bar after 4pm), promote prior day's RTH to PDH/PDL/PDC
            prior_date = trade_date - timedelta(days=1)
            while prior_date.weekday() >= 5:
                prior_date -= timedelta(days=1)
            prior_bar = db.query(DailyBar).filter(DailyBar.symbol == symbol, DailyBar.trade_date == prior_date.isoformat()).first()
            if prior_bar and not prior_bar.rth_sealed:
                _ul("pdh", prior_bar.rth_high)
                _ul("pdl", prior_bar.rth_low)
                _ul("pdc", prior_bar.rth_close or prior_bar.rth_high)
                prior_bar.rth_sealed = True
                prior_bar.updated_at = now
        if payload.high and (bar.globex_high is None or payload.high > bar.globex_high):
            bar.globex_high = payload.high
        if payload.low and (bar.globex_low is None or payload.low < bar.globex_low):
            bar.globex_low = payload.low
        bar.updated_at = now

        _ul("globex_high", bar.globex_high)
        _ul("globex_low", bar.globex_low)


async def _process_webhook(symbol: str, request: Request, db: Session):
    # Log raw body first so we can see exactly what TradingView sends
    try:
        raw = await request.body()
        raw_str = raw.decode("utf-8")
        logger.info("Webhook received (%s): %s", symbol, raw_str)
        body = json.loads(raw_str)
    except Exception as exc:
        logger.error("Failed to parse webhook body: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {exc}")

    # Validate with Pydantic (extra fields are ignored)
    try:
        payload = WebhookPayload(**body)
    except Exception as exc:
        logger.error("Payload validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))

    # Secret key check (only enforced when WEBHOOK_SECRET env var is set)
    if WEBHOOK_SECRET and payload.secret_key != WEBHOOK_SECRET:
        logger.warning("Webhook rejected — bad secret key: %s", payload.secret_key)
        raise HTTPException(status_code=403, detail="Invalid secret key")

    cfg = SYMBOL_CONFIG[symbol]

    # Normalise squeeze/signal field (different Pine Scripts use different names)
    squeeze_val = payload.squeeze or payload.signal

    # Persist event
    event = WebhookEvent(
        ticker=payload.ticker,
        open=payload.open,
        high=payload.high,
        low=payload.low,
        close=payload.close,
        volume=payload.volume,
        vwap=payload.vwap,
        atr=payload.atr,
        squeeze=squeeze_val,
        ttm_wave_a=payload.ttm_wave_a,
        ttm_wave_b=payload.ttm_wave_b,
        tv_time=payload.time,
        received_at=datetime.now(timezone.utc),
    )
    db.add(event)

    now = datetime.now(timezone.utc)

    def _upsert_live(key: str, value: float):
        upsert_live(db, symbol, key, value, "tradingview", now)

    # Upsert live price + OHLC + VWAP anchors
    if payload.open is not None:
        _upsert_live(cfg["open_key"], payload.open)
    if payload.high is not None:
        _upsert_live(cfg["high_key"], payload.high)
    if payload.low is not None:
        _upsert_live(cfg["low_key"], payload.low)
    if payload.close is not None:
        _upsert_live(cfg["price_key"], payload.close)
    if payload.vwap is not None:
        _upsert_live("vwap_daily", payload.vwap)
    if payload.vwap_weekly is not None:
        _upsert_live("vwap_weekly", payload.vwap_weekly)
    if payload.vwap_monthly is not None:
        _upsert_live("vwap_monthly", payload.vwap_monthly)
    if payload.vwap_quarterly is not None:
        _upsert_live("vwap_quarterly", payload.vwap_quarterly)
    if payload.vwap_yearly is not None:
        _upsert_live("vwap_yearly", payload.vwap_yearly)
    if payload.atr is not None:
        _upsert_live("atr", payload.atr)
    if payload.ttm_wave_a is not None:
        _upsert_live("ttm_wave_a", payload.ttm_wave_a)
    if payload.ttm_wave_b is not None:
        _upsert_live("ttm_wave_b", payload.ttm_wave_b)

    # Use flush to get event.id without committing — lets us link snapshot/report in one transaction.
    db.flush()

    # Session detection + DailyBar update
    session_type, trade_date_et = _classify_session(payload.time)
    try:
        _update_daily_bar(payload, session_type, trade_date_et, db, now, symbol)
    except Exception as _dbar_exc:
        # Race condition or IntegrityError on simultaneous inserts — non-fatal
        logger.warning("_update_daily_bar failed (non-fatal): %s", _dbar_exc)
        db.rollback()

    # ATR snapshot + intelligence
    atr_snapshot = None
    atr_stats = {}
    intel_report = None
    if payload.atr is not None:
        from ..intelligence import compute_atr_snapshot, generate_intelligence_report
        atr_snapshot, atr_stats = compute_atr_snapshot(event, db, symbol)
        if atr_snapshot is not None:
            db.add(atr_snapshot)
            db.flush()
        intel_report = await generate_intelligence_report(
            db=db, webhook_event=event,
            atr_snapshot=atr_snapshot, atr_stats=atr_stats,
            triggered_by="webhook", symbol=symbol,
        )
        db.add(intel_report)

    # Daily plan population: only triggered by the 6pm Globex webhook.
    # RTH webhooks never touch the daily plan — once a plan is set it is frozen.
    # The 6pm webhook populates the NEXT trading day's plan if it is blank.
    levels_patched = False
    if session_type == "GLOBEX" and payload.vwap is not None and payload.vwap_weekly is not None and payload.atr is not None:
        try:
            from ..intelligence import refresh_next_day_forecast
            from ..models import DailyForecast, WeeklyForecast as WF
            from zoneinfo import ZoneInfo
            _today_et = datetime.now(ZoneInfo("America/New_York")).date()
            _next = _today_et + timedelta(days=1)
            while _next.weekday() >= 5:
                _next += timedelta(days=1)
            _wf = db.query(WF).filter(
                WF.symbol == symbol,
                WF.week_start_date <= _next.isoformat(),
                WF.week_end_date   >= _next.isoformat()
            ).first()
            if _wf:
                _df = db.query(DailyForecast).filter(
                    DailyForecast.weekly_forecast_id == _wf.id,
                    DailyForecast.day_index == _next.weekday(),
                ).first()
                if _df and _df.level_daily_vwap is None:
                    await refresh_next_day_forecast(db, symbol)
                    levels_patched = True
                    logger.info("6pm Globex webhook (%s): populated %s plan", symbol, _next.isoformat())
        except Exception as exc:
            logger.warning("Globex next-day plan populate failed (non-fatal): %s", exc)

    db.commit()

    if atr_snapshot is not None and payload.atr is not None and intel_report is not None:
        # Parse the intelligence report JSON so the WS broadcast uses the same
        # field names and structure that the frontend intelligence components expect.
        report_parsed = json.loads(intel_report.report_json)
        momentum = report_parsed.get("momentum", {})
        await manager.broadcast(json.dumps({
            "type": "intelligence_update",
            "symbol": symbol,
            "atr_regime": report_parsed.get("atr_regime", {}),
            "vwap_analysis": report_parsed.get("vwap_posture", {}),
            "momentum_summary": [{
                "timeframe": "Live",
                "signal": momentum.get("signal", "NEUTRAL"),
                "squeeze_state": momentum.get("squeeze_state"),
                "histogram": momentum.get("histogram"),
                "wave_a": momentum.get("wave_a"),
            }],
            "vix": report_parsed.get("vix", {}),
            "weekly_plan": report_parsed.get("weekly_plan_suggestion", ""),
            "day_type": report_parsed.get("day_type"),
        }))

    live_rows = {r.key: r for r in db.query(LiveData).filter(
        LiveData.symbol == symbol,
        LiveData.key.in_([cfg["price_key"], "vwap_daily", "vwap_weekly", "vwap_monthly", "vwap_quarterly", "vwap_yearly"])
    ).all()}

    msg = json.dumps({
        "type": "price_update",
        "symbol": symbol,
        "price": live_rows[cfg["price_key"]].value if cfg["price_key"] in live_rows else None,
        "vix": get_vix(db),
        "source": "tradingview",
        "atr": payload.atr,
        "squeeze": squeeze_val,
        "ttm_wave_a": payload.ttm_wave_a,
        "ttm_wave_b": payload.ttm_wave_b,
        "ticker": payload.ticker,
        "vwap": live_rows["vwap_daily"].value if "vwap_daily" in live_rows else None,
        "vwap_weekly": live_rows["vwap_weekly"].value if "vwap_weekly" in live_rows else None,
        "vwap_monthly": live_rows["vwap_monthly"].value if "vwap_monthly" in live_rows else None,
        "vwap_quarterly": live_rows["vwap_quarterly"].value if "vwap_quarterly" in live_rows else None,
        "vwap_yearly": live_rows["vwap_yearly"].value if "vwap_yearly" in live_rows else None,
        "open": payload.open,
        "high": payload.high,
        "low": payload.low,
        "volume": payload.volume,
        "tv_time": payload.time,
        "session": session_type,
    })
    await manager.broadcast(msg)
    if levels_patched:
        await manager.broadcast(json.dumps({"type": "forecast_updated", "symbol": symbol}))

    logger.info("Webhook processed — symbol=%s ticker=%s close=%s squeeze=%s event_id=%s",
                symbol, payload.ticker, payload.close, squeeze_val, event.id)
    return {"status": "ok", "event_id": event.id, "received": body}


@router.post("/es")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    return await _process_webhook("ES", request, db)


@router.post("/nq")
async def receive_webhook_nq(request: Request, db: Session = Depends(get_db)):
    return await _process_webhook("NQ", request, db)


@router.post("/test")
async def test_webhook(db: Session = Depends(get_db)):
    """Fire a synthetic webhook to verify the full pipeline end-to-end."""
    fake = {
        "ticker": "ES1!", "open": 5800.0, "high": 5820.0,
        "low": 5790.0, "close": 5810.5, "volume": 100000,
        "vwap": 5805.0, "atr": 42.0, "squeeze": "long",
        "time": datetime.now(timezone.utc).isoformat(),
        "secret_key": WEBHOOK_SECRET or "test",
        "strategy_name": "TEST",
    }
    payload = WebhookPayload(**fake)
    event = WebhookEvent(
        ticker=payload.ticker, open=payload.open, high=payload.high,
        low=payload.low, close=payload.close, volume=payload.volume,
        vwap=payload.vwap, atr=payload.atr, squeeze=payload.squeeze,
        tv_time=payload.time, received_at=datetime.now(timezone.utc),
    )
    db.add(event)
    now = datetime.now(timezone.utc)
    upsert_live(db, "ES", "es_price", payload.close, "tradingview", now)
    db.commit()
    msg = json.dumps({
        "type": "price_update", "symbol": "ES", "price": payload.close,
        "vix": None, "source": "tradingview",
        "squeeze": payload.squeeze, "ticker": payload.ticker,
    })
    await manager.broadcast(msg)
    return {"status": "ok", "event_id": event.id, "payload": fake}


class VixPayload(BaseModel):
    # Accept {"vix": 18.5} or full ES-style payload {"close": 18.5, ...}
    vix:        Optional[float] = None
    close:      Optional[float] = None   # fallback when ES Pine Script used on VIX chart
    secret_key: Optional[str]  = None
    time:       Optional[str]  = None

    class Config:
        extra = "allow"   # ignore all other ES fields (ticker, open, high, atr, etc.)


@router.post("/vix")
async def receive_vix_webhook(request: Request, db: Session = Depends(get_db)):
    """TradingView webhook for CBOE:VIX.
    Accepts {"vix": {{close}}} or the full ES Pine Script payload with {{close}}."""
    try:
        raw = await request.body()
        # TradingView sometimes sends NaN (invalid JSON) — replace before parsing
        body = json.loads(raw.decode("utf-8").replace(":NaN", ":null").replace(":nan", ":null"))
        logger.info("VIX webhook received: %s", body)
    except Exception as exc:
        logger.error("VIX webhook — failed to parse body: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}")

    try:
        payload = VixPayload(**body)
    except Exception as exc:
        logger.error("VIX webhook — payload validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))

    if WEBHOOK_SECRET and payload.secret_key != WEBHOOK_SECRET:
        logger.warning("VIX webhook rejected — bad secret key")
        raise HTTPException(status_code=403, detail="Invalid secret key")

    # Resolve VIX value: prefer explicit "vix" field, fall back to "close"
    vix_value = payload.vix if payload.vix is not None else payload.close
    if vix_value is None:
        raise HTTPException(status_code=422, detail="Payload must contain 'vix' or 'close'")

    now = datetime.now(timezone.utc)

    # Update LiveData key="vix" under the GLOBAL symbol
    upsert_live(db, GLOBAL_SYMBOL, "vix", vix_value, "tradingview_vix", now)

    # Upsert today's VixHistory row so the daily chart stays current
    date_str = now.strftime("%Y-%m-%d")
    hist = db.query(VixHistory).filter(VixHistory.date == date_str).first()
    if hist:
        hist.vix_close = vix_value
        hist.fetched_at = now
    else:
        db.add(VixHistory(
            date=date_str,
            vix_open=vix_value,
            vix_high=vix_value,
            vix_low=vix_value,
            vix_close=vix_value,
            source="tradingview_vix",
        ))

    db.commit()

    # Broadcast updated VIX to all connected clients
    await manager.broadcast(json.dumps({
        "type": "price_update",
        "vix": vix_value,
        "source": "tradingview_vix",
    }))

    logger.info("VIX webhook processed — vix=%.2f", vix_value)
    return {"status": "ok", "vix": vix_value}


@router.get("/events", response_model=WebhookEventsResponse)
def get_webhook_events(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    total = db.query(WebhookEvent).count()
    events = (
        db.query(WebhookEvent)
        .order_by(WebhookEvent.received_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return WebhookEventsResponse(
        events=[WebhookEventOut.model_validate(e) for e in events],
        total=total,
    )
