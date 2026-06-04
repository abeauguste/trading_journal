import React, { useState, useEffect } from 'react'
import { N } from '../../utils/format'

function getEtTime() {
  const now = new Date()
  const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false })
  const et = new Date(etStr)
  return { h: et.getHours(), m: et.getMinutes(), tMin: et.getHours() * 60 + et.getMinutes() }
}

function parseEventTime(event) {
  // Returns a proper UTC Date for the event, accounting for ET timezone offset
  if (!event.event_time || !event.event_date) return null
  try {
    const timeStr = event.event_time.replace(' ET', '').trim()
    const [h, min] = timeStr.split(':').map(Number)
    if (isNaN(h) || isNaN(min)) return null
    // Compute ET UTC offset by sampling a reference moment on that date
    const refDate = new Date(`${event.event_date}T12:00:00Z`)
    const etHour = parseInt(
      refDate.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false })
    )
    const etOffsetHours = etHour - 12  // e.g. -4 for EDT, -5 for EST
    const [y, mo, d] = event.event_date.split('-').map(Number)
    return new Date(Date.UTC(y, mo - 1, d, h - etOffsetHours, min, 0))
  } catch { return null }
}

function checkVwap(vwapSummary, direction) {
  if (!vwapSummary) return { state: 'CAUTION', note: 'No VWAP data' }
  const fullBull = vwapSummary.includes('FULL BULL')
  const fullBear = vwapSummary.includes('FULL BEAR')
  const mixedBull = vwapSummary.includes('MIXED BULL')
  const mixedBear = vwapSummary.includes('MIXED BEAR')
  if (direction === 'LONG') {
    if (fullBull || mixedBull) return { state: 'PASS', note: 'VWAP posture supports long' }
    if (mixedBear) return { state: 'CAUTION', note: 'Mixed VWAP — partial alignment' }
    return { state: 'FAIL', note: 'FULL BEAR posture opposes long' }
  } else {
    if (fullBear || mixedBear) return { state: 'PASS', note: 'VWAP posture supports short' }
    if (mixedBull) return { state: 'CAUTION', note: 'Mixed VWAP — partial alignment' }
    return { state: 'FAIL', note: 'FULL BULL posture opposes short' }
  }
}

function checkAtrRoom(atr, high, low, stopPts) {
  if (!atr) return { state: 'CAUTION', note: 'ATR not available' }
  if (!high || !low) return { state: 'CAUTION', note: 'Awaiting bar data' }
  if (!stopPts || stopPts <= 0) return { state: 'CAUTION', note: 'Enter stop distance' }
  const todayRange = high - low
  const remaining = Math.max(0, atr - todayRange)
  const required = stopPts * 1.5
  if (remaining >= required) return { state: 'PASS', note: `${N(remaining, 1)} pts remaining vs ${N(required, 1)} needed` }
  if (remaining >= required * 0.5) return { state: 'CAUTION', note: `Only ${N(remaining, 1)} pts ATR remaining` }
  return { state: 'FAIL', note: `ATR nearly exhausted — ${N(remaining, 1)} pts left` }
}

function checkTimeWindow(economicEvents) {
  const { tMin } = getEtTime()
  if (tMin >= 9*60+30 && tMin < 9*60+45) return { state: 'FAIL', note: 'First 15 min — avoid trading' }
  if (tMin >= 11*60 && tMin < 14*60) return { state: 'FAIL', note: 'Midday window (11am–2pm)' }
  const now = Date.now()
  for (const e of (economicEvents || [])) {
    if (e.impact !== 'HIGH') continue
    const et = parseEventTime(e)
    if (!et) continue
    const diffMin = (et.getTime() - now) / 60000
    if (diffMin >= 0 && diffMin <= 10) return { state: 'CAUTION', note: `${e.event_name} in ${Math.ceil(diffMin)} min` }
  }
  return { state: 'PASS', note: 'Outside avoidance windows' }
}

function checkEventRisk(economicEvents) {
  const now = Date.now()
  for (const e of (economicEvents || [])) {
    if (e.impact !== 'HIGH') continue
    const et = parseEventTime(e)
    if (!et) continue
    const diffMin = (et.getTime() - now) / 60000
    if (diffMin >= 0 && diffMin <= 30) return { state: 'FAIL', note: `${e.event_name} in ${Math.ceil(diffMin)} min` }
    if (diffMin > 30 && diffMin <= 120) return { state: 'CAUTION', note: `${e.event_name} in ${Math.ceil(diffMin/60*10)/10}h` }
  }
  return { state: 'PASS', note: 'No events in next 2 hours' }
}

