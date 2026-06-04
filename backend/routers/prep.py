from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import LiveData, DailyBar
from ..symbols import SYMBOL_CONFIG, validate_symbol

router = APIRouter()

LIVE_KEYS = ["es_price", "atr", "pdh", "pdl", "pdc",
             "globex_high", "globex_low", "globex_open",
             "weekly_open", "monthly_open", "rth_high", "rth_low", "rth_open",
             "or5_high", "or5_low", "or15_high", "or15_low", "pwh", "pwl",
             "vwap_daily", "vwap_weekly", "vwap_monthly", "vwap_quarterly", "vwap_yearly"]


def _vwap_vs_range(vwap, pdh, pdl):
    if vwap is None or pdh is None or pdl is None: return None
    if vwap > pdh: return "ABOVE PDH"
    if vwap < pdl: return "BELOW PDL"
    return "IN RANGE"


def _price_vs_pwrange(price, pwh, pwl):
    if price is None or pwh is None or pwl is None: return None
    if price > pwh: return "ABOVE PWH"
    if price < pwl: return "BELOW PWL"
    return "IN RANGE"


def _session_info():
    try:
        from zoneinfo import ZoneInfo
        now_et = datetime.now(ZoneInfo("America/New_York"))
    except ImportError:
        now_et = datetime.utcnow()
    h, m = now_et.hour, now_et.minute
    t_min = h * 60 + m
    rth_open_min  = 9 * 60 + 30
    rth_close_min = 16 * 60
    secs_to_rth = None
    if t_min < rth_open_min:
        secs_to_rth = (rth_open_min - t_min) * 60 - now_et.second
        session = "PRE-MARKET"
    elif t_min < rth_close_min:
        if t_min < 10 * 60:          sub = "RTH OPEN"
        elif t_min < 14 * 60 + 30:   sub = "MID-SESSION"
        elif t_min < 15 * 60 + 30:   sub = "POWER HOUR"
        else:                         sub = "CLOSING"
        session = sub
    elif now_et.weekday() < 5:
        session = "GLOBEX"
    else:
        session = "CLOSED"
    return session, secs_to_rth


