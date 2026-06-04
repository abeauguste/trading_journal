import asyncio
import hashlib
import logging
import os
import re
from datetime import datetime, timezone, timedelta
from time import mktime
from typing import Optional
from sqlalchemy.orm import Session
from .models import EconomicEvent, EarningsEvent, VixHistory, LiveData, NewsItem

logger = logging.getLogger("fetchers")

TRACKED_ES_MOVERS = ["AAPL","MSFT","NVDA","META","AMZN","GOOGL","TSLA","JPM","GS","NFLX","AMD"]
FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY", "")

HIGH_IMPACT_KEYWORDS = ["fomc","federal reserve","fed","cpi","consumer price","ppi","producer price",
                        "nfp","nonfarm","non-farm","gdp","gross domestic","jobs","unemployment","payroll"]

def classify_event_type(name: str) -> str:
    n = name.lower()
    if "fomc" in n or "federal reserve" in n or "fed " in n: return "FOMC"
    if "cpi" in n or "consumer price" in n: return "CPI"
    if "ppi" in n or "producer price" in n: return "PPI"
    if "nonfarm" in n or "non-farm" in n or "payroll" in n or "nfp" in n: return "NFP"
    if "gdp" in n or "gross domestic" in n: return "GDP"
    if "unemployment" in n or "jobless" in n or "jobs" in n: return "JOBS"
    return "OTHER"

def classify_impact(name: str, finnhub_impact: str = "") -> str:
    if finnhub_impact in ("high", "3"): return "HIGH"
    if finnhub_impact in ("medium", "2"): return "MEDIUM"
    n = name.lower()
    for kw in ["fomc","federal reserve","cpi","nonfarm","gdp"]:
        if kw in n: return "HIGH"
    for kw in ["ppi","unemployment","retail sales","ism"]:
        if kw in n: return "MEDIUM"
    return "LOW"

