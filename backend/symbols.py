GLOBAL_SYMBOL = "GLOBAL"
ACTIVE_SYMBOLS = ["ES", "NQ"]
SYMBOL_CONFIG = {
    "ES": {"point_value": 50, "round_interval": 25, "ticker_prefixes": ["ES1!", "ES", "MES"],
           "price_key": "es_price", "open_key": "es_open", "high_key": "es_high", "low_key": "es_low"},
    "NQ": {"point_value": 20, "round_interval": 100, "ticker_prefixes": ["NQ1!", "NQ", "MNQ"],
           "price_key": "price", "open_key": "open", "high_key": "high", "low_key": "low"},
}


def validate_symbol(s):
    s = (s or "ES").upper()
    return s if s in SYMBOL_CONFIG else None


def resolve_symbol_from_ticker(ticker):
    if not ticker:
        return None
    t = ticker.upper()
    for sym, cfg in SYMBOL_CONFIG.items():
        if any(t.startswith(p) for p in cfg["ticker_prefixes"]):
            return sym
    return None


def upsert_live(db, symbol, key, value, source, now):
    from .models import LiveData
    if value is None:
        return
    r = db.query(LiveData).filter(LiveData.symbol == symbol, LiveData.key == key).first()
    if r:
        r.value = value
        r.source = source
        r.updated_at = now
    else:
        db.add(LiveData(symbol=symbol, key=key, value=value, source=source, updated_at=now))


def get_vix(db):
    from .models import LiveData
    r = db.query(LiveData).filter(LiveData.symbol == GLOBAL_SYMBOL, LiveData.key == "vix").first()
    return r.value if r else None
