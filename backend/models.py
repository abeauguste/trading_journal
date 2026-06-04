from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class PlanWeek(Base):
    __tablename__ = "plan_weeks"

    id = Column(Integer, primary_key=True, index=True)
    contract = Column(String)
    sheet = Column(String)
    week_date = Column(String)

    es_open_price = Column(Float, nullable=True)
    es_open_price_note = Column(Text, nullable=True)
    es_weekly_h1 = Column(Float, nullable=True)
    es_weekly_h1_note = Column(Text, nullable=True)
    es_weekly_h2 = Column(Float, nullable=True)
    es_weekly_h2_note = Column(Text, nullable=True)
    es_weekly_l1 = Column(Float, nullable=True)
    es_weekly_l1_note = Column(Text, nullable=True)
    es_weekly_l2 = Column(Float, nullable=True)
    es_weekly_l2_note = Column(Text, nullable=True)

    vwap_daily = Column(Float, nullable=True)
    vwap_weekly = Column(Float, nullable=True)
    vwap_monthly = Column(Float, nullable=True)
    vwap_monthly_note = Column(Text, nullable=True)
    vwap_quarterly = Column(Float, nullable=True)
    vwap_quarterly_note = Column(Text, nullable=True)
    vwap_yearly = Column(Float, nullable=True)
    vwap_yearly_note = Column(Text, nullable=True)

    buy_level = Column(Float, nullable=True)
    buy_level_note = Column(Text, nullable=True)
    sell_level = Column(Float, nullable=True)
    sell_level_note = Column(Text, nullable=True)

    es_monthly_posture = Column(String, nullable=True)
    es_monthly_posture_note = Column(Text, nullable=True)
    es_weekly_posture = Column(String, nullable=True)
    es_weekly_posture_note = Column(Text, nullable=True)
    es_daily_posture = Column(String, nullable=True)
    es_daily_posture_note = Column(Text, nullable=True)

    es_monthly_proj_price = Column(Float, nullable=True)
    es_monthly_proj_note = Column(Text, nullable=True)
    es_weekly_proj_price = Column(Float, nullable=True)
    es_weekly_proj_note = Column(Text, nullable=True)
    es_daily_proj_price = Column(Float, nullable=True)
    es_daily_proj_note = Column(Text, nullable=True)

    es_green_push = Column(String, nullable=True)
    es_green_push_note = Column(Text, nullable=True)
    es_squeeze = Column(String, nullable=True)
    es_squeeze_note = Column(Text, nullable=True)
    es_bear_trap_zone = Column(Float, nullable=True)
    es_bear_trap_zone_note = Column(Text, nullable=True)
    es_bull_trap_zone = Column(Float, nullable=True)
    es_bull_trap_zone_note = Column(Text, nullable=True)

    vix_monthly_posture = Column(String, nullable=True)
    vix_monthly_posture_note = Column(Text, nullable=True)
    vix_weekly_posture = Column(String, nullable=True)
    vix_weekly_posture_note = Column(Text, nullable=True)
    vix_daily_posture = Column(String, nullable=True)
    vix_daily_posture_note = Column(Text, nullable=True)

    vix_monthly_proj_price = Column(Float, nullable=True)
    vix_monthly_proj_note = Column(Text, nullable=True)
    vix_weekly_proj_price = Column(Float, nullable=True)
    vix_weekly_proj_note = Column(Text, nullable=True)
    vix_daily_proj_price = Column(Float, nullable=True)
    vix_daily_proj_note = Column(Text, nullable=True)

    major_economic_event = Column(String, nullable=True)
    major_economic_event_note = Column(Text, nullable=True)
    plan_of_action = Column(Text, nullable=True)
    plan_of_action_note = Column(Text, nullable=True)

    archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    daily_plans = relationship("DailyPlan", back_populates="week", cascade="all, delete-orphan")
    historical_snapshots = relationship("HistoricalSnapshot", back_populates="week", cascade="all, delete-orphan")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("plan_weeks.id"), nullable=False)
    day_date = Column(String)
    day_index = Column(Integer)

    level_4h = Column(String, nullable=True)
    level_daily = Column(String, nullable=True)
    level_weekly = Column(String, nullable=True)
    level_monthly = Column(String, nullable=True)

    momentum_4h = Column(String, nullable=True)
    momentum_daily = Column(String, nullable=True)
    momentum_weekly = Column(String, nullable=True)
    momentum_monthly = Column(String, nullable=True)

    trigger_vscore = Column(String, nullable=True)
    trigger_level = Column(Float, nullable=True)
    trigger_vix = Column(Float, nullable=True)
    trigger_ai_pivot = Column(String, nullable=True)

    event = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    week = relationship("PlanWeek", back_populates="daily_plans")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    vwap = Column(Float, nullable=True)
    atr = Column(Float, nullable=True)
    squeeze = Column(String, nullable=True)
    ttm_wave_a = Column(Float, nullable=True)  # TTM Squeeze momentum histogram (val)
    ttm_wave_b = Column(Float, nullable=True)  # TTM Wave A histogram
    tv_time = Column(String, nullable=True)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LiveData(Base):
    __tablename__ = "live_data"

    symbol = Column(String, nullable=False, default="ES", primary_key=True)
    key = Column(String, primary_key=True)
    value = Column(Float, nullable=True)
    source = Column(String, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class HistoricalSnapshot(Base):
    __tablename__ = "historical_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("plan_weeks.id"), nullable=True)
    date = Column(String)
    sheet = Column(String, nullable=True)
    contract = Column(String, nullable=True)
    open = Column(Float, nullable=True)
    h1 = Column(Float, nullable=True)
    h2 = Column(Float, nullable=True)
    l1 = Column(Float, nullable=True)
    l2 = Column(Float, nullable=True)
    vwap_d = Column(Float, nullable=True)
    vwap_w = Column(Float, nullable=True)
    vwap_m = Column(Float, nullable=True)
    posture = Column(String, nullable=True)
    plan = Column(String, nullable=True)
    # Forecast-sourced columns (added via migration)
    symbol         = Column(String, nullable=False, default="ES", index=True)
    week_label     = Column(String, nullable=True, index=True)
    weekly_bias    = Column(String, nullable=True)
    atr_current    = Column(Float, nullable=True)
    vwap_quarterly = Column(Float, nullable=True)
    vwap_yearly    = Column(Float, nullable=True)
    bull_entry     = Column(Float, nullable=True)
    bull_target    = Column(Float, nullable=True)
    bull_stop      = Column(Float, nullable=True)
    bear_entry     = Column(Float, nullable=True)
    bear_target    = Column(Float, nullable=True)
    bear_stop      = Column(Float, nullable=True)
    source         = Column(String, nullable=True)  # 'forecast' | None (seed rows)

    week = relationship("PlanWeek", back_populates="historical_snapshots")


class EconomicEvent(Base):
    __tablename__ = "economic_events"
    id          = Column(Integer, primary_key=True, index=True)
    event_name  = Column(String, nullable=False)
    event_type  = Column(String, nullable=False)   # "FOMC"|"CPI"|"PPI"|"NFP"|"GDP"|"OTHER"
    event_date  = Column(String, nullable=False)   # "2026-05-07"
    event_time  = Column(String, nullable=True)    # "14:00 ET"
    impact      = Column(String, nullable=True)    # "HIGH"|"MEDIUM"|"LOW"
    actual      = Column(String, nullable=True)
    forecast    = Column(String, nullable=True)
    previous    = Column(String, nullable=True)
    source      = Column(String, nullable=True)
    fetched_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EarningsEvent(Base):
    __tablename__ = "earnings_events"
    id               = Column(Integer, primary_key=True, index=True)
    ticker           = Column(String, nullable=False)
    company_name     = Column(String, nullable=True)
    earnings_date    = Column(String, nullable=False)  # "2026-05-22"
    timing           = Column(String, nullable=True)   # "BMO"|"AMC"|"TNS"
    eps_estimate     = Column(Float, nullable=True)
    revenue_estimate = Column(Float, nullable=True)
    eps_actual       = Column(Float, nullable=True)
    revenue_actual   = Column(Float, nullable=True)
    surprise_pct     = Column(Float, nullable=True)
    source           = Column(String, nullable=True)
    fetched_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class VixHistory(Base):
    __tablename__ = "vix_history"
    id         = Column(Integer, primary_key=True, index=True)
    date       = Column(String, nullable=False, unique=True)  # "2026-05-17"
    vix_open   = Column(Float, nullable=True)
    vix_high   = Column(Float, nullable=True)
    vix_low    = Column(Float, nullable=True)
    vix_close  = Column(Float, nullable=False)
    source     = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AtrSnapshot(Base):
    __tablename__ = "atr_snapshots"
    id               = Column(Integer, primary_key=True, index=True)
    symbol           = Column(String, nullable=False, default="ES", index=True)
    webhook_event_id = Column(Integer, ForeignKey("webhook_events.id"), unique=True)
    ticker           = Column(String, nullable=True)
    atr_value        = Column(Float, nullable=False)
    close_price      = Column(Float, nullable=True)
    vwap_value       = Column(Float, nullable=True)
    squeeze          = Column(String, nullable=True)
    event_date       = Column(String, nullable=True)
    event_week       = Column(String, nullable=True)   # "2026-W20"
    event_month      = Column(String, nullable=True)   # "2026-05"
    rolling_20_avg   = Column(Float, nullable=True)
    rolling_20_max   = Column(Float, nullable=True)
    rolling_20_min   = Column(Float, nullable=True)
    percentile_rank  = Column(Float, nullable=True)
    regime           = Column(String, nullable=True)   # "EXPANDED"|"COMPRESSED"|"NORMAL"
    computed_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class IntelligenceReport(Base):
    __tablename__ = "intelligence_reports"
    id                   = Column(Integer, primary_key=True, index=True)
    symbol               = Column(String, nullable=False, default="ES", index=True)
    triggered_by         = Column(String, nullable=True)
    webhook_event_id     = Column(Integer, ForeignKey("webhook_events.id"), nullable=True)
    vwap_daily_posture   = Column(String, nullable=True)
    vwap_weekly_posture  = Column(String, nullable=True)
    vwap_monthly_posture = Column(String, nullable=True)
    atr_current          = Column(Float, nullable=True)
    atr_regime           = Column(String, nullable=True)
    atr_percentile       = Column(Float, nullable=True)
    atr_weekly_high      = Column(Float, nullable=True)
    atr_monthly_high     = Column(Float, nullable=True)
    momentum_signal      = Column(String, nullable=True)
    fomc_days_away       = Column(Integer, nullable=True)
    cpi_days_away        = Column(Integer, nullable=True)
    vix_current          = Column(Float, nullable=True)
    vix_regime           = Column(String, nullable=True)
    report_json          = Column(Text, nullable=False)
    generated_at         = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    day_type             = Column(String, nullable=True)
    day_type_confidence  = Column(Float, nullable=True)
    day_type_implication = Column(Text, nullable=True)
    gap_pts              = Column(Float, nullable=True)
    gap_pct              = Column(Float, nullable=True)


class WeeklyForecast(Base):
    __tablename__ = "weekly_forecasts"
    id                 = Column(Integer, primary_key=True, index=True)
    symbol             = Column(String, nullable=False, default="ES", index=True)
    week_label         = Column(String, nullable=False, index=True)  # "2026-W21"
    week_start_date    = Column(String, nullable=False)               # "2026-05-18"
    week_end_date      = Column(String, nullable=False)               # "2026-05-22"
    as_of_price        = Column(Float, nullable=True)
    as_of_vix         = Column(Float, nullable=True)
    vwap_daily         = Column(Float, nullable=True)
    vwap_weekly        = Column(Float, nullable=True)
    vwap_monthly       = Column(Float, nullable=True)
    vwap_quarterly     = Column(Float, nullable=True)
    vwap_yearly        = Column(Float, nullable=True)
    weekly_bias        = Column(String, nullable=True)
    vwap_posture_label = Column(String, nullable=True)
    atr_current        = Column(Float, nullable=True)
    atr_regime         = Column(String, nullable=True)
    vix_current        = Column(Float, nullable=True)
    vix_regime         = Column(String, nullable=True)
    squeeze_state      = Column(String, nullable=True)
    momentum_signal    = Column(String, nullable=True)
    has_fomc_this_week = Column(Boolean, default=False)
    has_cpi_this_week  = Column(Boolean, default=False)
    bull_entry         = Column(Float, nullable=True)
    bull_target        = Column(Float, nullable=True)
    bull_stop          = Column(Float, nullable=True)
    bear_entry         = Column(Float, nullable=True)
    bear_target        = Column(Float, nullable=True)
    bear_stop          = Column(Float, nullable=True)
    triggered_by       = Column(String, nullable=True)
    forecast_json      = Column(Text, nullable=False)
    generated_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at         = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    daily_forecasts    = relationship("DailyForecast", back_populates="weekly_forecast", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("symbol", "week_label", name="uq_wf_symbol_week"),)


class DailyForecast(Base):
    __tablename__ = "daily_forecasts"
    id                    = Column(Integer, primary_key=True, index=True)
    symbol                = Column(String, nullable=False, default="ES", index=True)
    weekly_forecast_id    = Column(Integer, ForeignKey("weekly_forecasts.id"), nullable=False)
    day_date              = Column(String, nullable=False)
    day_label             = Column(String, nullable=False)
    day_index             = Column(Integer, nullable=False)
    event_summary         = Column(String, nullable=True)
    has_high_impact_event = Column(Boolean, default=False)
    day_bias              = Column(String, nullable=True)
    size_guidance         = Column(String, nullable=True)
    level_daily_vwap      = Column(Float, nullable=True)
    level_weekly_vwap     = Column(Float, nullable=True)
    level_support_1       = Column(Float, nullable=True)
    level_resistance_1    = Column(Float, nullable=True)
    max_loss_pts          = Column(Float, nullable=True)
    momentum_signal       = Column(String, nullable=True)
    day_narrative         = Column(Text, nullable=True)
    risk_events_json      = Column(Text, nullable=True)
    generated_at          = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at            = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    weekly_forecast       = relationship("WeeklyForecast", back_populates="daily_forecasts")


class NewsItem(Base):
    __tablename__ = "news_items"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    title_hash   = Column(String, nullable=False, unique=True, index=True)  # sha256 of normalized title
    source       = Column(String, nullable=False)        # "Google News — Fed" | "Reuters"
    url          = Column(String, nullable=True)
    summary      = Column(String, nullable=True)         # RSS description, truncated 500 chars
    score        = Column(Integer, nullable=False)        # 7–10 (only >= 7 ever stored)
    bias         = Column(String, nullable=True)          # "BULL" | "BEAR" | "NEUTRAL"
    reason       = Column(String, nullable=True)          # one-sentence Claude rationale
    published_at = Column(DateTime, nullable=True, index=True)   # from RSS, UTC
    fetched_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class DailyBar(Base):
    __tablename__ = "daily_bars"
    id              = Column(Integer, primary_key=True, index=True)
    symbol          = Column(String, nullable=False, default="ES", index=True)
    trade_date      = Column(String, nullable=False, index=True)  # "YYYY-MM-DD"
    rth_open        = Column(Float, nullable=True)
    rth_high        = Column(Float, nullable=True)
    rth_low         = Column(Float, nullable=True)
    rth_close       = Column(Float, nullable=True)
    rth_open_time   = Column(String, nullable=True)
    rth_sealed      = Column(Boolean, default=False)
    globex_high     = Column(Float, nullable=True)
    globex_low      = Column(Float, nullable=True)
    globex_open     = Column(Float, nullable=True)
    is_week_first_day  = Column(Boolean, default=False)
    is_month_first_day = Column(Boolean, default=False)
    weekly_open     = Column(Float, nullable=True)
    monthly_open    = Column(Float, nullable=True)
    or5_high     = Column(Float, nullable=True)
    or5_low      = Column(Float, nullable=True)
    or5_sealed   = Column(Boolean, default=False)
    or15_high    = Column(Float, nullable=True)
    or15_low     = Column(Float, nullable=True)
    or15_sealed  = Column(Boolean, default=False)
    pwh          = Column(Float, nullable=True)   # Prior Week High
    pwl          = Column(Float, nullable=True)   # Prior Week Low
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (UniqueConstraint("symbol", "trade_date", name="ux_daily_bars_symbol_date"),)


class Trade(Base):
    __tablename__ = "trades"

    id                  = Column(Integer, primary_key=True, index=True)
    entry_order_id      = Column(String, nullable=False, index=True)
    exit_order_id       = Column(String, nullable=False, index=True)
    trade_id_label      = Column(String, nullable=True)
    entry_date          = Column(String, nullable=False)
    entry_time          = Column(String, nullable=False)
    exit_date           = Column(String, nullable=False)
    exit_time           = Column(String, nullable=False)
    symbol              = Column(String, nullable=False, index=True)
    contract            = Column(String, nullable=True)
    asset_class         = Column(String, nullable=True)
    position_type       = Column(String, nullable=False)
    entry_price         = Column(Float, nullable=False)
    exit_price          = Column(Float, nullable=False)
    stop_loss           = Column(Float, nullable=True)
    take_profit         = Column(Float, nullable=True)
    position_size       = Column(Float, nullable=True)
    risk_dollars        = Column(Float, nullable=True)
    risk_pct            = Column(Float, nullable=True)
    fees_commission     = Column(Float, nullable=True)
    slippage            = Column(Float, nullable=True)
    points              = Column(Float, nullable=True)
    gross_pnl           = Column(Float, nullable=True)
    net_pnl             = Column(Float, nullable=True)
    r_multiple          = Column(Float, nullable=True)
    duration_min        = Column(Float, nullable=True)
    duration_hrs        = Column(Float, nullable=True)
    day_of_week         = Column(String, nullable=True)
    entry_hour          = Column(Integer, nullable=True)
    strategy_tag        = Column(String, nullable=True)
    setup_quality       = Column(String, nullable=True)
    trade_quality_score = Column(Integer, nullable=True)
    tags                = Column(String, nullable=True)
    week_label          = Column(String, nullable=True, index=True)
    notes               = Column(Text, nullable=True)
    vwap_posture_at_entry = Column(String, nullable=True)
    atr_regime_at_entry   = Column(String, nullable=True)
    vix_regime_at_entry   = Column(String, nullable=True)
    created_at          = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at          = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                                 onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("entry_order_id", "exit_order_id", name="uq_trades_entry_exit_order"),
    )
