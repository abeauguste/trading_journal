"""Unit tests for _classify_session — the function that decides whether a TradingView
bar belongs to the RTH / Globex / pre-market window and which trading date it maps to.
This is DST- and weekend-sensitive logic that silently feeds DailyBar, PDH/PDL, and the
plan-freezing pipeline, so it's worth pinning down precisely."""
from datetime import datetime, date
from zoneinfo import ZoneInfo

from backend.routers.webhook import _classify_session

ET = ZoneInfo("America/New_York")


def _ms(year, month, day, hour, minute):
    """Build the Unix-millisecond string TradingView would send for a given ET wall time.
    Using ZoneInfo here means each case is automatically correct for EST vs EDT."""
    aware = datetime(year, month, day, hour, minute, tzinfo=ET)
    return str(int(aware.timestamp() * 1000))


# ── RTH boundaries (09:30 inclusive → 16:00 exclusive) ────────────────────────

def test_rth_midday_summer():
    # Wed 2026-06-03 10:00 ET (EDT) → RTH, same date
    session, d = _classify_session(_ms(2026, 6, 3, 10, 0))
    assert session == "RTH"
    assert d == date(2026, 6, 3)


def test_rth_midday_winter():
    # Wed 2026-01-21 10:00 ET (EST) → RTH, same date (DST handled by ZoneInfo)
    session, d = _classify_session(_ms(2026, 1, 21, 10, 0))
    assert session == "RTH"
    assert d == date(2026, 1, 21)


def test_rth_open_edge_inclusive():
    # 09:30 ET exactly is the first RTH minute
    session, _ = _classify_session(_ms(2026, 6, 3, 9, 30))
    assert session == "RTH"


def test_just_before_open_is_premarket():
    # 09:29 ET → PRE, belongs to the same day's upcoming RTH session
    session, d = _classify_session(_ms(2026, 6, 3, 9, 29))
    assert session == "PRE"
    assert d == date(2026, 6, 3)


def test_last_rth_minute():
    # 15:59 ET is still RTH
    session, _ = _classify_session(_ms(2026, 6, 3, 15, 59))
    assert session == "RTH"


def test_close_edge_is_globex():
    # 16:00 ET exactly rolls into Globex for the NEXT trading day
    session, d = _classify_session(_ms(2026, 6, 3, 16, 0))
    assert session == "GLOBEX"
    assert d == date(2026, 6, 4)   # Wed → Thu


# ── Globex / overnight → next trading day ─────────────────────────────────────

def test_evening_globex_maps_to_next_day():
    # Wed 20:00 ET → Globex bar belongs to Thursday's RTH session
    session, d = _classify_session(_ms(2026, 6, 3, 20, 0))
    assert session == "GLOBEX"
    assert d == date(2026, 6, 4)


def test_friday_evening_skips_weekend_to_monday():
    # Fri 2026-06-05 18:30 ET → Globex; next trading day skips Sat/Sun to Mon 2026-06-08
    session, d = _classify_session(_ms(2026, 6, 5, 18, 30))
    assert session == "GLOBEX"
    assert d == date(2026, 6, 8)


def test_early_morning_globex_before_premarket_window():
    # 03:00 ET is before the 04:00... actually classified PRE (anything < 09:30 and >= 00:00)
    # belongs to today's RTH date. Confirm it does not roll to next day.
    session, d = _classify_session(_ms(2026, 6, 3, 3, 0))
    assert session == "PRE"
    assert d == date(2026, 6, 3)


# ── Malformed / missing input → UNKNOWN (never crash the webhook) ──────────────

def test_none_input():
    assert _classify_session(None) == ("UNKNOWN", None)


def test_empty_string():
    assert _classify_session("") == ("UNKNOWN", None)


def test_iso_string_falls_back_to_unknown():
    # The Pine script sends ms-epoch; a stray ISO string must not raise.
    assert _classify_session("2026-06-03T14:00:00+00:00") == ("UNKNOWN", None)


def test_non_numeric_garbage():
    assert _classify_session("not_a_timestamp") == ("UNKNOWN", None)
