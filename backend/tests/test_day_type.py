"""Unit tests for compute_day_type — the pre-session classifier that scores the likely
day archetype (trend / gap-and-go / gap-and-fade / range / elevated-vol) from gap, VWAP
posture, ATR regime, VIX regime, squeeze, and event risk. Pure function, no DB."""
from backend.intelligence import compute_day_type

FULL_BULL = "FULL BULL STACK — price above all three VWAP anchors"
FULL_BEAR = "FULL BEAR STACK — price below all three VWAP anchors"
MIXED_BULL = "MIXED BULL — above two of three VWAPs"


def test_none_price_returns_safe_range_default():
    r = compute_day_type(None, 5800, None, FULL_BULL, "EXPANDED", "COMPLACENT", "long", False)
    assert r["type"] == "RANGE_DAY"
    assert r["confidence"] == 0.20
    assert r["gap_pts"] is None and r["gap_pct"] is None


def test_elevated_vol_override_on_panic_plus_event():
    # PANIC VIX (+4) and a high-impact event today (+4) = 8 >= 5 → overrides everything else,
    # even on a clean full-bull expanding tape.
    r = compute_day_type(5850, 5800, 5850, FULL_BULL, "EXPANDED", "PANIC", "long", True)
    assert r["type"] == "ELEVATED_VOL"
    assert r["confidence"] > 0.5


def test_gap_and_fade_when_gap_opposes_posture():
    # Gap up +0.86% but FULL BEAR posture (opposed) + compressed + elevated VIX → fade.
    r = compute_day_type(5850, 5800, 5850, FULL_BEAR, "COMPRESSED", "ELEVATED", "neutral", False)
    assert r["type"] == "GAP_AND_FADE"


def test_range_day_on_flat_compressed_tape():
    # Tiny gap (<0.15%), compressed ATR, mixed posture, no squeeze → rotation.
    r = compute_day_type(5801, 5800, 5801, MIXED_BULL, "COMPRESSED", "COMPLACENT", "neutral", False)
    assert r["type"] == "RANGE_DAY"


def test_bullish_continuation_on_aligned_expanding_gap():
    # Big aligned gap up + full bull + expanding + squeeze on → trend/gap-go family.
    r = compute_day_type(5850, 5800, 5850, FULL_BULL, "EXPANDED", "COMPLACENT", "long", False)
    assert r["type"] in ("TREND_DAY", "GAP_AND_GO")
    assert r["confidence"] >= 0.5


def test_gap_math_is_correct():
    r = compute_day_type(5850, 5800, 5850, FULL_BULL, "NORMAL", "COMPLACENT", "neutral", False)
    assert r["gap_pts"] == 50.0
    assert abs(r["gap_pct"] - 0.862) < 0.01


def test_premarket_gap_uses_price_when_no_rth_open():
    # Before RTH open rth_open is None → gap computed off current price vs PDC.
    r = compute_day_type(5820, 5800, None, MIXED_BULL, "NORMAL", "COMPLACENT", "neutral", False)
    assert r["gap_pts"] == 20.0


def test_confidence_floor_and_ceiling():
    r = compute_day_type(5801, 5800, 5801, MIXED_BULL, "COMPRESSED", "COMPLACENT", "neutral", False)
    assert 0.20 <= r["confidence"] <= 1.0


def test_all_types_have_implication_text():
    # Every returned classification must carry a non-empty implication string for the UI.
    r = compute_day_type(5850, 5800, 5850, FULL_BEAR, "COMPRESSED", "ELEVATED", "neutral", False)
    assert isinstance(r["implication"], str) and len(r["implication"]) > 0
