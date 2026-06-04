from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class FieldValue(BaseModel):
    value: Optional[Any] = None
    note: Optional[str] = None


class WeeklyFields(BaseModel):
    es_open_price: Optional[FieldValue] = None
    es_weekly_h1: Optional[FieldValue] = None
    es_weekly_h2: Optional[FieldValue] = None
    es_weekly_l1: Optional[FieldValue] = None
    es_weekly_l2: Optional[FieldValue] = None
    vwap_daily: Optional[FieldValue] = None
    vwap_weekly: Optional[FieldValue] = None
    vwap_monthly: Optional[FieldValue] = None
    vwap_quarterly: Optional[FieldValue] = None
    vwap_yearly: Optional[FieldValue] = None
    buy_level: Optional[FieldValue] = None
    sell_level: Optional[FieldValue] = None
    es_monthly_posture: Optional[FieldValue] = None
    es_weekly_posture: Optional[FieldValue] = None
    es_daily_posture: Optional[FieldValue] = None
    es_monthly_proj_price: Optional[FieldValue] = None
    es_weekly_proj_price: Optional[FieldValue] = None
    es_daily_proj_price: Optional[FieldValue] = None
    es_green_push: Optional[FieldValue] = None
    es_squeeze: Optional[FieldValue] = None
    es_bear_trap_zone: Optional[FieldValue] = None
    es_bull_trap_zone: Optional[FieldValue] = None
    vix_monthly_posture: Optional[FieldValue] = None
    vix_weekly_posture: Optional[FieldValue] = None
    vix_daily_posture: Optional[FieldValue] = None
    vix_monthly_proj_price: Optional[FieldValue] = None
    vix_weekly_proj_price: Optional[FieldValue] = None
    vix_daily_proj_price: Optional[FieldValue] = None
    major_economic_event: Optional[FieldValue] = None
    plan_of_action: Optional[FieldValue] = None


class DailyPlanOut(BaseModel):
    id: int
    week_id: int
    day_date: Optional[str] = None
    day_index: int
    level_4h: Optional[str] = None
    level_daily: Optional[str] = None
    level_weekly: Optional[str] = None
    level_monthly: Optional[str] = None
    momentum_4h: Optional[str] = None
    momentum_daily: Optional[str] = None
    momentum_weekly: Optional[str] = None
    momentum_monthly: Optional[str] = None
    trigger_vscore: Optional[str] = None
    trigger_level: Optional[float] = None
    trigger_vix: Optional[float] = None
    trigger_ai_pivot: Optional[str] = None
    event: Optional[str] = None

    class Config:
        from_attributes = True


class WeekOut(BaseModel):
    id: int
    contract: Optional[str] = None
    sheet: Optional[str] = None
    week_date: Optional[str] = None
    weekly: WeeklyFields
    daily: List[DailyPlanOut] = []

    class Config:
        from_attributes = True


class WeeksResponse(BaseModel):
    weeks: List[WeekOut]


class HistoricalSnapshotOut(BaseModel):
    id: int
    week_id: Optional[int] = None
    date: Optional[str] = None
    sheet: Optional[str] = None
    contract: Optional[str] = None
    open: Optional[float] = None
    h1: Optional[float] = None
    h2: Optional[float] = None
    l1: Optional[float] = None
    l2: Optional[float] = None
    vwap_d: Optional[float] = None
    vwap_w: Optional[float] = None
    vwap_m: Optional[float] = None
    posture: Optional[str] = None
    plan: Optional[str] = None
    # Forecast-sourced fields
    week_label:     Optional[str]   = None
    weekly_bias:    Optional[str]   = None
    atr_current:    Optional[float] = None
    vwap_quarterly: Optional[float] = None
    vwap_yearly:    Optional[float] = None
    bull_entry:     Optional[float] = None
    bull_target:    Optional[float] = None
    bull_stop:      Optional[float] = None
    bear_entry:     Optional[float] = None
    bear_target:    Optional[float] = None
    bear_stop:      Optional[float] = None
    source:         Optional[str]   = None

    class Config:
        from_attributes = True


class HistoricalResponse(BaseModel):
    historical: List[HistoricalSnapshotOut]


