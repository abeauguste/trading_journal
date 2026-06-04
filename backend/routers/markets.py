import math
from datetime import datetime, date, timedelta, timezone
from statistics import mean

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import VixHistory, LiveData, AtrSnapshot
from ..intelligence import get_vix_regime
from ..symbols import SYMBOL_CONFIG, validate_symbol, get_vix

router = APIRouter()

# All values sourced from LiveData (updated by real webhooks only) or
# AtrSnapshot (created only by real /webhook/es calls, never by /webhook/test).
# No WebhookEvent queries — that table includes synthetic test rows.

LIVE_KEYS = ["es_open", "es_high", "es_low", "es_price", "vix", "ttm_wave_a"]


def _live(rows: dict, key: str):
    row = rows.get(key)
    return row.value if row is not None else None


@router.get("/regime")
def get_markets_regime(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    cfg = SYMBOL_CONFIG[sym]
    # ------------------------------------------------------------------ VIX --
    vix_rows = list(reversed(
        db.query(VixHistory).order_by(VixHistory.date.desc()).limit(20).all()
    ))

    trs = []
    for i, row in enumerate(vix_rows):
        h, l = row.vix_high, row.vix_low
        if h is None or l is None:
            continue
        if i == 0:
            tr = h - l
        else:
            prev_c = vix_rows[i - 1].vix_close
            tr = max(h - l, abs(h - prev_c), abs(l - prev_c)) if prev_c is not None else h - l
        trs.append(tr)

    vix_atr = round(mean(trs[-14:] if len(trs) >= 14 else trs), 2) if len(trs) >= 2 else None

    keys = [cfg["open_key"], cfg["high_key"], cfg["low_key"], cfg["price_key"], "ttm_wave_a"]
    live_rows = {r.key: r for r in db.query(LiveData).filter(
        LiveData.symbol == sym, LiveData.key.in_(keys)).all()}
    vix_val = get_vix(db)

    if vix_val is not None and vix_atr is not None:
        weekly_vix_high = round(vix_val + vix_atr, 2)
        weekly_vix_low  = round(max(vix_val - vix_atr, 0.01), 2)
        daily_vix_high  = round(vix_val + vix_atr / math.sqrt(5), 2)
        daily_vix_low   = round(max(vix_val - vix_atr / math.sqrt(5), 0.01), 2)
    else:
        weekly_vix_high = weekly_vix_low = daily_vix_high = daily_vix_low = None

    # ----------------------------------------------------------- MOMENTUM ----
    # AtrSnapshot is created only by real /webhook/es — safe source for squeeze + ATR.
    latest_snap = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == sym).order_by(AtrSnapshot.computed_at.desc()).first()

    wave_a = _live(live_rows, "ttm_wave_a")

    squeeze_raw = latest_snap.squeeze if latest_snap else None
    squeeze_lower = squeeze_raw.lower() if squeeze_raw else ""
    if squeeze_lower in ("long", "buy"):
        squeeze_state = "BULLISH"
    elif squeeze_lower in ("short", "sell"):
        squeeze_state = "BEARISH"
    else:
        squeeze_state = "NEUTRAL"

    if wave_a is not None:
        wave_direction = "BULLISH" if wave_a > 0 else ("BEARISH" if wave_a < 0 else "NEUTRAL")
    else:
        wave_direction = None

    if wave_direction is None:
        momentum_regime = squeeze_state
    elif squeeze_state == wave_direction:
        momentum_regime = "CONFIRMED " + squeeze_state
    else:
        momentum_regime = "DIVERGING"

    recent_snaps = db.query(AtrSnapshot).filter(AtrSnapshot.symbol == sym).order_by(AtrSnapshot.computed_at.desc()).limit(20).all()
    bars_in_state = 0
    for snap in recent_snaps:
        s = snap.squeeze.lower() if snap.squeeze else ""
        if s == squeeze_lower:
            bars_in_state += 1
        else:
            break

    # --------------------------------- ES WEEKLY RANGE (live bar OHLC only) --
    # Latest bar OHLC comes directly from LiveData — always reflects the most
    # recent real TradingView webhook tick, no historical aggregation.
    bar_open  = _live(live_rows, cfg["open_key"])
    bar_high  = _live(live_rows, cfg["high_key"])
    bar_low   = _live(live_rows, cfg["low_key"])
    bar_close = _live(live_rows, cfg["price_key"])

    atr = latest_snap.atr_value if latest_snap else None

    if latest_snap is not None:
        atr_regime_block = {
            "regime":      latest_snap.regime,
            "percentile":  round(latest_snap.percentile_rank * 100, 1) if latest_snap.percentile_rank is not None else None,
            "atr_value":   atr,
            "rolling_avg": round(latest_snap.rolling_20_avg, 2) if latest_snap.rolling_20_avg is not None else None,
            "rolling_max": round(latest_snap.rolling_20_max, 2) if latest_snap.rolling_20_max is not None else None,
            "rolling_min": round(latest_snap.rolling_20_min, 2) if latest_snap.rolling_20_min is not None else None,
        }
    else:
        atr_regime_block = None

    # Weekly range projected from current live price using ATR
    if bar_close is not None and atr is not None and atr > 0:
        atr_high = round(bar_close + atr * 2.5, 2)
        atr_low  = round(bar_close - atr * 2.5, 2)
    else:
        atr_high = atr_low = None

    # Pivot method: previous week's real AtrSnapshot rows only
    today = date.today()
    weekday = today.weekday()
    monday = today - timedelta(days=weekday) if weekday < 5 else today + timedelta(days=(7 - weekday))
    week_label      = monday.strftime("%G-W%V")
    prev_week_label = (monday - timedelta(days=7)).strftime("%G-W%V")

    prev_snaps = (
        db.query(AtrSnapshot)
        .filter(AtrSnapshot.symbol == sym, AtrSnapshot.event_week == prev_week_label)
        .order_by(AtrSnapshot.computed_at)
        .all()
    )

    R1 = S1 = R2 = S2 = prev_H = prev_L = prev_C = None
    if prev_snaps:
        closes = [s.close_price for s in prev_snaps if s.close_price is not None]
        if closes:
            prev_H = max(closes)
            prev_L = min(closes)
            prev_C = closes[-1]
            PP = (prev_H + prev_L + prev_C) / 3
            R1 = round(2 * PP - prev_L, 2)
            S1 = round(2 * PP - prev_H, 2)
            R2 = round(PP + (prev_H - prev_L), 2)
            S2 = round(PP - (prev_H - prev_L), 2)

    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "vix": {
            "current":               vix_val,
            "regime":                get_vix_regime(vix_val),
            "atr_14":                vix_atr,
            "weekly_projected_high": weekly_vix_high,
            "weekly_projected_low":  weekly_vix_low,
            "daily_projected_high":  daily_vix_high,
            "daily_projected_low":   daily_vix_low,
        },
        "momentum": {
            "squeeze_state":   squeeze_state,
            "ttm_wave_a":      wave_a,
            "wave_direction":  wave_direction,
            "momentum_regime": momentum_regime,
            "bars_in_state":   bars_in_state,
        },
        "atr_regime": atr_regime_block,
        "es_weekly_range": {
            "week_label": week_label,
            "bar_open":   bar_open,
            "bar_high":   bar_high,
            "bar_low":    bar_low,
            "bar_close":  bar_close,
            "atr":        atr,
            "atr_based": {
                "projected_high": atr_high,
                "projected_low":  atr_low,
            },
            "pivot_based": {
                "prev_week_high":  prev_H,
                "prev_week_low":   prev_L,
                "prev_week_close": prev_C,
                "R2": R2,
                "R1": R1,
                "S1": S1,
                "S2": S2,
            },
        },
    }
