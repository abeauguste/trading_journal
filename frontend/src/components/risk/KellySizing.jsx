import React, { useState } from 'react'
import { N } from '../../utils/format'

function contractsFor(kellyFraction, account, avgLossAbs) {
  if (!account || account <= 0 || avgLossAbs <= 0) return 0
  return Math.max(0, Math.floor((account * kellyFraction) / avgLossAbs))
}

export default function KellySizing({ journalStats }) {
  const [account, setAccount] = useState(100000)

  if (!journalStats) return null

  const { total_trades, win_rate_pct, avg_win, avg_loss } = journalStats
  const avgWin  = Math.abs(avg_win  ?? 0)
  const avgLoss = Math.abs(avg_loss ?? 0)

  // Guard: need at least 10 trades and valid loss data
  if ((total_trades ?? 0) < 10) {
    return (
      <div className="card" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">Kelly Criterion Sizing</span>
          <span className="eyebrow" style={{ color: 'var(--text-3)' }}>Optimal Sizing</span>
        </div>
        <div className="card-body" style={{ color: 'var(--text-3)', fontSize: '12px' }}>
          Kelly Criterion requires at least 10 trades.{' '}
          <span className="tone-gold">{total_trades ?? 0}/10</span> trades logged.
        </div>
      </div>
    )
  }

  const p    = (win_rate_pct ?? 0) / 100
  const q    = 1 - p
  const b    = avgLoss > 0 ? avgWin / avgLoss : 0
  const full = b > 0 ? (p * b - q) / b : -1

  // Negative edge
  if (full <= 0 || avgLoss === 0) {
    return (
      <div className="card" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">Kelly Criterion Sizing</span>
          <span className="eyebrow" style={{ color: 'var(--text-3)' }}>Optimal Sizing</span>
        </div>
        <div className="card-body" style={{ color: 'var(--bear)', fontSize: '12px' }}>
          Negative edge detected — Kelly recommends 0 contracts. Improve win rate or reward:risk ratio first.
        </div>
      </div>
    )
  }

  const half    = full / 2
  const quarter = full / 4

  const tiers = [
    { label: 'Full Kelly',    fraction: full,    color: 'var(--bear)',  note: 'Maximum theoretical — high variance' },
    { label: 'Half Kelly',    fraction: half,    color: 'var(--gold)',  note: 'Practitioner standard' },
    { label: 'Quarter Kelly', fraction: quarter, color: 'var(--bull)',  note: 'Conservative — recommended for live trading' },
  ]

  return (
    <div className="card" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Kelly Criterion Sizing</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-3)' }}>Account ($)</label>
          <input
            className="rinput"
            type="number"
            value={account}
            onChange={e => setAccount(parseFloat(e.target.value) || 0)}
            style={{ width: '120px' }}
          />
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {tiers.map(({ label, fraction, color, note }) => {
            const pct       = Math.min(fraction, 1) * 100
            const contracts = contractsFor(Math.min(fraction, 1), account, avgLoss)
            const dolRisk   = contracts * avgLoss
            return (
              <div key={label} className="kelly-tile" style={{ borderLeftColor: color }}>
                <div style={{
                  fontSize: '10px', fontFamily: 'var(--f-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-3)',
                }}>
                  {label}
                </div>
                <div className="kelly-tile-value" style={{ color }}>
                  {N(pct, 1)}%
                </div>
                <div className="kelly-tile-sub" style={{ color }}>
                  {contracts} contract{contracts !== 1 ? 's' : ''}
                </div>
                <div className="kelly-tile-dol">
                  ${N(dolRisk, 0)} at risk
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {note}
                </div>
              </div>
            )
          })}
        </div>

        <div className="kelly-note">
          Kelly fraction = (p × b − q) / b · p = win rate, b = avg win / avg loss.
          Full Kelly is mathematically optimal but high-variance. Half Kelly is the
          practitioner standard. Quarter Kelly suits live trading with limited data.
          Based on {total_trades} journal trades.
        </div>
      </div>
    </div>
  )
}
