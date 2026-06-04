import React from 'react'
import { N } from '../../utils/format'

function AttributionTable({ title, data }) {
  if (!data) return null
  const coverage = data._coverage_pct ?? 0
  const rows = Object.entries(data).filter(([k]) => k !== '_coverage_pct')
  if (rows.length === 0) return (
    <div>
      <div style={{ fontSize: '11px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No data yet</div>
    </div>
  )
  const bestRow = rows.reduce((a, b) => (a[1].win_rate > b[1].win_rate ? a : b))[0]
  const worstRow = rows.reduce((a, b) => (a[1].win_rate < b[1].win_rate ? a : b))[0]
  return (
    <div>
      <div style={{ fontSize: '11px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
        {title} <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>({N(coverage, 0)}% coverage)</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Condition</th><th>Trades</th><th>Win%</th><th>Avg P&amp;L</th></tr></thead>
          <tbody>
            {rows.map(([cond, d]) => (
              <tr key={cond} style={{
                background: cond === bestRow ? 'rgba(63,185,80,.06)' : cond === worstRow ? 'rgba(248,81,73,.06)' : undefined
              }}>
                <td style={{ fontSize: '11px' }}>{cond}</td>
                <td className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{d.count}</td>
                <td className={`mono ${d.win_rate >= 0.5 ? 'tone-bull' : 'tone-bear'}`} style={{ fontSize: '11px' }}>{N(d.win_rate * 100, 1)}%</td>
                <td className={`mono ${d.avg_pnl >= 0 ? 'tone-bull' : 'tone-bear'}`} style={{ fontSize: '11px' }}>${N(d.avg_pnl, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PerformanceAttributionCard({ stats }) {
  if (!stats || stats.total_trades < 5) return null
  const hasAny = stats.by_vwap_posture || stats.by_atr_regime || stats.by_vix_regime
  if (!hasAny) return null

  return (
    <div className="card" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr"><span className="card-title">Performance Attribution</span></div>
      <div className="card-body">
        <div className="grid g3" style={{ gap: 'var(--gap)' }}>
          <AttributionTable title="By VWAP Posture" data={stats.by_vwap_posture} />
          <AttributionTable title="By ATR Regime" data={stats.by_atr_regime} />
          <AttributionTable title="By VIX Regime" data={stats.by_vix_regime} />
        </div>
      </div>
    </div>
  )
}
