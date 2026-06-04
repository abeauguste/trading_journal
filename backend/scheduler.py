import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .symbols import ACTIVE_SYMBOLS, upsert_live

logger = logging.getLogger("scheduler")
scheduler = AsyncIOScheduler()

def setup_scheduler():
    @scheduler.scheduled_job(CronTrigger(hour=6, minute=0, timezone="America/New_York"))
    async def daily_calendar_refresh():
        from .fetchers import fetch_economic_calendar, fetch_earnings_calendar
        from .database import SessionLocal
        db = SessionLocal()
        try:
            await fetch_economic_calendar(db, days_ahead=30)
            await fetch_earnings_calendar(db)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(hour=16, minute=30, timezone="America/New_York"))
    async def daily_vix_fetch():
        from .fetchers import fetch_vix_history
        from .database import SessionLocal
        db = SessionLocal()
        try:
            await fetch_vix_history(db, days=5)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(day_of_week="mon", hour=7, minute=0, timezone="America/New_York"))
    async def weekly_earnings_refresh():
        from .fetchers import fetch_earnings_calendar
        from .database import SessionLocal
        db = SessionLocal()
        try:
            await fetch_earnings_calendar(db, weeks_ahead=2)
        finally:
            db.close()

    # VIX live quote every 15 minutes during regular + extended hours (Mon-Fri 9:00-17:00 ET)
    @scheduler.scheduled_job(CronTrigger(
        day_of_week="mon-fri", hour="9-16", minute="*/15", timezone="America/New_York"
    ))
    async def vix_live_refresh():
        from .fetchers import fetch_vix_live
        from .database import SessionLocal
        from .websocket_manager import manager
        import json
        db = SessionLocal()
        try:
            vix_val = await fetch_vix_live(db)
            if vix_val is not None:
                await manager.broadcast(json.dumps({
                    "type": "price_update",
                    "vix": vix_val,
                    "source": "yfinance_live",
                }))
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(day_of_week="sun", hour=18, minute=0, timezone="America/New_York"))
    async def sunday_open_weekly():
        """Sunday 6pm ET — ES futures week opens. Generate weekly forecast + populate Monday's plan."""
        from .fetchers import fetch_economic_calendar, fetch_earnings_calendar
        from .intelligence import upsert_weekly_forecast
        from .websocket_manager import manager
        from datetime import timedelta
        from zoneinfo import ZoneInfo
        import json
        from .database import SessionLocal
        db = SessionLocal()
        try:
            await fetch_economic_calendar(db, days_ahead=30)
            await fetch_earnings_calendar(db, weeks_ahead=2)
            # Compute next Monday so upsert treats it as the "current" day,
            # populating Monday's plan levels with tonight's VWAP/ATR data.
            today_et = datetime.now(ZoneInfo("America/New_York")).date()
            next_monday = today_et + timedelta(days=1)
            while next_monday.weekday() != 0:
                next_monday += timedelta(days=1)
            for sym in ACTIVE_SYMBOLS:
                try:
                    wf = await upsert_weekly_forecast(db, triggered_by="sunday_open", target_date=next_monday, symbol=sym)
                    await manager.broadcast(json.dumps({"type": "forecast_updated", "symbol": sym, "week_label": wf.week_label}))
                except Exception as exc:
                    logger.error("sunday_open_weekly[%s] failed: %s", sym, exc)
            logger.info("Sunday open: weekly forecast + Monday plan populated")
        except Exception as exc:
            logger.error("sunday_open_weekly failed: %s", exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(day_of_week="mon", hour=7, minute=30, timezone="America/New_York"))
    async def weekly_forecast_refresh():
        from .intelligence import upsert_weekly_forecast
        from .websocket_manager import manager
        import json
        from .database import SessionLocal
        db = SessionLocal()
        try:
            for sym in ACTIVE_SYMBOLS:
                try:
                    wf = await upsert_weekly_forecast(db, triggered_by="scheduler", symbol=sym)
                    await manager.broadcast(json.dumps({"type": "forecast_updated", "symbol": sym, "week_label": wf.week_label}))
                except Exception as exc:
                    logger.error("weekly_forecast_refresh[%s] failed: %s", sym, exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(hour=18, minute=0, timezone="America/New_York", day_of_week="mon-fri"))
    async def eod_day_advance():
        from .intelligence import refresh_next_day_forecast
        from .websocket_manager import manager
        import json
        from .database import SessionLocal
        db = SessionLocal()
        try:
            for sym in ACTIVE_SYMBOLS:
                try:
                    wf, next_day = await refresh_next_day_forecast(db, symbol=sym)
                    await manager.broadcast(json.dumps({
                        "type": "forecast_updated",
                        "symbol": sym,
                        "next_day": next_day.isoformat(),
                    }))
                except Exception as exc:
                    logger.error("eod_day_advance[%s] failed: %s", sym, exc)
        finally:
            db.close()

    # News aggregation — every 60 minutes, offset to :07 past the hour
    @scheduler.scheduled_job(
        CronTrigger(minute=7, timezone="America/New_York"),
        max_instances=1,
        misfire_grace_time=300,
    )
    async def hourly_news_refresh():
        from .fetchers import fetch_and_score_news
        from .database import SessionLocal
        db = SessionLocal()
        try:
            await fetch_and_score_news(db)
        except Exception as exc:
            logger.error("hourly_news_refresh failed: %s", exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(hour=16, minute=5, day_of_week="mon-fri", timezone="America/New_York"))
    async def seal_prior_rth_session():
        from .models import DailyBar, LiveData
        from .database import SessionLocal
        from zoneinfo import ZoneInfo
        db = SessionLocal()
        try:
            today_et = datetime.now(ZoneInfo("America/New_York")).date()
            for sym in ACTIVE_SYMBOLS:
                try:
                    bar = db.query(DailyBar).filter(DailyBar.symbol == sym, DailyBar.trade_date == today_et.isoformat()).first()
                    if bar and not bar.rth_sealed:
                        now = datetime.now(timezone.utc)
                        bar.rth_sealed = True
                        bar.updated_at = now
                        upsert_live(db, sym, "pdh", bar.rth_high, "tradingview", now)
                        upsert_live(db, sym, "pdl", bar.rth_low, "tradingview", now)
                        upsert_live(db, sym, "pdc", bar.rth_close or bar.rth_high, "tradingview", now)
                        db.commit()
                        logger.info("seal_prior_rth_session[%s]: sealed %s pdh=%.2f pdl=%.2f pdc=%.2f",
                                   sym, today_et, bar.rth_high or 0, bar.rth_low or 0, bar.rth_close or 0)
                except Exception as exc:
                    logger.error("seal_prior_rth_session[%s] failed: %s", sym, exc)
        except Exception as exc:
            logger.error("seal_prior_rth_session failed: %s", exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(hour=9, minute=35, day_of_week="mon-fri", timezone="America/New_York"))
    async def seal_or5():
        from .models import DailyBar, LiveData
        from .database import SessionLocal
        from zoneinfo import ZoneInfo
        db = SessionLocal()
        try:
            today_et = datetime.now(ZoneInfo("America/New_York")).date()
            for sym in ACTIVE_SYMBOLS:
                try:
                    bar = db.query(DailyBar).filter(DailyBar.symbol == sym, DailyBar.trade_date == today_et.isoformat()).first()
                    if bar and not bar.or5_sealed:
                        now = datetime.now(timezone.utc)
                        bar.or5_sealed = True
                        bar.updated_at = now
                        upsert_live(db, sym, "or5_high", bar.or5_high, "scheduler", now)
                        upsert_live(db, sym, "or5_low", bar.or5_low, "scheduler", now)
                        db.commit()
                        logger.info("seal_or5[%s]: sealed %s or5_high=%.2f or5_low=%.2f",
                                    sym, today_et, bar.or5_high or 0, bar.or5_low or 0)
                except Exception as exc:
                    logger.error("seal_or5[%s] failed: %s", sym, exc)
        except Exception as exc:
            logger.error("seal_or5 failed: %s", exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(hour=9, minute=45, day_of_week="mon-fri", timezone="America/New_York"))
    async def seal_or15():
        from .models import DailyBar, LiveData
        from .database import SessionLocal
        from zoneinfo import ZoneInfo
        db = SessionLocal()
        try:
            today_et = datetime.now(ZoneInfo("America/New_York")).date()
            for sym in ACTIVE_SYMBOLS:
                try:
                    bar = db.query(DailyBar).filter(DailyBar.symbol == sym, DailyBar.trade_date == today_et.isoformat()).first()
                    if bar and not bar.or15_sealed:
                        now = datetime.now(timezone.utc)
                        bar.or15_sealed = True
                        bar.updated_at = now
                        upsert_live(db, sym, "or15_high", bar.or15_high, "scheduler", now)
                        upsert_live(db, sym, "or15_low", bar.or15_low, "scheduler", now)
                        db.commit()
                        logger.info("seal_or15[%s]: sealed %s or15_high=%.2f or15_low=%.2f",
                                    sym, today_et, bar.or15_high or 0, bar.or15_low or 0)
                except Exception as exc:
                    logger.error("seal_or15[%s] failed: %s", sym, exc)
        except Exception as exc:
            logger.error("seal_or15 failed: %s", exc)
        finally:
            db.close()

    @scheduler.scheduled_job(CronTrigger(day_of_week="mon", hour=7, minute=0, timezone="America/New_York"))
    async def monday_pwh_pwl_bootstrap():
        from .models import DailyBar, LiveData
        from .database import SessionLocal
        from zoneinfo import ZoneInfo
        from datetime import timedelta
        db = SessionLocal()
        try:
            today_et = datetime.now(ZoneInfo("America/New_York")).date()
            prior_monday = today_et - timedelta(days=7)
            prior_friday = prior_monday + timedelta(days=4)
            now = datetime.now(timezone.utc)
            for sym in ACTIVE_SYMBOLS:
                try:
                    prior_bars = db.query(DailyBar).filter(
                        DailyBar.symbol == sym,
                        DailyBar.trade_date >= prior_monday.isoformat(),
                        DailyBar.trade_date <= prior_friday.isoformat(),
                        DailyBar.rth_sealed == True,
                    ).all()
                    if not prior_bars:
                        logger.info("monday_pwh_pwl_bootstrap[%s]: no sealed bars for prior week", sym)
                        continue
                    highs = [b.rth_high for b in prior_bars if b.rth_high is not None]
                    lows = [b.rth_low for b in prior_bars if b.rth_low is not None]
                    pwh = max(highs) if highs else None
                    pwl = min(lows) if lows else None
                    upsert_live(db, sym, "pwh", pwh, "scheduler", now)
                    upsert_live(db, sym, "pwl", pwl, "scheduler", now)
                    today_bar = db.query(DailyBar).filter(DailyBar.symbol == sym, DailyBar.trade_date == today_et.isoformat()).first()
                    if today_bar:
                        if pwh is not None: today_bar.pwh = pwh
                        if pwl is not None: today_bar.pwl = pwl
                        today_bar.updated_at = now
                    db.commit()
                    logger.info("monday_pwh_pwl_bootstrap[%s]: pwh=%.2f pwl=%.2f", sym, pwh or 0, pwl or 0)
                except Exception as exc:
                    logger.error("monday_pwh_pwl_bootstrap[%s] failed: %s", sym, exc)
        except Exception as exc:
            logger.error("monday_pwh_pwl_bootstrap failed: %s", exc)
        finally:
            db.close()

    scheduler.start()
    logger.info("Scheduler started")