class WebhookPayload(BaseModel):
    model_config = {"extra": "ignore"}

    # standard OHLCV
    ticker: Optional[str] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    # VWAP anchors — maps to MULTITIMEFRAME_VWAP_MANOJ plots 0-4
    vwap: Optional[float] = None          # plot_0 VWAP_DAILY
    vwap_weekly: Optional[float] = None   # plot_1 VWAP_WEEKLY
    vwap_monthly: Optional[float] = None  # plot_2 VWAP_MONTHLY
    vwap_quarterly: Optional[float] = None # plot_3 VWAP_QUARTERLY
    vwap_yearly: Optional[float] = None   # plot_4 VWAP_YEARLY
    atr: Optional[float] = None
    squeeze: Optional[str] = None
    ttm_wave_a: Optional[float] = None  # TTM Squeeze momentum histogram (val plot)
    ttm_wave_b: Optional[float] = None  # TTM Wave A histogram
    signal: Optional[str] = None        # alternate name some scripts use
    time: Optional[str] = None
    # auth & metadata (Pine Script indicator fields)
    secret_key: Optional[str] = None
    strategy_name: Optional[str] = None


class WebhookEventOut(BaseModel):
    id: int
    ticker: Optional[str] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    vwap: Optional[float] = None
    atr: Optional[float] = None
    squeeze: Optional[str] = None
    tv_time: Optional[str] = None
    received_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebhookEventsResponse(BaseModel):
    events: List[WebhookEventOut]
    total: int


class LiveDataOut(BaseModel):
    price: Optional[float] = None
    vix: Optional[float] = None
    source: Optional[str] = None
    atr: Optional[float] = None
    vwap_daily: Optional[float] = None
    vwap_weekly: Optional[float] = None
    vwap_monthly: Optional[float] = None
    vwap_quarterly: Optional[float] = None
    vwap_yearly: Optional[float] = None
    ttm_wave_a: Optional[float] = None
    ttm_wave_b: Optional[float] = None
    es_high: Optional[float] = None
    es_low: Optional[float] = None
    updated_at: Optional[str] = None   # ISO timestamp of the last es_price write — drives freshness indicator


class LiveDataIn(BaseModel):
    price: Optional[float] = None
    vix: Optional[float] = None


class NewsItemOut(BaseModel):
    id: int
    title: str
    source: str
    url: Optional[str] = None
    summary: Optional[str] = None
    score: int
    bias: Optional[str] = None
    reason: Optional[str] = None
    published_at: Optional[datetime] = None
    fetched_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NewsResponse(BaseModel):
    items: List[NewsItemOut]
    total: int
    as_of: datetime


# --- Journal ---

class TradeIn(BaseModel):
    entry_order_id:      str
    exit_order_id:       str
    entry_price:         float
    exit_price:          float
    entry_date:          str
    exit_date:           str
    entry_time:          str
    exit_time:           str
    symbol:              str
    position_type:       str
    trade_id_label:      Optional[str]   = None
    contract:            Optional[str]   = None
    asset_class:         Optional[str]   = None
    stop_loss:           Optional[float] = None
    take_profit:         Optional[float] = None
    position_size:       Optional[float] = None
    risk_dollars:        Optional[float] = None
    risk_pct:            Optional[float] = None
    fees_commission:     Optional[float] = None
    slippage:            Optional[float] = None
    points:              Optional[float] = None
    gross_pnl:           Optional[float] = None
    net_pnl:             Optional[float] = None
    r_multiple:          Optional[float] = None
    duration_min:        Optional[float] = None
    duration_hrs:        Optional[float] = None
    day_of_week:         Optional[str]   = None
    entry_hour:          Optional[int]   = None
    strategy_tag:        Optional[str]   = None
    setup_quality:       Optional[str]   = None
    trade_quality_score: Optional[int]   = None
    tags:                Optional[str]   = None
    week_label:          Optional[str]   = None
    notes:               Optional[str]   = None
    vwap_posture_at_entry: Optional[str] = None
    atr_regime_at_entry:   Optional[str] = None
    vix_regime_at_entry:   Optional[str] = None


