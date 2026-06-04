"""
Journal router — Trading Journal backend.
POST   /journal/trades/import   bulk import FIFO-matched trades
GET    /journal/trades          paginated list with filters
GET    /journal/trades/{id}     single trade
PATCH  /journal/trades/{id}     update annotations
DELETE /journal/trades/{id}     hard delete single
DELETE /journal/trades          bulk clear (?confirm=true)
GET    /journal/stats           KPI stats with optional filters
"""
import json
import logging
import math
import statistics as _stats
from collections import defaultdict
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Trade, IntelligenceReport
from ..schemas import (
    TradeIn, TradeOut, TradeUpdateIn,
    TradeListResponse, TradeImportResponse, JournalStatsOut,
)

logger = logging.getLogger("router.journal")
router = APIRouter()


def _coerce(v):
    """Empty string → None for Float columns."""
    return None if isinstance(v, str) and v.strip() == "" else v


def _ulcer_index(pnl_values):
    if len(pnl_values) < 2:
        return None
    running, peak, dd_pcts = 0.0, 0.0, []
    for v in pnl_values:
        running += v
        if running > peak:
            peak = running
        dd_pcts.append((running - peak) / peak if peak > 0 else 0.0)
    # If equity never went positive, peak stayed 0 — can't compute meaningful ulcer index
    if peak == 0.0:
        return None
    return round(math.sqrt(sum(x**2 for x in dd_pcts) / len(dd_pcts)), 4)


def _var_95(pnl_values):
    if len(pnl_values) < 20:
        return None
    sorted_pnl = sorted(pnl_values)
    idx = max(0, int(math.floor(len(sorted_pnl) * 0.05)))
    return round(sorted_pnl[idx], 2)


def _sharpe_sortino(trades):
    daily: dict = defaultdict(float)
    for t in trades:
        if t.entry_date:
            daily[t.entry_date] += (t.net_pnl or 0.0)
    daily_pnl = list(daily.values())
    if len(daily_pnl) < 2:
        return None, None
    mean_d = _stats.mean(daily_pnl)
    std_d  = _stats.stdev(daily_pnl)
    sharpe = round((mean_d / std_d) * math.sqrt(252), 3) if std_d > 0 else None
    neg = [v for v in daily_pnl if v < 0]
    if len(neg) < 2:
        sortino = None
    else:
        down_std = _stats.stdev(neg)
        sortino  = round((mean_d / down_std) * math.sqrt(252), 3) if down_std > 0 else None
    return sharpe, sortino


def _risk_of_ruin(win_rate, profit_factor):
    if profit_factor is None:
        return 0.0
    if win_rate >= 0.5 and profit_factor > 1.0:
        return 0.0
    if win_rate <= 0:
        return 100.0
    q = 1.0 - win_rate
    return round(min((q / win_rate) * 100, 100.0), 2)


def _revenge_trades(trades):
    from collections import defaultdict
    day_groups: dict = defaultdict(list)
    for t in trades:
        if t.entry_date:
            day_groups[t.entry_date].append(t)
    count = 0
    for day_trades in day_groups.values():
        day_sorted = sorted(day_trades, key=lambda t: (t.entry_time or ""))
        for i in range(1, len(day_sorted)):
            prev = day_sorted[i - 1]
            curr = day_sorted[i]
            if (prev.net_pnl or 0.0) >= 0:
                continue
            try:
                fmt = "%H:%M:%S"
                prev_exit = datetime.strptime(prev.exit_time or "", fmt)
                curr_entry = datetime.strptime(curr.entry_time or "", fmt)
            except ValueError:
                try:
                    fmt = "%H:%M"
                    prev_exit = datetime.strptime((prev.exit_time or "")[:5], fmt)
                    curr_entry = datetime.strptime((curr.entry_time or "")[:5], fmt)
                except ValueError:
                    continue
            gap = (curr_entry - prev_exit).total_seconds()
            if 0 <= gap <= 600:
                count += 1
    return count


