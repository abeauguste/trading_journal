import React from 'react'
import { N } from '../../utils/format'

const ROWS = [
  { key: 'daily',     label: 'Daily',     dim: false },
  { key: 'weekly',    label: 'Weekly',    dim: false },
  { key: 'monthly',   label: 'Monthly',   dim: false },
  { key: 'quarterly', label: 'Quarterly', dim: true  },
  { key: 'yearly',    label: 'Yearly',    dim: true  },
]

function postureCls(posture) {
  if (!posture) return 'pill-gold'
  const p = posture.toUpperCase()
  if (p.includes('BULL') || p === 'ABOVE') return 'pill-bull'
  if (p.includes('BEAR') || p === 'BELOW') return 'pill-bear'
  return 'pill-gold'
}

export default function VwapStackCard({ vwapAnalysis }) {
  return (
    <div className="card reveal r-3">
      <div className="card-hdr">
        <span className="card-title">VWAP Stack</span>
        <span className="eyebrow muted">Price vs Anchored VWAPs</span>
      </div>
      {!vwapAnalysis ? (
        <div className="card-body">
          <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            VWAP data updates on next bar close
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Timeframe</th>
                <th>VWAP</th>
                <th>Posture</th>
                <th>Δ pts</th>
                <th>ATR dist</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label, dim }) => {
                const row = vwapAnalysis[key]
                const dPts = row?.distance_pts
                return (
                  <tr key={key} style={dim ? { opacity: 0.6 } : undefined}>
                    <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{label}</td>
                    <td className="mono" style={{ fontSize: '12px' }}>
                      {row?.vwap != null ? N(row.vwap, 2) : '—'}
                    </td>
                    <td>
                      {row?.posture ? (
                        <span className={`pill ${postureCls(row.posture)}`} style={{ fontSize: '9.5px' }}>
                          {row.posture}
                        </span>
                      ) : '—'}
                    </td>
                    <td
                      className="mono"
                      style={{
                        fontSize: '12px',
                        color: dPts != null ? (dPts >= 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text-3)',
                      }}
                    >
                      {dPts != null ? `${dPts >= 0 ? '+' : ''}${N(dPts, 2)}` : '—'}
                    </td>
                    <td className="mono" style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {row?.distance_atr_units != null ? N(row.distance_atr_units, 2) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
