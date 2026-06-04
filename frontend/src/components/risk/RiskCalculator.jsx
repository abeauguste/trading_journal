import React, { useState } from 'react'
import { calcRisk } from '../../utils/riskCalc'
import { N } from '../../utils/format'

export default function RiskCalculator({ stats }) {
  const [inputs, setInputs] = useState({
    account: 100000,
    pct: 1,
    maxContracts: 5,
    dailyLimit: 2000,
    stopDist: 20,
    rr: 2,
  })

  const update = (key, val) => setInputs(prev => ({ ...prev, [key]: parseFloat(val) || 0 }))
  const result = calcRisk(inputs)

  const outputs = [
    { label: 'Contracts',      value: result.contracts,                   color: 'var(--accent)' },
    { label: 'Actual Risk $',  value: '$' + N(result.actualRisk, 0),      color: 'var(--bear)' },
    { label: 'Target Points',  value: N(result.targetPts) + ' pts',        color: 'var(--bull)' },
    { label: 'Target $',       value: '$' + N(result.targetDol, 0),        color: 'var(--bull)' },
    { label: 'Trades/Day',     value: result.tradesPerDay,                 color: 'var(--neutral)' },
    { label: 'Stop Distance',  value: N(result.stopDist) + ' pts',         color: 'var(--bear)' },
  ]

  // ── Journal calibration derived values ──
  const showCalibration = stats != null && (stats.total_trades ?? 0) >= 5

  let actualRR = null, rrTone = '', impliedStopDol = 0, actualAvgLoss = 0
  let stopWarning = false, evPerTrade = 0, evAtSize = 0, evTone = ''

  if (showCalibration) {
    const avgWin  = stats.avg_win  ?? 0
    const avgLoss = Math.abs(stats.avg_loss ?? 0)
    impliedStopDol = inputs.stopDist * 50
    actualAvgLoss  = avgLoss
    stopWarning    = actualAvgLoss > impliedStopDol * 1.3

    if (avgLoss > 0) {
      actualRR = avgWin / avgLoss
      rrTone   = actualRR >= inputs.rr         ? 'bull'
               : actualRR >= inputs.rr * 0.8   ? 'gold'
               : 'bear'
    }

    const wr    = (stats.win_rate_pct ?? 0) / 100
    evPerTrade  = (wr * (stats.avg_win ?? 0)) + ((1 - wr) * (stats.avg_loss ?? 0))
    evAtSize    = evPerTrade * result.contracts
    evTone      = evPerTrade >= 0 ? 'bull' : 'bear'
  }

  return (
    <div>
      <div className="risk-form">
        <div className="ig">
          <label>Account Size ($)</label>
          <input className="rinput" type="number" value={inputs.account} onChange={e => update('account', e.target.value)} />
        </div>
        <div className="ig">
          <label>Risk Per Trade (%)</label>
          <input className="rinput" type="number" step="0.1" value={inputs.pct} onChange={e => update('pct', e.target.value)} />
        </div>
        <div className="ig">
          <label>Max Contracts</label>
          <input className="rinput" type="number" value={inputs.maxContracts} onChange={e => update('maxContracts', e.target.value)} />
        </div>
        <div className="ig">
          <label>Daily Loss Limit ($)</label>
          <input className="rinput" type="number" value={inputs.dailyLimit} onChange={e => update('dailyLimit', e.target.value)} />
        </div>
        <div className="ig">
          <label>Stop Distance (pts)</label>
          <input className="rinput" type="number" value={inputs.stopDist} onChange={e => update('stopDist', e.target.value)} />
        </div>
        <div className="ig">
          <label>Target R:R Ratio</label>
          <input className="rinput" type="number" step="0.5" value={inputs.rr} onChange={e => update('rr', e.target.value)} />
        </div>
      </div>

      <div className="risk-out">
        {outputs.map((o, i) => (
          <div className="rout-box" key={i}>
            <div className="rout-label">{o.label}</div>
            <div className="rout-val" style={{ color: o.color }}>{o.value}</div>
          </div>
        ))}
      </div>

      {/* ── Journal Calibration ── */}
      {showCalibration && (
        <div style={{
          background: 'var(--card2)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: '4px',
          padding: '16px',
          marginTop: '16px',
        }}>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.10em',
            color: 'var(--gold)', marginBottom: '14px',
          }}>
            Journal Calibration
          </div>

          {/* R:R comparison */}
          <div className="kv-row">
            <span className="kv-key">Actual R:R (journal)</span>
            <span className={`kv-val tone-${rrTone}`}>
              {actualRR != null ? N(actualRR, 2) : '—'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-key">Assumed R:R (input)</span>
            <span className="kv-val">{N(inputs.rr, 1)}</span>
          </div>

          <div style={{ height: '10px' }} />

          {/* Stop check */}
          <div className="kv-row">
            <span className="kv-key">Implied stop (input)</span>
            <span className="kv-val">${N(impliedStopDol, 0)}</span>
          </div>
          <div className="kv-row">
            <span className="kv-key">Avg loss (journal)</span>
            <span className={`kv-val${stopWarning ? ' tone-bear' : ''}`}>
              ${N(actualAvgLoss, 0)}
            </span>
          </div>
          {stopWarning && (
            <div style={{ fontSize: '11px', color: 'var(--bear)', marginTop: '6px', lineHeight: 1.45 }}>
              Journal avg loss ${N(actualAvgLoss, 0)} exceeds stop of ${N(impliedStopDol, 0)} — you may be overriding stops or getting slipped.
            </div>
          )}

          <div style={{ height: '10px' }} />

          {/* Expected value */}
          <div className="kv-row">
            <span className="kv-key">EV per trade</span>
            <span className={`kv-val tone-${evTone}`}>${N(evPerTrade, 2)}</span>
          </div>
          <div className="kv-row">
            <span className="kv-key">EV at {result.contracts} contract{result.contracts !== 1 ? 's' : ''}</span>
            <span className={`kv-val tone-${evTone}`}>${N(evAtSize, 2)}</span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>
            Based on {stats.total_trades} journal trades
          </div>
        </div>
      )}
    </div>
  )
}