function checkPositionSize(journalStats, accountSize, dailyLimit) {
  if (!journalStats || journalStats.total_trades < 10) return { state: 'CAUTION', note: 'Need 10+ trades for Kelly' }
  const avgLossAbs = Math.abs(journalStats.avg_loss || 0)
  const avgWinAbs = Math.abs(journalStats.avg_win || 0)
  if (avgLossAbs === 0) return { state: 'CAUTION', note: 'No loss data' }
  const p = (journalStats.win_rate_pct || 0) / 100
  const b = avgWinAbs / avgLossAbs
  const fullK = (p * b - (1-p)) / b
  if (fullK <= 0) return { state: 'FAIL', note: 'Negative edge detected' }
  const qK = fullK / 4
  const contracts = Math.max(0, Math.floor((accountSize * qK) / avgLossAbs))
  const risk = contracts * avgLossAbs
  if (risk <= dailyLimit) return { state: 'PASS', note: `${contracts} contracts (¼ Kelly) = $${N(risk,0)} risk` }
  if (risk <= dailyLimit * 1.5) return { state: 'CAUTION', note: `$${N(risk,0)} risk exceeds limit` }
  return { state: 'FAIL', note: `$${N(risk,0)} risk far exceeds $${N(dailyLimit,0)} limit` }
}

function checkMomentum(squeeze, waveA, direction) {
  if (squeeze == null && waveA == null) return { state: 'CAUTION', note: 'No momentum data' }
  const bull = squeeze === 'long' || (waveA != null && waveA > 0)
  const bear = squeeze === 'short' || (waveA != null && waveA < 0)
  if (direction === 'LONG') {
    if (bull) return { state: 'PASS', note: 'Momentum confirms long' }
    if (bear) return { state: 'FAIL', note: 'Momentum opposes long' }
    return { state: 'CAUTION', note: 'Neutral momentum' }
  } else {
    if (bear) return { state: 'PASS', note: 'Momentum confirms short' }
    if (bull) return { state: 'FAIL', note: 'Momentum opposes short' }
    return { state: 'CAUTION', note: 'Neutral momentum' }
  }
}

const CHECK_ICON = { PASS: '●', CAUTION: '○', FAIL: '✗' }
const CHECK_CLASS = { PASS: 's-on', CAUTION: 's-warn', FAIL: 's-off' }

function CheckRow({ label, result }) {
  return (
    <div className="ind-row">
      <span className="ind-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{result.note}</span>
        <span className={`ind-status ${CHECK_CLASS[result.state]}`}>{CHECK_ICON[result.state]}</span>
      </div>
    </div>
  )
}

export default function PreTradeChecklist({ liveData, economicEvents, journalStats }) {
  const [direction, setDirection] = useState('LONG')
  const [stopPts, setStopPts] = useState('')
  const [accountSize, setAccountSize] = useState(100000)
  const [dailyLimit, setDailyLimit] = useState(500)
  const [, setTick] = useState(0)

  // Refresh time-based checks every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // Default stop to 0.5 ATR
  useEffect(() => {
    if (liveData?.atr && !stopPts) setStopPts((liveData.atr * 0.5).toFixed(1))
  }, [liveData?.atr])

  const stopNum = parseFloat(stopPts) || 0
  const vwapSummary = liveData?.vwapAnalysis?.summary || ''

  const checks = [
    { label: 'VWAP Direction',    result: checkVwap(vwapSummary, direction) },
    { label: 'ATR Room',          result: checkAtrRoom(liveData?.atr, liveData?.high, liveData?.low, stopNum) },
    { label: 'Time Window',       result: checkTimeWindow(economicEvents) },
    { label: 'Event Risk',        result: checkEventRisk(economicEvents) },
    { label: 'Position Size',     result: checkPositionSize(journalStats, accountSize, dailyLimit) },
    { label: 'Momentum',          result: checkMomentum(liveData?.squeeze, liveData?.wave_a, direction) },
  ]

  const passes = checks.filter(c => c.result.state === 'PASS').length
  const fails  = checks.filter(c => c.result.state === 'FAIL').length
  const verdict = fails === 0 && passes >= 5 ? 'GO'
                : fails <= 1 && passes >= 4  ? 'REDUCE SIZE'
                : 'STAND ASIDE'
  const verdictClass = verdict === 'GO' ? 's-on' : verdict === 'REDUCE SIZE' ? 's-warn' : 's-off'

  return (
    <div className="card" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Pre-Trade Checklist</span>
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
        {/* Config inputs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div className="ig" style={{ flex: '1 1 100px' }}>
            <label>Stop (pts)</label>
            <input className="rinput" type="number" step="0.5" value={stopPts}
              onChange={e => setStopPts(e.target.value)} />
          </div>
          <div className="ig" style={{ flex: '1 1 100px' }}>
            <label>Account ($)</label>
            <input className="rinput" type="number" value={accountSize}
              onChange={e => setAccountSize(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="ig" style={{ flex: '1 1 100px' }}>
            <label>Daily Limit ($)</label>
            <input className="rinput" type="number" value={dailyLimit}
              onChange={e => setDailyLimit(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Check rows */}
        {checks.map((c, i) => <CheckRow key={i} label={c.label} result={c.result} />)}

        {/* Verdict */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div className={`ind-status ${verdictClass}`} style={{ width: '100%', textAlign: 'center', fontSize: '13px', padding: '8px' }}>
            {passes}/6 — {verdict}
          </div>
        </div>
      </div>
    </div>
  )
}