def _by_hour_day(trades):
    DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    result: dict = defaultdict(lambda: defaultdict(float))
    for t in trades:
        if (t.day_of_week or "") not in DAY_ORDER:
            continue
        if t.entry_hour is None or not (6 <= t.entry_hour <= 18):
            continue
        result[t.day_of_week][str(t.entry_hour).zfill(2)] += (t.net_pnl or 0.0)
    return {
        day: {h: round(result[day][h], 2) for h in result[day]}
        for day in DAY_ORDER
        if day in result
    }


def _compute_stats(trades: List[Trade]) -> JournalStatsOut:
    n = len(trades)
    if n == 0:
        return JournalStatsOut(
            total_trades=0, winning_trades=0, losing_trades=0,
            win_rate_pct=0.0, net_pnl=0.0, gross_pnl=0.0,
            profit_factor=None, expectancy_per_trade=0.0,
            avg_win=0.0, avg_loss=0.0, largest_win=0.0, largest_loss=0.0,
            max_drawdown_dollars=0.0, max_drawdown_pct=0.0,
            avg_r_multiple=None, avg_duration_min=None,
            best_day_of_week=None, best_session=None,
            streak_current=0, streak_max_win=0, streak_max_loss=0,
            by_day_of_week={}, by_session={},
        )

    sorted_trades = sorted(trades, key=lambda t: (t.entry_date or "", t.entry_time or ""))
    pnl_values = [t.net_pnl or 0.0 for t in sorted_trades]
    wins   = [v for v in pnl_values if v > 0]
    losses = [v for v in pnl_values if v < 0]
    net_sum   = sum(pnl_values)
    gross_sum = sum(t.gross_pnl or 0.0 for t in sorted_trades)
    win_sum   = sum(wins)
    loss_sum  = sum(losses)
    profit_factor = round(win_sum / abs(loss_sum), 3) if loss_sum < 0 else None

    # Drawdown — peak starts at 0.0 (baseline equity), not -inf
    running, peak, max_dd_d, max_dd_pct = 0.0, 0.0, 0.0, 0.0
    for v in pnl_values:
        running += v
        if running > peak:
            peak = running
        dd = running - peak
        if dd < max_dd_d:
            max_dd_d = dd
            if peak > 0:
                max_dd_pct = dd / peak

    r_vals   = [t.r_multiple  for t in sorted_trades if t.r_multiple  is not None]
    dur_vals = [t.duration_min for t in sorted_trades if t.duration_min is not None]
    avg_r   = round(sum(r_vals)   / len(r_vals),   3) if r_vals   else None
    avg_dur = round(sum(dur_vals) / len(dur_vals), 1) if dur_vals else None

    # Day of week breakdown
    day_groups: dict = defaultdict(list)
    for t in sorted_trades:
        if t.day_of_week:
            day_groups[t.day_of_week].append(t.net_pnl or 0.0)
    by_day = {d: round(sum(v) / len(v), 2) for d, v in day_groups.items()}
    best_day = max(by_day, key=by_day.get) if by_day else None

    # Session breakdown (uses strategy_tag as session proxy)
    session_groups: dict = defaultdict(list)
    for t in sorted_trades:
        if t.strategy_tag:
            session_groups[t.strategy_tag].append(t.net_pnl or 0.0)
    by_session = {}
    for sess, pnls in session_groups.items():
        w_s = [v for v in pnls if v > 0]
        l_s = [v for v in pnls if v < 0]
        by_session[sess] = {
            "win_rate":      round(len(w_s) / len(pnls), 4),
            "count":         len(pnls),
            "avg_pnl":       round(sum(pnls) / len(pnls), 2),
            "net_pnl":       round(sum(pnls), 2),
            "profit_factor": round(sum(w_s) / abs(sum(l_s)), 3) if l_s else None,
        }
    best_session = max(by_session, key=lambda s: by_session[s]["avg_pnl"]) if by_session else None

    # --- Extended analytics ---
    ulcer = _ulcer_index(pnl_values)
    var95 = _var_95(pnl_values)
    std_pnl = round(_stats.stdev(pnl_values), 2) if len(pnl_values) >= 2 else None
    sharpe, sortino = _sharpe_sortino(sorted_trades)
    ror = _risk_of_ruin(len(wins) / n, profit_factor)

    # Behavioral
    date_groups: dict = defaultdict(list)
    for t in sorted_trades:
        if t.entry_date:
            date_groups[t.entry_date].append(t)
    unique_days = len(date_groups)
    trades_per_day_val  = round(n / unique_days, 2) if unique_days > 0 else None
    overtrading_days_val = sum(1 for v in date_groups.values() if len(v) > 5)
    max_tpd = max((len(v) for v in date_groups.values()), default=0)
    revenge = _revenge_trades(sorted_trades)

    long_trades  = [t for t in sorted_trades if (t.position_type or "").upper() == "LONG"]
    short_trades = [t for t in sorted_trades if (t.position_type or "").upper() == "SHORT"]
    long_wins    = [t for t in long_trades  if (t.net_pnl or 0.0) > 0]
    short_wins   = [t for t in short_trades if (t.net_pnl or 0.0) > 0]
    long_wr  = round(len(long_wins)  / len(long_trades)  * 100, 2) if long_trades  else None
    short_wr = round(len(short_wins) / len(short_trades) * 100, 2) if short_trades else None
    commissions = round(sum(t.fees_commission or 0.0 for t in sorted_trades), 2)

    # Execution quality
    slip_vals = [abs(t.slippage) for t in sorted_trades if t.slippage is not None]
    avg_slip  = round(_stats.mean(slip_vals),   4) if slip_vals else 0.0
    med_slip  = round(_stats.median(slip_vals), 4) if slip_vals else 0.0
    slip_drag = round(sum(slip_vals) * 5.0, 2)     if slip_vals else 0.0

    dur_all  = [t.duration_min for t in sorted_trades if t.duration_min is not None]
    hold_std = round(_stats.stdev(dur_all), 2) if len(dur_all) >= 2 else None
    same_day = sum(1 for t in sorted_trades if t.entry_date == t.exit_date)
    same_day_pct = round(same_day / n * 100, 2)

    # Heatmap
    by_hd = _by_hour_day(sorted_trades)

    # Streak
    streak_current = streak_max_win = streak_max_loss = run = 0
    for v in pnl_values:
        if v > 0:
            run = run + 1 if run >= 0 else 1
        elif v < 0:
            run = run - 1 if run <= 0 else -1
        else:
            run = 0
        streak_max_win  = max(streak_max_win,  run)
        streak_max_loss = max(streak_max_loss, -run)
    streak_current = run

    # ── Attribution breakdowns ──────────────────────────────────────────────
    def _attribution_breakdown(trades_list, key_fn):
        groups = {}
        for t in trades_list:
            k = key_fn(t)
            if not k: continue
            if k not in groups:
                groups[k] = {"count": 0, "wins": 0, "net_pnl": 0.0, "pnls": []}
            groups[k]["count"] += 1
            groups[k]["net_pnl"] += (t.net_pnl or 0)
            groups[k]["pnls"].append(t.net_pnl or 0)
            if (t.net_pnl or 0) > 0:
                groups[k]["wins"] += 1
        result = {}
        for k, g in groups.items():
            wins_pnl = [p for p in g["pnls"] if p > 0]
            loss_pnl = [p for p in g["pnls"] if p <= 0]
            pf = (sum(wins_pnl) / abs(sum(loss_pnl))) if loss_pnl and sum(loss_pnl) != 0 else None
            result[k] = {
                "count": g["count"],
                "win_rate": round(g["wins"] / g["count"], 4) if g["count"] > 0 else 0,
                "net_pnl": round(g["net_pnl"], 2),
                "avg_pnl": round(g["net_pnl"] / g["count"], 2) if g["count"] > 0 else 0,
                "profit_factor": round(pf, 3) if pf else None,
            }
        covered = len([t for t in trades_list if key_fn(t)])
        result["_coverage_pct"] = round(covered / len(trades_list) * 100, 1) if trades_list else 0
        return result

    by_vwap = _attribution_breakdown(sorted_trades, lambda t: t.vwap_posture_at_entry)
    by_atr  = _attribution_breakdown(sorted_trades, lambda t: t.atr_regime_at_entry)
    by_vix  = _attribution_breakdown(sorted_trades, lambda t: t.vix_regime_at_entry)

    return JournalStatsOut(
        total_trades=n,
        winning_trades=len(wins),
        losing_trades=len(losses),
        win_rate_pct=round(len(wins) / n * 100, 2),
        net_pnl=round(net_sum, 2),
        gross_pnl=round(gross_sum, 2),
        profit_factor=profit_factor,
        expectancy_per_trade=round(net_sum / n, 2),
        avg_win=round(win_sum / len(wins), 2) if wins else 0.0,
        avg_loss=round(loss_sum / len(losses), 2) if losses else 0.0,
        largest_win=max(wins, default=0.0),
        largest_loss=min(losses, default=0.0),
        max_drawdown_dollars=round(max_dd_d, 2),
        max_drawdown_pct=round(max_dd_pct * 100, 2),
        avg_r_multiple=avg_r,
        avg_duration_min=avg_dur,
        best_day_of_week=best_day,
        best_session=best_session,
        streak_current=streak_current,
        streak_max_win=streak_max_win,
        streak_max_loss=streak_max_loss,
        by_day_of_week=by_day,
        by_session=by_session,
        # Risk Metrics
        ulcer_index=ulcer,
        var_95=var95,
        std_dev_pnl=std_pnl,
        sharpe_annualized=sharpe,
        sortino_annualized=sortino,
        risk_of_ruin=ror,
        # Behavioral
        trades_per_day=trades_per_day_val,
        overtrading_days=overtrading_days_val,
        max_trades_per_day=max_tpd,
        revenge_trades=revenge,
        long_win_rate_pct=long_wr,
        short_win_rate_pct=short_wr,
        commissions_total=commissions,
        # Execution quality
        avg_slippage=avg_slip,
        median_slippage=med_slip,
        slippage_drag=slip_drag,
        fill_rate_pct=100.0,
        holding_time_std_dev=hold_std,
        trades_closed_same_day_pct=same_day_pct,
        entry_efficiency_score=None,
        exit_efficiency_score=None,
        composite_execution_score=None,
        # Heatmap
        by_hour_day=by_hd,
        # Attribution breakdowns
        by_vwap_posture=by_vwap if by_vwap else None,
        by_atr_regime=by_atr if by_atr else None,
        by_vix_regime=by_vix if by_vix else None,
    )


