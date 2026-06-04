import React from 'react'
import { N } from '../../utils/format'

function KpiTile({ label, value, tone, sub }) {
  return (
    <div className="card reveal" style={{ padding: '16px' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '22px',
        fontFamily: 'var(--f-mono)',
        fontWeight: 600,
        color: tone === 'bull' ? 'var(--bull)'
             : tone === 'bear' ? 'var(--bear)'
             : tone === 'gold' ? 'var(--gold)'
             : 'var(--text)',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{sub}</div>
      )}
    </div>
  )
}

function toneForPnl(v) {
  if (v == null) return ''
  return v > 0 ? 'bull' : v < 0 ? 'bear' : ''
}

function toneForWinRate(v) {
  if (v == null) return ''
  return v >= 55 ? 'bull' : v < 45 ? 'bear' : 'gold'
}

function toneForPF(v) {
  if (v == null) return ''
  return v >= 1.5 ? 'bull' : v < 1.0 ? 'bear' : 'gold'
}

export default function JournalScorecard({ stats, loading }) {
  if (!stats && !loading) {
    return (
      <div className="card reveal r-2" style={{ marginBottom: 'var(--gap)', padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
        No trades yet — upload a CSV or XLSX to get started.
      </div>
    )
  }

  if (!stats) return null

  // Empty state: stats loaded but no trades match the current filters
  if (stats.total_trades === 0) {
    return (
      <div className="card reveal r-2" style={{ marginBottom: 'var(--gap)', padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
        No trades match the current filters.
      </div>
    )
  }

  const s = stats
  const streakLabel = s.streak_current > 0
    ? `${s.streak_current}W streak`
    : s.streak_current < 0
    ? `${Math.abs(s.streak_current)}L streak`
    : 'No streak'

  return (
    <div style={{ marginBottom: 'var(--gap)' }}>
      {/* Row 1 */}
      <div className="grid g4 reveal r-2" style={{ marginBottom: '8px' }}>
        <KpiTile
          label="Total Trades"
          value={s.total_trades}
          tone=""
          sub={`${s.winning_trades}W / ${s.losing_trades}L`}
        />
        <KpiTile
          label="Win Rate"
          value={`${N(s.win_rate_pct, 1)}%`}
          tone={toneForWinRate(s.win_rate_pct)}
        />
        <KpiTile
          label="Net P&L"
          value={`$${N(s.net_pnl)}`}
          tone={toneForPnl(s.net_pnl)}
          sub={`Gross $${N(s.gross_pnl)}`}
        />
        <KpiTile
          label="Profit Factor"
          value={s.profit_factor != null ? N(s.profit_factor, 2) : '—'}
          tone={toneForPF(s.profit_factor)}
        />
      </div>

      {/* Row 2 */}
      <div className="grid g4 reveal r-3" style={{ marginBottom: '8px' }}>
        <KpiTile
          label="Avg Win"
          value={`$${N(s.avg_win)}`}
          tone="bull"
          sub={`Max $${N(s.largest_win)}`}
        />
        <KpiTile
          label="Avg Loss"
          value={`$${N(s.avg_loss)}`}
          tone="bear"
          sub={`Max $${N(s.largest_loss)}`}
        />
        <KpiTile
          label="Expectancy"
          value={`$${N(s.expectancy_per_trade)}`}
          tone={toneForPnl(s.expectancy_per_trade)}
          sub="per trade"
        />
        <KpiTile
          label="Max Drawdown"
          value={`$${N(Math.abs(s.max_drawdown_dollars))}`}
          tone="bear"
          sub={`${N(Math.abs(s.max_drawdown_pct), 1)}%`}
        />
      </div>

      {/* Row 3 */}
      <div className="grid g3 reveal r-4" style={{ marginBottom: 'var(--gap)' }}>
        <KpiTile
          label="Best Day"
          value={s.best_day_of_week || '—'}
          tone=""
        />
        <KpiTile
          label="Best Session"
          value={s.best_session || '—'}
          tone=""
          sub={s.avg_r_multiple != null ? `Avg R: ${N(s.avg_r_multiple, 2)}` : undefined}
        />
        <KpiTile
          label="Streak"
          value={streakLabel}
          tone={s.streak_current > 0 ? 'bull' : s.streak_current < 0 ? 'bear' : ''}
          sub={`Best ${s.streak_max_win}W / ${s.streak_max_loss}L`}
        />
      </div>
    </div>
  )
}
