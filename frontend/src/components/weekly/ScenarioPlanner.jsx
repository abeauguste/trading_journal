import React, { useState, useEffect, useRef } from 'react'
import { N } from '../../utils/format'

const VWAPS = [
  ['vwap',           'Daily VWAP'],
  ['vwap_weekly',    'Weekly VWAP'],
  ['vwap_monthly',   'Monthly VWAP'],
  ['vwap_quarterly', 'Quarterly VWAP'],
  ['vwap_yearly',    'Yearly VWAP'],
]

function vwapProximity(price, liveData) {
  if (price == null || !liveData) return 'CLEAR'
  let closest = null, closestDist = Infinity
  for (const [key, label] of VWAPS) {
    const v = liveData[key]
    if (v == null) continue
    const d = Math.abs(price - v)
    if (d < closestDist) { closestDist = d; closest = label }
  }
  if (closest == null || closestDist > 8) return 'CLEAR'
  return closestDist <= 2 ? `AT ${closest}` : `Near ${closest}`
}

export default function ScenarioPlanner({ liveData, journalStats }) {
  const [direction, setDirection] = useState('LONG')
  const [entry, setEntry] = useState('')
  const [stopPts, setStopPts] = useState('')
  const [targetPts, setTargetPts] = useState('')
  const [contracts, setContracts] = useState(1)
  const [accountSize, setAccountSize] = useState(100000)
  const entryEdited = useRef(false)
  const stopEdited = useRef(false)
  const targetEdited = useRef(false)

  useEffect(() => {
    if (!entryEdited.current && liveData?.price != null) setEntry(liveData.price.toFixed(2))
  }, [liveData?.price])

  useEffect(() => {
    if (!stopEdited.current && liveData?.atr != null) setStopPts((liveData.atr * 0.5).toFixed(2))
    if (!targetEdited.current && liveData?.atr != null) setTargetPts((liveData.atr * 2.0).toFixed(2))
  }, [liveData?.atr])

  const E = parseFloat(entry) || 0
  const S = parseFloat(stopPts) || 0
  const T = parseFloat(targetPts) || 0
  const C = Math.max(1, parseInt(contracts) || 1)

  const stopPrice   = direction === 'LONG' ? E - S : E + S
  const targetPrice = direction === 'LONG' ? E + T : E - T
  const riskDol     = C * S * 50
  const rewardDol   = C * T * 50
  const rrRatio     = S > 0 ? T / S : 0

  // Kelly
  let kellyCts = null
  if (journalStats && journalStats.total_trades >= 10) {
    const p = (journalStats.win_rate_pct || 0) / 100
    const avgL = Math.abs(journalStats.avg_loss || 0)
    const avgW = Math.abs(journalStats.avg_win || 0)
    if (avgL > 0 && S > 0) {
      const b = avgW / avgL
      const fk = (p * b - (1-p)) / b
      if (fk > 0) kellyCts = Math.max(0, Math.floor((accountSize * fk / 4) / (S * 50)))
    }
  }

  // EV
  let ev = null
  if (journalStats && journalStats.total_trades >= 5) {
    const p = (journalStats.win_rate_pct || 0) / 100
    ev = (p * rewardDol) - ((1 - p) * riskDol)
  }

  const rrColor = rrRatio >= 2 ? 'var(--bull)' : rrRatio >= 1 ? 'var(--gold)' : 'var(--bear)'
  const evColor = ev != null ? (ev >= 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text-3)'

  const stopProx   = vwapProximity(stopPrice, liveData)
  const targetProx = vwapProximity(targetPrice, liveData)

  return (
    <div className="card" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Scenario Planner</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['LONG', 'SHORT'].map(d => (
            <button key={d} className={`sbtn${direction === d ? ' sbtn-primary' : ''}`}
              onClick={() => setDirection(d)} style={{ fontSize: '11px', padding: '4px 10px' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        {/* Inputs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { label: 'Entry', value: entry,       setter: v => { entryEdited.current = true;  setEntry(v) } },
            { label: 'Stop (pts)', value: stopPts,    setter: v => { stopEdited.current = true;   setStopPts(v) } },
            { label: 'Target (pts)', value: targetPts,  setter: v => { targetEdited.current = true; setTargetPts(v) } },
            { label: 'Contracts', value: contracts,   setter: setContracts },
            { label: 'Account ($)', value: accountSize, setter: setAccountSize },
          ].map(({ label, value, setter }) => (
            <div key={label} className="ig" style={{ flex: '1 1 80px' }}>
              <label>{label}</label>
              <input className="rinput" type="number" step="0.25" value={value}
                onChange={e => setter(e.target.value)} />
            </div>
          ))}
        </div>

        {/* Output tiles */}
        <div className="risk-out">
          <div className="rout-box">
            <div className="rout-label">Stop Price</div>
            <div className="rout-val" style={{ color: 'var(--bear)' }}>{E > 0 ? N(stopPrice, 2) : '—'}</div>
          </div>
          <div className="rout-box">
            <div className="rout-label">Target Price</div>
            <div className="rout-val" style={{ color: 'var(--bull)' }}>{E > 0 ? N(targetPrice, 2) : '—'}</div>
          </div>
          <div className="rout-box">
            <div className="rout-label">Risk $</div>
            <div className="rout-val" style={{ color: 'var(--bear)' }}>${N(riskDol, 0)}</div>
          </div>
          <div className="rout-box">
            <div className="rout-label">Reward $</div>
            <div className="rout-val" style={{ color: 'var(--bull)' }}>${N(rewardDol, 0)}</div>
          </div>
          <div className="rout-box">
            <div className="rout-label">R:R</div>
            <div className="rout-val" style={{ color: rrColor }}>{S > 0 ? N(rrRatio, 2) : '—'}</div>
          </div>
          <div className="rout-box">
            <div className="rout-label">EV / Trade</div>
            <div className="rout-val" style={{ color: evColor }}>{ev != null ? `$${N(ev, 0)}` : '—'}</div>
          </div>
        </div>

        {/* Context row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '12px' }}>
          <div style={{ background: 'var(--card2)', borderRadius: '4px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Stop Level</div>
            <div style={{ fontSize: '12px', color: stopProx === 'CLEAR' ? 'var(--bull)' : 'var(--gold)' }}>{stopProx}</div>
          </div>
          <div style={{ background: 'var(--card2)', borderRadius: '4px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Level</div>
            <div style={{ fontSize: '12px', color: targetProx === 'CLEAR' ? 'var(--bull)' : 'var(--gold)' }}>{targetProx}</div>
          </div>
          <div style={{ background: 'var(--card2)', borderRadius: '4px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Kelly (¼)</div>
            <div style={{ fontSize: '12px', color: 'var(--bull)' }}>{kellyCts != null ? `${kellyCts} contract${kellyCts !== 1 ? 's' : ''}` : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