@router.get("")
def get_prep_levels(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    cfg = SYMBOL_CONFIG[sym]
    round_interval = cfg["round_interval"]
    keys = [cfg["price_key"]] + [k for k in LIVE_KEYS if k != "es_price"]
    rows = {r.key: r.value for r in db.query(LiveData).filter(
        LiveData.symbol == sym, LiveData.key.in_(keys)).all()}
    price     = rows.get(cfg["price_key"])
    pdc       = rows.get("pdc")
    rth_open  = rows.get("rth_open")
    atr       = rows.get("atr")
    rth_high  = rows.get("rth_high")
    rth_low   = rows.get("rth_low")

    # Gap
    gap_pts = gap_pct = gap_dir = None
    if pdc and pdc > 0:
        ref = rth_open if rth_open else price
        if ref:
            gap_pts = round(ref - pdc, 2)
            gap_pct = round(gap_pts / pdc * 100, 3)
            gap_dir = "GAP UP" if gap_pts > 2 else "GAP DOWN" if gap_pts < -2 else "FLAT"

    # Round numbers (25-pt intervals)
    round_above_1 = round_above_2 = round_below_1 = round_below_2 = None
    if price:
        fl = (price // round_interval) * round_interval
        round_below_2 = fl - round_interval
        round_below_1 = fl
        round_above_1 = fl + round_interval
        round_above_2 = fl + 2 * round_interval

    # Range context
    range_used_pts = range_pct_of_atr = None
    if rth_high and rth_low:
        range_used_pts = round(rth_high - rth_low, 2)
        if atr and atr > 0:
            range_pct_of_atr = round(range_used_pts / atr * 100, 1)

    # Price vs PDH/PDL
    price_vs_pdrange = None
    pdh = rows.get("pdh")
    pdl = rows.get("pdl")
    if price and pdh and pdl:
        if price > pdh:   price_vs_pdrange = "ABOVE PDH"
        elif price < pdl: price_vs_pdrange = "BELOW PDL"
        else:             price_vs_pdrange = "IN RANGE"

    session, secs_to_rth = _session_info()

    # Feature 1 — Opening Range.
    # Read from the CURRENT session's DailyBar row (per-day, inherently fresh) rather than
    # the global live_data keys, which are only refreshed by the first RTH webhook and would
    # otherwise show yesterday's OR during pre-market.
    from zoneinfo import ZoneInfo
    _now_et = datetime.now(ZoneInfo("America/New_York"))
    _tmin = _now_et.hour * 60 + _now_et.minute
    # Determine the RTH session we're prepping for: before 16:00 ET → today; Globex → next trading day.
    if _tmin >= 16 * 60:
        _session_date = _now_et.date() + timedelta(days=1)
        while _session_date.weekday() >= 5:
            _session_date += timedelta(days=1)
    else:
        _session_date = _now_et.date()
    _today_bar = db.query(DailyBar).filter(DailyBar.symbol == sym, DailyBar.trade_date == _session_date.isoformat()).first()
    or5_high  = _today_bar.or5_high  if _today_bar else None
    or5_low   = _today_bar.or5_low   if _today_bar else None
    or15_high = _today_bar.or15_high if _today_bar else None
    or15_low  = _today_bar.or15_low  if _today_bar else None
    # Sealed for display: only when prepping today's actual session and past the OR window.
    _is_today_session = (_session_date == _now_et.date())
    or5_sealed  = bool(_today_bar.or5_sealed)  if _today_bar and _today_bar.or5_sealed else (_is_today_session and _tmin >= 9*60+35)
    or15_sealed = bool(_today_bar.or15_sealed) if _today_bar and _today_bar.or15_sealed else (_is_today_session and _tmin >= 9*60+45)
    def _pvor(p, h, l):
        if p is None or h is None or l is None: return None
        if p > h: return "ABOVE"
        if p < l: return "BELOW"
        return "IN_RANGE"
    price_vs_or5 = _pvor(price, or5_high, or5_low)
    price_vs_or15 = _pvor(price, or15_high, or15_low)

    # Feature 2 — ATR projections (from PDC)
    atr_target_bull_1 = round(pdc + atr, 2) if pdc is not None and atr is not None else None
    atr_target_bull_2 = round(pdc + 2*atr, 2) if pdc is not None and atr is not None else None
    atr_target_bear_1 = round(pdc - atr, 2) if pdc is not None and atr is not None else None
    atr_target_bear_2 = round(pdc - 2*atr, 2) if pdc is not None and atr is not None else None
    price_vs_atr_band = None
    if price is not None and pdc is not None and atr is not None:
        if price > pdc + 2*atr: price_vs_atr_band = "ABOVE_EXT"
        elif price > pdc + atr: price_vs_atr_band = "BULL_ZONE"
        elif price > pdc: price_vs_atr_band = "ABOVE_PDC"
        elif price > pdc - atr: price_vs_atr_band = "BELOW_PDC"
        elif price > pdc - 2*atr: price_vs_atr_band = "BEAR_ZONE"
        else: price_vs_atr_band = "BELOW_EXT"

    # Feature 3 — VWAP structure
    vwap_d = rows.get("vwap_daily"); vwap_w = rows.get("vwap_weekly"); vwap_m = rows.get("vwap_monthly")
    vwap_q = rows.get("vwap_quarterly"); vwap_y = rows.get("vwap_yearly")
    import json as _json
    from ..models import IntelligenceReport
    _latest_ir = db.query(IntelligenceReport).filter(IntelligenceReport.symbol == sym).order_by(IntelligenceReport.id.desc()).first()
    vwap_posture_label = None
    if _latest_ir and _latest_ir.report_json:
        try:
            vwap_posture_label = _json.loads(_latest_ir.report_json).get("vwap_posture", {}).get("summary")
        except Exception:
            pass

    # Feature 4 — PWH/PWL
    pwh = rows.get("pwh"); pwl = rows.get("pwl")
    price_vs_pwrange = _price_vs_pwrange(price, pwh, pwl)

    # Feature 5 — Overnight inventory
    inventory_signal = None; inventory_detail = None
    if price is not None and pdc is not None and pdc > 0:
        _diff = price - pdc
        _gh = rows.get("globex_high"); _gl = rows.get("globex_low")
        if _diff > 2:
            inventory_signal = "LONG"
            inventory_detail = ("Price at Globex high — shorts maximally exposed at open." if _gh is not None and price >= _gh - 3
                                else f"Price {abs(_diff):.1f}pts above PDC — bulls holding overnight risk.")
        elif _diff < -2:
            inventory_signal = "SHORT"
            inventory_detail = ("Price at Globex low — longs maximally exposed at open." if _gl is not None and price <= _gl + 3
                                else f"Price {abs(_diff):.1f}pts below PDC — bears holding overnight risk.")
        else:
            inventory_signal = "NEUTRAL"
            inventory_detail = "Price near PDC — balanced overnight inventory."

    return {
        "pdh": pdh, "pdl": pdl, "pdc": pdc,
        "globex_high": rows.get("globex_high"), "globex_low": rows.get("globex_low"),
        "globex_open": rows.get("globex_open"),
        "weekly_open": rows.get("weekly_open"), "monthly_open": rows.get("monthly_open"),
        "rth_open": rth_open, "rth_high": rth_high, "rth_low": rth_low,
        "current_price": price, "current_atr": atr,
        "gap_pts": gap_pts, "gap_pct": gap_pct, "gap_dir": gap_dir,
        "round_above_1": round_above_1, "round_above_2": round_above_2,
        "round_below_1": round_below_1, "round_below_2": round_below_2,
        "range_used_pts": range_used_pts, "range_pct_of_atr": range_pct_of_atr,
        "price_vs_pdrange": price_vs_pdrange,
        "session": session, "seconds_to_rth": secs_to_rth,
        "or5_high": or5_high, "or5_low": or5_low, "or5_sealed": or5_sealed,
        "or15_high": or15_high, "or15_low": or15_low, "or15_sealed": or15_sealed,
        "price_vs_or5": price_vs_or5, "price_vs_or15": price_vs_or15,
        "atr_target_bull_1": atr_target_bull_1, "atr_target_bull_2": atr_target_bull_2,
        "atr_target_bear_1": atr_target_bear_1, "atr_target_bear_2": atr_target_bear_2,
        "price_vs_atr_band": price_vs_atr_band,
        "vwap_daily": vwap_d, "vwap_weekly": vwap_w, "vwap_monthly": vwap_m,
        "vwap_quarterly": vwap_q, "vwap_yearly": vwap_y, "vwap_posture": vwap_posture_label,
        "vwap_daily_vs_range": _vwap_vs_range(vwap_d, pdh, pdl),
        "vwap_weekly_vs_range": _vwap_vs_range(vwap_w, pdh, pdl),
        "vwap_monthly_vs_range": _vwap_vs_range(vwap_m, pdh, pdl),
        "pwh": pwh, "pwl": pwl, "price_vs_pwrange": price_vs_pwrange,
        "inventory_signal": inventory_signal, "inventory_detail": inventory_detail,
    }
