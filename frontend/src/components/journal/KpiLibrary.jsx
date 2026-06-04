import React, { useState } from 'react'
import { N } from '../../utils/format'

function formatDuration(min) {
  if (min == null) return '—'
  if (min < 60) return `${Math.round(min)}m`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function val(v, fallback = '—') {
  return v != null ? v : fallback
}

export default function KpiLibrary({ stats, allTrades }) {
  const [open, setOpen] = useState({ 0: true, 1: false, 2: false, 3: false })
  const toggle = (i) => setOpen(o => ({ ...o, [i]: !o[i] }))

  if (!stats) return null

  const s = stats

  const SECTIONS = [
    {
      label: 'Execution Quality',
      metrics: [
        { label: 'Avg Slippage $/side',       value: s.avg_slippage != null ? `$${N(s.avg_slippage, 2)}` : '—', color: 'var(--text)', def: 'Average dollar slippage per side.' },
        { label: 'Median Slippage $/side',    value: s.median_slippage != null ? `$${N(s.median_slippage, 2)}` : '—', color: 'var(--text)', def: 'Median slippage per side — less skewed by outliers.' },
        { label: 'Slippage Drag $',           value: s.slippage_drag != null ? `$${N(s.slippage_drag, 2)}` : '—', color: 'var(--text)', def: 'Total dollar drag from slippage across all trades.' },
        { label: 'Entry Efficiency Score',    value: s.entry_efficiency_score != null ? N(s.entry_efficiency_score, 1) + '%' : 'N/A', color: 'var(--text-3)', def: 'How close entries were to optimal fill price (requires intraday range data).' },
        { label: 'Exit Efficiency Score',     value: s.exit_efficiency_score != null ? N(s.exit_efficiency_score, 1) + '%' : 'N/A', color: 'var(--text-3)', def: 'How close exits were to optimal fill price.' },
        { label: 'Composite Execution',       value: s.composite_execution_score != null ? N(s.composite_execution_score, 1) + '%' : 'N/A', color: 'var(--text-3)', def: 'Blended entry + exit efficiency score.' },
        { label: 'Fill Rate %',               value: s.fill_rate_pct != null ? `${N(s.fill_rate_pct, 1)}%` : '—', color: 'var(--bull)', def: '% of placed orders that received a fill.' },
        { label: 'Avg Holding Time',          value: formatDuration(s.avg_duration_min), color: 'var(--text)', def: 'Average time from entry to exit.' },
        { label: 'Holding-Time Std Dev',      value: formatDuration(s.holding_time_std_dev), color: 'var(--text)', def: 'Standard deviation of holding times — high = inconsistent trade management.' },
        { label: 'Closed Same Day %',         value: s.trades_closed_same_day_pct != null ? `${N(s.trades_closed_same_day_pct, 1)}%` : '—', color: 'var(--text)', def: '% of trades opened and closed within the same calendar day.' },
      ],
    },
    {
      label: 'Consistency',
      metrics: [
        { label: 'Win Streak Max',    value: val(s.streak_max_win, '—'), color: s.streak_max_win >= 3 ? 'var(--bull)' : 'var(--text)', def: 'Longest consecutive winning trade sequence.' },
        { label: 'Loss Streak Max',   value: val(s.streak_max_loss, '—'), color: s.streak_max_loss >= 3 ? 'var(--bear)' : 'var(--text)', def: 'Longest consecutive losing trade sequence.' },
        { label: 'Current Streak',    value: s.streak_current > 0 ? `+${s.streak_current}W` : s.streak_current < 0 ? `${Math.abs(s.streak_current)}L` : '—', color: s.streak_current > 0 ? 'var(--bull)' : s.streak_current < 0 ? 'var(--bear)' : 'var(--text)', def: 'Active streak at end of the filtered period.' },
        { label: 'Avg R Multiple',    value: s.avg_r_multiple != null ? N(s.avg_r_multiple, 2) + 'R' : '—', color: s.avg_r_multiple != null ? (s.avg_r_multiple > 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text)', def: 'Average risk multiple per trade.' },
        { label: 'Avg Duration',      value: formatDuration(s.avg_duration_min), color: 'var(--text)', def: 'Average trade duration in minutes.' },
        { label: 'Best Day of Week',  value: s.best_day_of_week || '—', color: 'var(--text)', def: 'Day with the highest total net P&L.' },
        { label: 'Best Session',      value: s.best_session || '—', color: 'var(--text)', def: 'Session label with the best average P&L.' },
        { label: 'Expectancy/Trade',  value: s.expectancy_per_trade != null ? `$${N(s.expectancy_per_trade, 2)}` : '—', color: (s.expectancy_per_trade ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)', def: 'Expected dollar return per trade.' },
      ],
    },
    {
      label: 'Risk / Return',
      metrics: [
        { label: 'Net P&L',           value: s.net_pnl != null ? `${s.net_pnl >= 0 ? '+' : ''}$${N(s.net_pnl, 2)}` : '—', color: (s.net_pnl ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)', def: 'Total P&L net of commissions.' },
        { label: 'Gross P&L',         value: s.gross_pnl != null ? `${s.gross_pnl >= 0 ? '+' : ''}$${N(s.gross_pnl, 2)}` : '—', color: (s.gross_pnl ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)', def: 'Total P&L before commissions.' },
        { label: 'Profit Factor',     value: s.profit_factor != null ? N(s.profit_factor, 2) : '—', color: s.profit_factor != null ? (s.profit_factor >= 1.5 ? 'var(--bull)' : s.profit_factor < 1.0 ? 'var(--bear)' : 'var(--text)') : 'var(--text)', def: 'Gross winning P&L ÷ gross losing P&L.' },
        { label: 'Sharpe (ann.)',      value: s.sharpe_annualized != null ? N(s.sharpe_annualized, 3) : '—', color: s.sharpe_annualized != null ? (s.sharpe_annualized >= 1 ? 'var(--bull)' : s.sharpe_annualized < 0 ? 'var(--bear)' : 'var(--text)') : 'var(--text)', def: 'Annualized return ÷ annualized P&L std dev.' },
        { label: 'Sortino (ann.)',     value: s.sortino_annualized != null ? N(s.sortino_annualized, 3) : '—', color: s.sortino_annualized != null ? (s.sortino_annualized >= 1 ? 'var(--bull)' : s.sortino_annualized < 0 ? 'var(--bear)' : 'var(--text)') : 'var(--text)', def: 'Like Sharpe but only penalizes downside volatility.' },
        { label: 'VaR 95%',           value: s.var_95 != null ? `-$${N(Math.abs(s.var_95), 2)}` : '—', color: 'var(--bear)', def: 'Worst expected single-trade loss at 95% confidence.' },
        { label: 'Max Drawdown $',    value: s.max_drawdown_dollars != null ? `-$${N(Math.abs(s.max_drawdown_dollars), 2)}` : '—', color: 'var(--bear)', def: 'Peak-to-trough decline in cumulative equity.' },
        { label: 'Max Drawdown %',    value: s.max_drawdown_pct != null ? `${N(Math.abs(s.max_drawdown_pct), 2)}%` : '—', color: 'var(--bear)', def: 'Max drawdown as % of peak equity.' },
      ],
    },
    {
      label: 'Volume / Behavioral',
      metrics: [
        { label: 'Total Trades',       value: val(s.total_trades, '—'), color: 'var(--text)', def: 'Total completed trades in the filtered period.' },
        { label: 'Trades / Day',       value: s.trades_per_day != null ? N(s.trades_per_day, 2) : '—', color: 'var(--text)', def: 'Average trades per active trading day.' },
        { label: 'Overtrading Days',   value: val(s.overtrading_days, '—'), color: s.overtrading_days != null ? (s.overtrading_days > 0 ? 'var(--bear)' : 'var(--bull)') : 'var(--text)', def: 'Days where trade count exceeded 5 (overtrading threshold).' },
        { label: 'Max Trades/Day',     value: val(s.max_trades_per_day, '—'), color: s.max_trades_per_day != null && s.max_trades_per_day > 10 ? 'var(--bear)' : 'var(--text)', def: 'Most trades taken on any single day.' },
        { label: 'Revenge Trades',     value: val(s.revenge_trades, '—'), color: s.revenge_trades > 0 ? 'var(--bear)' : 'var(--bull)', def: 'Trades entered within 10 minutes of a prior loss — behavioral red flag.' },
        { label: 'Long Win Rate',      value: s.long_win_rate_pct != null ? `${N(s.long_win_rate_pct, 1)}%` : '—', color: s.long_win_rate_pct != null ? (s.long_win_rate_pct >= 55 ? 'var(--bull)' : s.long_win_rate_pct < 45 ? 'var(--bear)' : 'var(--text)') : 'var(--text)', def: 'Win rate on long (buy) trades only.' },
        { label: 'Short Win Rate',     value: s.short_win_rate_pct != null ? `${N(s.short_win_rate_pct, 1)}%` : '—', color: s.short_win_rate_pct != null ? (s.short_win_rate_pct >= 55 ? 'var(--bull)' : s.short_win_rate_pct < 45 ? 'var(--bear)' : 'var(--text)') : 'var(--text)', def: 'Win rate on short (sell) trades only.' },
        { label: 'Commissions Total',  value: s.commissions_total != null ? `$${N(s.commissions_total, 2)}` : '—', color: 'var(--bear)', def: 'Total commissions paid — direct drag on net P&L.' },
      ],
    },
  ]

  const hdrStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    userSelect: 'none',
  }

  return (
    <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">KPI Library</span>
        <span className="eyebrow" style={{ color: 'var(--bear)' }}>Institutional Metrics</span>
      </div>
      {SECTIONS.map((section, idx) => (
        <div key={idx}>
          <div style={{ ...hdrStyle, background: open[idx] ? 'var(--card2)' : 'transparent' }}
               onClick={() => toggle(idx)}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '.10em', color: 'var(--text-2)', fontWeight: 500 }}>
              {section.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pill">{section.metrics.length} Metrics</span>
              <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{open[idx] ? '▼' : '▶'}</span>
            </div>
          </div>
          {open[idx] && (
            <div style={{ padding: '16px 20px' }}>
              {section.metrics.map((m, mi) => (
                <div key={mi} style={{
                  paddingBottom: mi < section.metrics.length - 1 ? '10px' : 0,
                  borderBottom: mi < section.metrics.length - 1 ? '1px dashed var(--border)' : 'none',
                  marginBottom: mi < section.metrics.length - 1 ? '10px' : 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{m.label}</span>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '12px', color: m.color }}>{m.value}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>{m.def}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