def _apply_filters(q, symbol, position_type, date_from, date_to, min_score):
    if symbol:        q = q.filter(Trade.symbol == symbol.upper())
    if position_type: q = q.filter(Trade.position_type == position_type.upper())
    if date_from:     q = q.filter(Trade.entry_date >= date_from)
    if date_to:       q = q.filter(Trade.entry_date <= date_to)
    if min_score:     q = q.filter(Trade.trade_quality_score >= min_score)
    return q


@router.post("/trades/import", response_model=TradeImportResponse, status_code=201)
def import_trades(payload: List[TradeIn], db: Session = Depends(get_db)):
    """Bulk import FIFO-matched trades. Dedupes by (entry_order_id, exit_order_id)."""
    from sqlalchemy.exc import IntegrityError
    # Validate all trades have non-empty order IDs before touching the DB
    for t in payload:
        if not (t.entry_order_id or "").strip() or not (t.exit_order_id or "").strip():
            raise HTTPException(
                status_code=422,
                detail=f"entry_order_id and exit_order_id must be non-empty strings (trade: {t.trade_id_label or 'unknown'})"
            )
    existing_keys = set(db.query(Trade.entry_order_id, Trade.exit_order_id).all())
    inserted = skipped = 0
    for t in payload:
        pair = (t.entry_order_id, t.exit_order_id)
        if pair in existing_keys:
            skipped += 1
            continue
        trade = Trade(
            entry_order_id=t.entry_order_id, exit_order_id=t.exit_order_id,
            trade_id_label=t.trade_id_label,
            entry_date=t.entry_date, entry_time=t.entry_time,
            exit_date=t.exit_date,   exit_time=t.exit_time,
            symbol=t.symbol.upper(), contract=t.contract, asset_class=t.asset_class,
            position_type=t.position_type.upper(),
            entry_price=t.entry_price, exit_price=t.exit_price,
            stop_loss=_coerce(t.stop_loss), take_profit=_coerce(t.take_profit),
            position_size=t.position_size, risk_dollars=t.risk_dollars, risk_pct=t.risk_pct,
            fees_commission=t.fees_commission, slippage=_coerce(t.slippage),
            points=t.points, gross_pnl=t.gross_pnl, net_pnl=t.net_pnl, r_multiple=t.r_multiple,
            duration_min=t.duration_min, duration_hrs=t.duration_hrs,
            day_of_week=t.day_of_week, entry_hour=t.entry_hour,
            strategy_tag=t.strategy_tag, setup_quality=t.setup_quality,
            trade_quality_score=t.trade_quality_score, tags=t.tags,
            week_label=t.week_label, notes=t.notes,
            created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
        )
        # Enrich with market condition data at time of entry
        try:
            from datetime import datetime as _dt
            entry_str = f"{t.entry_date}T{t.entry_time or '00:00:00'}"
            entry_dt = _dt.fromisoformat(entry_str)
            if entry_dt.tzinfo is None:
                entry_dt = entry_dt.replace(tzinfo=timezone.utc)
            ir = db.query(IntelligenceReport).filter(
                IntelligenceReport.generated_at <= entry_dt
            ).order_by(IntelligenceReport.generated_at.desc()).first()
            if ir and ir.report_json and (entry_dt - ir.generated_at.replace(tzinfo=timezone.utc)).total_seconds() <= 86400:
                rj = json.loads(ir.report_json)
                summary = rj.get('vwap_posture', {}).get('summary', '')
                trade.vwap_posture_at_entry = summary.split(' — ')[0] if summary else None
                trade.atr_regime_at_entry = ir.atr_regime
                trade.vix_regime_at_entry = ir.vix_regime
        except Exception:
            pass
        db.add(trade)
        existing_keys.add(pair)
        inserted += 1
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate key conflict — retry import")
    total = db.query(Trade).count()
    logger.info("import_trades: inserted=%d skipped=%d total=%d", inserted, skipped, total)
    return TradeImportResponse(inserted=inserted, skipped=skipped, total=total)


