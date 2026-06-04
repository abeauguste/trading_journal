import React, { useMemo } from 'react'
import { N } from '../../utils/format'

function pnlColor(v) {
  return v >= 0 ? 'var(--bull)' : 'var(--bear)'
}
function wrColor(pct) {
  return pct >= 60 ? 'var(--bull)' : pct <= 40 ? 'var(--bear)' : 'var(--text)'
}
function pfColor(pf) {
  if (pf == null) return 'var(--bull)'
  return pf >= 1.5 ? 'var(--bull)' : pf < 1.0 ? 'var(--bear)' : 'var(--text)'
}

const th = {
  padding: '8px 12px', fontSize: '10px', textTransform: 'uppercase',
  letterSpacing: '.07em', color: 'var(--text-3)', textAlign: 'left',
  fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
}
const td = {
  padding: '8px 12px', fontSize: '12px',
  borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
}

export default function SessionPerformanceTable({ bySession }) {
  const rows = useMemo(() => {
    if (!bySession) return []
    return Object.entries(bySession)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => (b.net_pnl ?? 0) - (a.net_pnl ?? 0))
  }, [bySession])

  if (!rows.length) return null

  return (
    <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Session Performance</span>
        <span className="eyebrow" style={{ color: 'var(--bear)' }}>Strategy / Session</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Strategy / Session</th>
              <th style={{ ...th, textAlign: 'right' }}>Trades</th>
              <th style={{ ...th, textAlign: 'right' }}>Net P&L</th>
              <th style={{ ...th, textAlign: 'right' }}>Win Rate</th>
              <th style={{ ...th, textAlign: 'right' }}>Avg / Trade</th>
              <th style={{ ...th, textAlign: 'right' }}>PF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const wrPct = r.win_rate != null ? r.win_rate * 100 : null
              return (
                <tr key={r.name} style={{ background: 'transparent' }}>
                  <td style={{ ...td, fontFamily: 'var(--f-mono)', fontWeight: 500 }}>{r.name}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--text-2)' }}>{r.count ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--f-mono)', color: pnlColor(r.net_pnl ?? 0) }}>
                    {r.net_pnl != null ? `${r.net_pnl >= 0 ? '+' : ''}$${N(r.net_pnl, 2)}` : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: wrColor(wrPct ?? 50) }}>
                    {wrPct != null ? N(wrPct, 1) + '%' : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--f-mono)', color: pnlColor(r.avg_pnl ?? 0) }}>
                    {r.avg_pnl != null ? `${r.avg_pnl >= 0 ? '+' : ''}$${N(r.avg_pnl, 2)}` : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--f-mono)', color: pfColor(r.profit_factor) }}>
                    {r.profit_factor == null ? '∞' : N(r.profit_factor, 2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