class TradeOut(BaseModel):
    id:                  int
    entry_order_id:      str
    exit_order_id:       str
    trade_id_label:      Optional[str]   = None
    entry_date:          str
    entry_time:          str
    exit_date:           str
    exit_time:           str
    symbol:              str
    contract:            Optional[str]   = None
    asset_class:         Optional[str]   = None
    position_type:       str
    entry_price:         float
    exit_price:          float
    stop_loss:           Optional[float] = None
    take_profit:         Optional[float] = None
    position_size:       Optional[float] = None
    risk_dollars:        Optional[float] = None
    risk_pct:            Optional[float] = None
    fees_commission:     Optional[float] = None
    slippage:            Optional[float] = None
    points:              Optional[float] = None
    gross_pnl:           Optional[float] = None
    net_pnl:             Optional[float] = None
    r_multiple:          Optional[float] = None
    duration_min:        Optional[float] = None
    duration_hrs:        Optional[float] = None
    day_of_week:         Optional[str]   = None
    entry_hour:          Optional[int]   = None
    strategy_tag:        Optional[str]   = None
    setup_quality:       Optional[str]   = None
    trade_quality_score: Optional[int]   = None
    tags:                Optional[str]   = None
    week_label:          Optional[str]   = None
    notes:               Optional[str]   = None
    vwap_posture_at_entry: Optional[str] = None
    atr_regime_at_entry:   Optional[str] = None
    vix_regime_at_entry:   Optional[str] = None
    created_at:          Optional[datetime] = None
    updated_at:          Optional[datetime] = None

    class Config:
        from_attributes = True


class JournalStatsOut(BaseModel):
    total_trades:         int
    winning_trades:       int
    losing_trades:        int
    win_rate_pct:         float
    net_pnl:              float
    gross_pnl:            float
    profit_factor:        Optional[float] = None
    expectancy_per_trade: float
    avg_win:              float
    avg_loss:             float
    largest_win:          float
    largest_loss:         float
    max_drawdown_dollars: float
    max_drawdown_pct:     float
    avg_r_multiple:       Optional[float] = None
    avg_duration_min:     Optional[float] = None
    best_day_of_week:     Optional[str]   = None
    best_session:         Optional[str]   = None
    streak_current:       int
    streak_max_win:       int
    streak_max_loss:      int
    # Breakdown objects for frontend charts
    by_day_of_week:       Dict[str, float] = {}
    by_session:           Dict[str, Any]   = {}

    # Risk Metrics
    ulcer_index:          Optional[float] = None
    var_95:               Optional[float] = None
    std_dev_pnl:          Optional[float] = None
    sharpe_annualized:    Optional[float] = None
    sortino_annualized:   Optional[float] = None
    risk_of_ruin:         Optional[float] = None

    # Behavioral Signals
    trades_per_day:         Optional[float] = None
    overtrading_days:       Optional[int]   = None
    max_trades_per_day:     Optional[int]   = None
    revenge_trades:         Optional[int]   = None
    long_win_rate_pct:      Optional[float] = None
    short_win_rate_pct:     Optional[float] = None
    commissions_total:      Optional[float] = None

    # Execution Quality
    avg_slippage:                 Optional[float] = None
    median_slippage:              Optional[float] = None
    slippage_drag:                Optional[float] = None
    fill_rate_pct:                float           = 100.0
    holding_time_std_dev:         Optional[float] = None
    trades_closed_same_day_pct:   Optional[float] = None
    entry_efficiency_score:       Optional[float] = None
    exit_efficiency_score:        Optional[float] = None
    composite_execution_score:    Optional[float] = None

    # Heatmap
    by_hour_day: Dict[str, Any] = {}

    # Attribution breakdowns
    by_vwap_posture: Optional[Dict[str, Any]] = None
    by_atr_regime:   Optional[Dict[str, Any]] = None
    by_vix_regime:   Optional[Dict[str, Any]] = None


class TradeUpdateIn(BaseModel):
    notes:         Optional[str]   = None
    setup_quality: Optional[str]   = None
    stop_loss:     Optional[float] = None
    take_profit:   Optional[float] = None


class TradeListResponse(BaseModel):
    trades: List[TradeOut]
    total:  int


class TradeImportResponse(BaseModel):
    inserted: int
    skipped:  int
    total:    int