@router.get("/trades", response_model=TradeListResponse)
def list_trades(
    symbol:        Optional[str] = Query(None),
    position_type: Optional[str] = Query(None),
    date_from:     Optional[str] = Query(None),
    date_to:       Optional[str] = Query(None),
    min_score:     Optional[int] = Query(None, ge=1, le=10),
    page:          int           = Query(1, ge=1),
    page_size:     int           = Query(25, ge=1, le=2000),
    db:            Session       = Depends(get_db),
):
    q = _apply_filters(db.query(Trade), symbol, position_type, date_from, date_to, min_score)
    total  = q.count()
    trades = q.order_by(Trade.entry_date.desc(), Trade.entry_time.desc()) \
              .offset((page - 1) * page_size).limit(page_size).all()
    return TradeListResponse(trades=[TradeOut.model_validate(r) for r in trades], total=total)


@router.get("/trades/{trade_id}", response_model=TradeOut)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return TradeOut.model_validate(trade)


@router.patch("/trades/{trade_id}", response_model=TradeOut)
def update_trade(trade_id: int, payload: TradeUpdateIn, db: Session = Depends(get_db)):
    """Update user-annotation fields only."""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(trade, field, value)
    trade.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trade)
    return TradeOut.model_validate(trade)


@router.delete("/trades/{trade_id}", status_code=204)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()


@router.delete("/trades", status_code=200)
def bulk_clear_trades(confirm: bool = Query(False), db: Session = Depends(get_db)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Requires ?confirm=true")
    deleted = db.query(Trade).delete()
    db.commit()
    logger.warning("bulk_clear_trades: deleted %d", deleted)
    return {"deleted": deleted}


@router.get("/stats", response_model=JournalStatsOut)
def get_journal_stats(
    symbol:        Optional[str] = Query(None),
    position_type: Optional[str] = Query(None),
    date_from:     Optional[str] = Query(None),
    date_to:       Optional[str] = Query(None),
    min_score:     Optional[int] = Query(None, ge=1, le=10),
    db:            Session       = Depends(get_db),
):
    trades = _apply_filters(db.query(Trade), symbol, position_type, date_from, date_to, min_score) \
             .order_by(Trade.entry_date.asc(), Trade.entry_time.asc()).all()
    return _compute_stats(trades)