async def fetch_economic_calendar(db: Session, days_ahead: int = 30) -> int:
    today = datetime.now(timezone.utc).date()
    end = today + timedelta(days=days_ahead)
    count = 0

    if FINNHUB_KEY:
        try:
            import finnhub
            client = finnhub.Client(api_key=FINNHUB_KEY)
            data = client.economic_calendar()
            events = data.get("economicCalendar", []) if isinstance(data, dict) else []
            for e in events:
                event_date_str = e.get("time", "")[:10]
                if not event_date_str:
                    continue
                try:
                    event_date = datetime.strptime(event_date_str, "%Y-%m-%d").date()
                except ValueError:
                    continue
                if event_date < today or event_date > end:
                    continue
                name = e.get("event", "") or ""
                etype = classify_event_type(name)
                impact = classify_impact(name, str(e.get("impact", "")))
                existing = db.query(EconomicEvent).filter(
                    EconomicEvent.event_type == etype,
                    EconomicEvent.event_date == event_date_str
                ).first()
                if existing:
                    existing.forecast = str(e.get("estimate", "")) or existing.forecast
                    existing.actual   = str(e.get("actual", ""))   or existing.actual
                    existing.fetched_at = datetime.now(timezone.utc)
                else:
                    db.add(EconomicEvent(
                        event_name=name, event_type=etype,
                        event_date=event_date_str,
                        event_time=e.get("time", "")[-5:] if len(e.get("time","")) > 10 else None,
                        impact=impact, forecast=str(e.get("estimate","")),
                        actual=str(e.get("actual","")), previous=str(e.get("prev","")),
                        source="finnhub",
                    ))
                    count += 1
            db.commit()
            logger.info("Economic calendar: %d new events from Finnhub", count)
            return count
        except Exception as exc:
            logger.warning("Finnhub economic calendar failed: %s — falling back to FRED", exc)

    # FRED fallback — hardcoded 2026 high-impact event schedule
    # Sources: Fed Reserve, BLS, BEA public release calendars
    FALLBACK_EVENTS = [
        # FOMC decision Wednesdays (Fed announces at 2pm ET; meetings are Tue–Wed)
        ("2026-06-17", "FOMC", "FOMC Rate Decision",   "14:00 ET", "HIGH"),
        ("2026-07-29", "FOMC", "FOMC Rate Decision",   "14:00 ET", "HIGH"),
        ("2026-09-16", "FOMC", "FOMC Rate Decision",   "14:00 ET", "HIGH"),
        ("2026-10-28", "FOMC", "FOMC Rate Decision",   "14:00 ET", "HIGH"),
        ("2026-12-09", "FOMC", "FOMC Rate Decision",   "14:00 ET", "HIGH"),
        # NFP — Non-Farm Payrolls (BLS, first Friday of month, 8:30 ET)
        ("2026-06-05", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-07-10", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-08-07", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-09-04", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-10-02", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-11-06", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        ("2026-12-04", "NFP",  "Non-Farm Payrolls",    "08:30 ET", "HIGH"),
        # CPI — Consumer Price Index (BLS, mid-month, 8:30 ET)
        ("2026-06-10", "CPI",  "CPI (May)",            "08:30 ET", "HIGH"),
        ("2026-07-14", "CPI",  "CPI (Jun)",            "08:30 ET", "HIGH"),
        ("2026-08-12", "CPI",  "CPI (Jul)",            "08:30 ET", "HIGH"),
        ("2026-09-10", "CPI",  "CPI (Aug)",            "08:30 ET", "HIGH"),
        ("2026-10-13", "CPI",  "CPI (Sep)",            "08:30 ET", "HIGH"),
        ("2026-11-12", "CPI",  "CPI (Oct)",            "08:30 ET", "HIGH"),
        ("2026-12-10", "CPI",  "CPI (Nov)",            "08:30 ET", "HIGH"),
        # GDP — Advance estimate (BEA, ~30 days after quarter end, 8:30 ET)
        ("2026-07-30", "GDP",  "GDP Advance (Q2)",     "08:30 ET", "HIGH"),
        ("2026-10-29", "GDP",  "GDP Advance (Q3)",     "08:30 ET", "HIGH"),
    ]

    for d, etype, ename, etime, impact in FALLBACK_EVENTS:
        try:
            event_date = datetime.strptime(d, "%Y-%m-%d").date()
        except ValueError:
            continue
        if today <= event_date <= end:
            existing = db.query(EconomicEvent).filter(
                EconomicEvent.event_type == etype,
                EconomicEvent.event_date == d,
            ).first()
            if not existing:
                db.add(EconomicEvent(
                    event_name=ename, event_type=etype,
                    event_date=d, event_time=etime,
                    impact=impact, source="fred_fallback",
                ))
                count += 1
    db.commit()
    logger.info("Economic calendar: %d events from FRED fallback", count)
    return count

async def fetch_earnings_calendar(db: Session, weeks_ahead: int = 2) -> int:
    today = datetime.now(timezone.utc).date()
    end = today + timedelta(weeks=weeks_ahead)
    count = 0

    if FINNHUB_KEY:
        try:
            import finnhub
            client = finnhub.Client(api_key=FINNHUB_KEY)
            data = client.earnings_calendar(
                _from=today.isoformat(), to=end.isoformat(), symbol=""
            )
            earnings = data.get("earningsCalendar", []) if isinstance(data, dict) else []
            for e in earnings:
                ticker = e.get("symbol", "")
                if ticker not in TRACKED_ES_MOVERS:
                    continue
                edate = e.get("date", "")
                existing = db.query(EarningsEvent).filter(
                    EarningsEvent.ticker == ticker,
                    EarningsEvent.earnings_date == edate
                ).first()
                if not existing:
                    db.add(EarningsEvent(
                        ticker=ticker, company_name=e.get("company",""),
                        earnings_date=edate,
                        timing="AMC" if e.get("hour","") == "amc" else "BMO" if e.get("hour","") == "bmo" else "TNS",
                        eps_estimate=e.get("epsEstimate"), revenue_estimate=e.get("revenueEstimate"),
                        source="finnhub",
                    ))
                    count += 1
            db.commit()
            logger.info("Earnings calendar: %d new events", count)
            return count
        except Exception as exc:
            logger.warning("Finnhub earnings calendar failed: %s", exc)

    # yfinance fallback
    try:
        import yfinance as yf
        for ticker in TRACKED_ES_MOVERS:
            try:
                t = yf.Ticker(ticker)
                cal = t.calendar
                if cal is None:
                    continue
                if hasattr(cal, 'columns') and 'Earnings Date' in cal.columns:
                    edate_raw = cal['Earnings Date'].iloc[0] if len(cal) > 0 else None
                elif isinstance(cal, dict) and 'Earnings Date' in cal:
                    edate_raw = cal['Earnings Date']
                else:
                    continue
                if edate_raw is None:
                    continue
                import pandas as pd
                if isinstance(edate_raw, (list, pd.DatetimeTZDtype)):
                    edate_raw = edate_raw[0] if len(edate_raw) > 0 else None
                if edate_raw is None:
                    continue
                edate_str = str(edate_raw)[:10]
                try:
                    edate_obj = datetime.strptime(edate_str, "%Y-%m-%d").date()
                except ValueError:
                    continue
                if today <= edate_obj <= end:
                    existing = db.query(EarningsEvent).filter(
                        EarningsEvent.ticker == ticker,
                        EarningsEvent.earnings_date == edate_str
                    ).first()
                    if not existing:
                        db.add(EarningsEvent(
                            ticker=ticker, earnings_date=edate_str,
                            timing="TNS", source="yfinance",
                        ))
                        count += 1
            except Exception:
                pass
        db.commit()
    except Exception as exc:
        logger.warning("yfinance earnings fallback failed: %s", exc)

    return count

async def fetch_vix_history(db: Session, days: int = 30) -> int:
    try:
        import yfinance as yf
        df = yf.download("^VIX", period=f"{days}d", interval="1d", progress=False, auto_adjust=True)
        if df is None or len(df) == 0:
            logger.warning("yfinance returned empty VIX data")
            return 0
        count = 0
        latest_close = None
        for idx, row in df.iterrows():
            date_str = str(idx)[:10]
            close_val = float(row["Close"]) if hasattr(row["Close"], "__float__") else None
            if close_val is None:
                continue
            latest_close = close_val
            existing = db.query(VixHistory).filter(VixHistory.date == date_str).first()
            if existing:
                existing.vix_close = close_val
                existing.fetched_at = datetime.now(timezone.utc)
            else:
                db.add(VixHistory(
                    date=date_str,
                    vix_open=float(row.get("Open", close_val)),
                    vix_high=float(row.get("High", close_val)),
                    vix_low=float(row.get("Low", close_val)),
                    vix_close=close_val,
                    source="yfinance",
                ))
                count += 1
        if latest_close is not None:
            from .symbols import upsert_live, GLOBAL_SYMBOL
            upsert_live(db, GLOBAL_SYMBOL, "vix", latest_close, "yfinance", datetime.now(timezone.utc))
        db.commit()
        logger.info("VIX history: %d new rows, latest close=%.2f", count, latest_close or 0)
        return count
    except Exception as exc:
        logger.error("fetch_vix_history failed: %s", exc)
        return 0

async def fetch_vix_live(db: Session) -> Optional[float]:
    """Fetch most recent intraday VIX quote (1-minute bars, ~15-min delayed).
    Updates the vix LiveData key. Called every 15 minutes during market hours."""
    try:
        import yfinance as yf
        df = yf.download("^VIX", period="1d", interval="1m", progress=False, auto_adjust=True)
        if df is None or len(df) == 0:
            return None
        latest_close = float(df["Close"].iloc[-1])
        from .symbols import upsert_live, GLOBAL_SYMBOL
        upsert_live(db, GLOBAL_SYMBOL, "vix", latest_close, "yfinance_live", datetime.now(timezone.utc))
        db.commit()
        logger.info("VIX live quote: %.2f", latest_close)
        return latest_close
    except Exception as exc:
        logger.warning("fetch_vix_live failed: %s", exc)
        return None


async def bootstrap_if_empty(db: Session) -> None:
    econ_count = db.query(EconomicEvent).count()
    vix_count = db.query(VixHistory).count()
    if econ_count == 0:
        logger.info("Bootstrap: fetching economic calendar (first run)")
        await fetch_economic_calendar(db, days_ahead=60)
    if vix_count == 0:
        logger.info("Bootstrap: fetching VIX history (first run)")
        await fetch_vix_history(db, days=30)
    # Always refresh earnings on startup
    await fetch_earnings_calendar(db, weeks_ahead=2)

    # Generate weekly forecast if one doesn't exist for the current week
    from datetime import date, timedelta
    from .models import WeeklyForecast
    today = date.today()
    weekday = today.weekday()
    monday = today - timedelta(days=weekday) if weekday < 5 else today + timedelta(days=(7 - weekday))
    week_label = monday.strftime("%G-W%V")
    existing = db.query(WeeklyForecast).filter(WeeklyForecast.week_label == week_label).first()
    if not existing:
        logger.info("Bootstrap: generating initial weekly forecast for %s", week_label)
        from .intelligence import upsert_weekly_forecast
        await upsert_weekly_forecast(db, triggered_by="bootstrap")

# ---------------------------------------------------------------------------
# News aggregation — RSS fetch + Claude scoring
# ---------------------------------------------------------------------------

_TITLE_SUFFIX_RE = re.compile(r'\s+[-–|]\s+\S.*$')

NEWS_RSS_SOURCES = [
    ("Google News — Tariffs/Trade",  "https://news.google.com/rss/search?q=trump+tariff+china+trade&hl=en-US&gl=US&ceid=US:en"),
    ("Google News — Fed",            "https://news.google.com/rss/search?q=federal+reserve+interest+rate&hl=en-US&gl=US&ceid=US:en"),
    ("Google News — Geopolitical",   "https://news.google.com/rss/search?q=geopolitical+risk+war+sanctions&hl=en-US&gl=US&ceid=US:en"),
    ("Google News — S&P Futures",    "https://news.google.com/rss/search?q=s%26p+500+futures+market&hl=en-US&gl=US&ceid=US:en"),
    ("Reuters Business",             "https://feeds.reuters.com/reuters/businessNews"),
    ("Reuters Top News",             "https://feeds.reuters.com/reuters/topNews"),
]

NEWS_RETENTION_HOURS = 168   # 7 days — covers full trading week on Weekly tab
NEWS_MIN_SCORE       = 7
NEWS_BATCH_SIZE      = 30    # max headlines per Claude call


def _normalize_title(title: str) -> str:
    t = (title or "").strip()
    t = _TITLE_SUFFIX_RE.sub("", t)          # strip " - Reuters" suffixes
    return re.sub(r'\s+', ' ', t).lower()


def _title_hash(title: str) -> str:
    return hashlib.sha256(_normalize_title(title).encode()).hexdigest()


def _parse_published(entry) -> Optional[datetime]:
    for key in ("published_parsed", "updated_parsed"):
        tm = entry.get(key)
        if tm:
            try:
                return datetime.fromtimestamp(mktime(tm), tz=timezone.utc)
            except Exception:
                pass
    return None


def _fetch_all_feeds() -> list:
    """Synchronous RSS fetch — called via asyncio.to_thread."""
    try:
        import feedparser
    except ImportError:
        logger.error("feedparser not installed — run: pip install feedparser")
        return []

    items = []
    for source_name, url in NEWS_RSS_SOURCES:
        try:
            parsed = feedparser.parse(url)
            for entry in parsed.entries[:25]:
                title = (entry.get("title") or "").strip()
                if not title:
                    continue
                items.append({
                    "source":       source_name,
                    "title":        title,
                    "url":          entry.get("link"),
                    "summary":      (entry.get("summary") or "")[:500],
                    "published_at": _parse_published(entry),
                })
        except Exception as exc:
            logger.warning("RSS fetch failed for %s: %s", source_name, exc)
    return items


async def fetch_and_score_news(db: Session) -> int:
    """Fetch RSS feeds, dedupe, score via Claude, store items scoring >= 7.
    Returns count of new items inserted. Never raises."""
    from .intelligence import score_news_headlines

    # 1. Fetch all feeds (blocking I/O → thread)
    raw = await asyncio.to_thread(_fetch_all_feeds)
    if not raw:
        logger.info("News fetch: no items returned from feeds")
        return 0

    # 2. Deduplicate within batch and against DB (last 7 days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    existing_hashes = {
        row.title_hash
        for row in db.query(NewsItem.title_hash)
                     .filter(NewsItem.fetched_at >= cutoff)
                     .all()
    }

    seen_in_batch: set = set()
    fresh = []
    for item in raw:
        h = _title_hash(item["title"])
        if h in existing_hashes or h in seen_in_batch:
            continue
        seen_in_batch.add(h)
        item["title_hash"] = h
        fresh.append(item)

    if not fresh:
        logger.info("News fetch: 0 new headlines after dedup")
        _prune_old_news(db)
        return 0

    logger.info("News fetch: %d new headlines to score", len(fresh))

    # 3. Score in batches via Claude
    inserted = 0
    now = datetime.now(timezone.utc)

    for batch_start in range(0, len(fresh), NEWS_BATCH_SIZE):
        chunk = fresh[batch_start:batch_start + NEWS_BATCH_SIZE]
        headlines = [item["title"] for item in chunk]
        try:
            scored = await score_news_headlines(headlines)
        except Exception as exc:
            logger.error("News scoring batch failed: %s", exc)
            continue

        for item, result in zip(chunk, scored):
            score = result.get("score", 0)
            if score < NEWS_MIN_SCORE:
                continue
            try:
                db.add(NewsItem(
                    title=item["title"][:500],
                    title_hash=item["title_hash"],
                    source=item["source"],
                    url=item["url"],
                    summary=item["summary"],
                    score=score,
                    bias=result.get("bias", "NEUTRAL"),
                    reason=result.get("reason", "")[:200],
                    published_at=item["published_at"],
                    fetched_at=now,
                ))
                inserted += 1
            except Exception as exc:
                logger.warning("News insert failed for '%s': %s", item["title"][:60], exc)
                db.rollback()

    db.commit()
    logger.info("News fetch: inserted %d items (score >= %d)", inserted, NEWS_MIN_SCORE)

    _prune_old_news(db)
    return inserted


def _prune_old_news(db: Session) -> None:
    """Delete NewsItem rows older than NEWS_RETENTION_HOURS."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=NEWS_RETENTION_HOURS)
    deleted = db.query(NewsItem).filter(NewsItem.fetched_at < cutoff).delete()
    if deleted:
        db.commit()
        logger.info("News FIFO: pruned %d items older than %dh", deleted, NEWS_RETENTION_HOURS)
