import React from 'react'
import { N } from '../../utils/format'

function KvRow({ label, value, color }) {
  return (
    <div className="kv-row">
      <span className="kv-key">{label}</span>
      <span className="kv-val" style={{ color: color || 'var(--text)', fontFamily: 'var(--f-mono)' }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function fmt(v, decimals = 2) {
  return v != null ? N(v, decimals) : null
}

export default function RiskBehaviorPanel({ stats }) {
  if (!stats) return null

  const s = stats
  const sharpeTone = s.sharpe_annualized != null
    ? (s.sharpe_annualized >= 1 ? 'var(--bull)' : s.sharpe_annualized < 0 ? 'var(--bear)' : 'var(--text)')
    : 'var(--text)'
  const sortinoTone = s.sortino_annualized != null
    ? (s.sortino_annualized >= 1 ? 'var(--bull)' : s.sortino_annualized < 0 ? 'var(--bear)' : 'var(--text)')
    : 'var(--text)'

  const panelStyle = {
    background: 'var(--card2)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '16px',
  }
  const panelHdrStyle = {
    fontSize: '11px', fontFamily: 'var(--f-mono)',
    textTransform: 'uppercase', letterSpacing: '.10em',
    color: 'var(--text-3)', marginBottom: '12px',
    paddingBottom: '8px', borderBottom: '1px solid var(--border)',
    fontWeight: 600,
  }

  return (
    <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Risk &amp; Behavior</span>
        <span className="eyebrow" style={{ color: 'var(--bear)' }}>Monitoring</span>
      </div>
      <div className="card-body">
        <div className="grid g2">
          {/* Left: Risk Metrics */}
          <div style={panelStyle}>
            <div style={panelHdrStyle}>Risk Metrics</div>
            <KvRow label="Max Drawdown $"   value={s.max_drawdown_dollars != null ? `-$${N(Math.abs(s.max_drawdown_dollars), 2)}` : null} color="var(--bear)" />
            <KvRow label="Max Drawdown %"   value={s.max_drawdown_pct != null ? `-${N(Math.abs(s.max_drawdown_pct), 2)}%` : null} color="var(--bear)" />
            <KvRow label="Ulcer Index"      value={fmt(s.ulcer_index, 3)} color={s.ulcer_index != null && s.ulcer_index > 5 ? 'var(--bear)' : 'var(--text)'} />
            <KvRow label="VaR 95%"          value={s.var_95 != null ? `-$${N(Math.abs(s.var_95), 2)}` : null} color="var(--bear)" />
            <KvRow label="Std Dev P&L"      value={s.std_dev_pnl != null ? `$${N(s.std_dev_pnl, 2)}` : null} color="var(--text)" />
            <KvRow label="Sharpe (ann.)"    value={fmt(s.sharpe_annualized, 3)} color={sharpeTone} />
            <KvRow label="Sortino (ann.)"   value={fmt(s.sortino_annualized, 3)} color={sortinoTone} />
            <KvRow label="Risk of Ruin"     value={s.risk_of_ruin != null ? `${N(s.risk_of_ruin, 2)}%` : null} color={s.risk_of_ruin != null && s.risk_of_ruin > 5 ? 'var(--bear)' : 'var(--text)'} />
          </div>

          {/* Right: Behavioral Signals */}
          <div style={panelStyle}>
            <div style={panelHdrStyle}>Behavioral Signals</div>
            <KvRow label="Trades / Day"     value={fmt(s.trades_per_day, 2)} color="var(--text)" />
            <KvRow label="Overtrading Days" value={s.overtrading_days ?? null} color={s.overtrading_days != null ? (s.overtrading_days > 0 ? 'var(--bear)' : 'var(--bull)') : 'var(--text)'} />
            <KvRow label="Max Trades/Day"   value={s.max_trades_per_day ?? null} color={s.max_trades_per_day != null && s.max_trades_per_day > 10 ? 'var(--bear)' : 'var(--text)'} />
            <KvRow label="Revenge Trades"   value={s.revenge_trades ?? null} color={s.revenge_trades != null && s.revenge_trades > 0 ? 'var(--bear)' : 'var(--bull)'} />
            <KvRow label="Max Win Streak"   value={s.streak_max_win ?? null} color={s.streak_max_win != null && s.streak_max_win >= 3 ? 'var(--bull)' : 'var(--text)'} />
            <KvRow label="Max Loss Streak"  value={s.streak_max_loss ?? null} color={s.streak_max_loss != null && s.streak_max_loss >= 3 ? 'var(--bear)' : 'var(--text)'} />
            <KvRow label="Long Win Rate"    value={s.long_win_rate_pct != null ? `${N(s.long_win_rate_pct, 1)}%` : null} color={s.long_win_rate_pct != null ? (s.long_win_rate_pct >= 55 ? 'var(--bull)' : s.long_win_rate_pct < 45 ? 'var(--bear)' : 'var(--text)') : 'var(--text)'} />
            <KvRow label="Short Win Rate"   value={s.short_win_rate_pct != null ? `${N(s.short_win_rate_pct, 1)}%` : null} color={s.short_win_rate_pct != null ? (s.short_win_rate_pct >= 55 ? 'var(--bull)' : s.short_win_rate_pct < 45 ? 'var(--bear)' : 'var(--text)') : 'var(--text)'} />
          </div>
        </div>
      </div>
    </div>
  )
}
