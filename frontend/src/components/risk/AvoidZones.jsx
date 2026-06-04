import React from 'react'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDol(v) {
  const abs = Math.abs(v)
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return (v >= 0 ? '+$' : '-$') + str
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function sumHours(byHourDay, hours) {
  let total = 0
  DAYS.forEach(day => {
    hours.forEach(h => {
      total += (byHourDay?.[day]?.[h] ?? 0)
    })
  })
  return total
}

function hasHourData(byHourDay, hours) {
  return hours.some(h => DAYS.some(d => byHourDay?.[d]?.[h] != null))
}

// ── verdict functions (return { state, evidence }) ────────────────────────────
// state: 'VALIDATED' | 'NOT_CONFIRMED' | 'OVERRIDE'

function verdictRule1(stats) {
  if (!hasHourData(stats.by_hour_day, ['09'])) {
    return { state: 'NOT_CONFIRMED', evidence: 'No 9 AM trades recorded in journal yet.' }
  }
  const total = sumHours(stats.by_hour_day, ['09'])
  if (total < -100)  return { state: 'VALIDATED',     evidence: `Your 9 AM hour: ${fmtDol(total)} net. Rule confirmed by your data.` }
  if (total >  100)  return { state: 'OVERRIDE',      evidence: `Your 9 AM hour: ${fmtDol(total)} net gain — this rule may not apply to you.` }
  return { state: 'NOT_CONFIRMED', evidence: `Your 9 AM hour: ${fmtDol(total)} net (insufficient signal yet).` }
}

function verdictRule2(stats) {
  const sessions = Object.entries(stats.by_session || {})
  const bad = sessions.find(([, d]) => (d.win_rate ?? 1) < 0.40 && (d.count ?? 0) >= 3)
  if (bad) {
    const [name, d] = bad
    return {
      state: 'NOT_CONFIRMED',
      evidence: `Low win rate in '${name}' session (${((d.win_rate ?? 0) * 100).toFixed(0)}%) may indicate event exposure. No event tagging available — check Calendar tab.`,
    }
  }
  return { state: 'NOT_CONFIRMED', evidence: 'No event tagging in trade data. Monitor via the Calendar tab for high-impact days.' }
}

function verdictRule3(stats) {
  if (!hasHourData(stats.by_hour_day, ['11', '12', '13'])) {
    return { state: 'NOT_CONFIRMED', evidence: 'No midday trades recorded in journal yet.' }
  }
  const total = sumHours(stats.by_hour_day, ['11', '12', '13'])
  if (total < -100) return { state: 'VALIDATED', evidence: `Your midday hours (11–13): ${fmtDol(total)} net. Rule confirmed.` }
  if (total >  100) return { state: 'OVERRIDE',  evidence: `Midday is actually profitable for you: ${fmtDol(total)} net — rule may not apply.` }
  return { state: 'NOT_CONFIRMED', evidence: `Your midday hours: ${fmtDol(total)} net (insufficient signal yet).` }
}

function verdictRule4() {
  return { state: 'NOT_CONFIRMED', evidence: 'Posture signals are not captured in trade data. Check the Intelligence tab for VWAP posture alignment.' }
}

function verdictRule5(stats) {
  const longWR  = stats.long_win_rate_pct
  const shortWR = stats.short_win_rate_pct
  if (longWR == null || shortWR == null) {
    return { state: 'NOT_CONFIRMED', evidence: 'Insufficient long/short directional data in journal.' }
  }
  const diff    = Math.abs(longWR - shortWR)
  const biasDir = longWR > shortWR ? 'long' : 'short'
  if (diff > 15) {
    return {
      state: 'VALIDATED',
      evidence: `Directional bias confirmed: ${biasDir} side wins ${Math.max(longWR, shortWR).toFixed(1)}% vs ${Math.min(longWR, shortWR).toFixed(1)}% opposite.`,
    }
  }
  return {
    state: 'NOT_CONFIRMED',
    evidence: `Long WR ${longWR.toFixed(1)}% vs Short WR ${shortWR.toFixed(1)}% — no strong directional bias detected yet.`,
  }
}

function verdictRule6() {
  return { state: 'NOT_CONFIRMED', evidence: 'Trap zones require manual setup tagging. Tag entries with context to track this pattern over time.' }
}

function verdictRule7(stats) {
  const n       = stats.revenge_trades ?? 0
  const avgLoss = Math.abs(stats.avg_loss ?? 0)
  const cost    = n * avgLoss
  if (n === 0) return { state: 'VALIDATED', evidence: 'No revenge trades detected. Emotional discipline confirmed.' }
  if (n >= 3)  return { state: 'VALIDATED', evidence: `${n} revenge trades detected. Estimated cost: ${fmtDol(-cost)} (${n} × avg loss of ${fmtDol(-avgLoss)}).` }
  return { state: 'NOT_CONFIRMED', evidence: `${n} potential revenge trade${n > 1 ? 's' : ''} detected. Watch for entry patterns after losses.` }
}

// ── rule definitions ──────────────────────────────────────────────────────────

const RULE_DEFS = [
  {
    title: 'First 15 minutes of session',
    desc: 'Avoid trading in the first 15 minutes after the regular session open. Price discovery is erratic and spreads are wide. Let the market find its direction first.',
    getVerdict: verdictRule1,
  },
  {
    title: 'During major economic events',
    desc: 'Avoid open positions 5 minutes before and after CPI, FOMC, NFP, GDP releases. Slippage and spikes can blow stops instantly regardless of technical setup.',
    getVerdict: verdictRule2,
  },
  {
    title: 'Choppy low-volume midday',
    desc: 'Midday sessions (11:00 AM – 2:00 PM ET) often have low volume and choppy action. ES grinds sideways with false breakouts in both directions.',
    getVerdict: verdictRule3,
  },
  {
    title: 'When all postures are neutral',
    desc: 'If Monthly, Weekly, and Daily postures are all Neutral there is no edge. Do not force trades. Cash is a position — wait for posture clarity.',
    getVerdict: verdictRule4,
  },
  {
    title: 'Against the monthly trend',
    desc: 'Never fight the monthly posture. If ES Monthly is Strong Sell, avoid aggressive longs regardless of intraday signals. Mean reversion is more powerful.',
    getVerdict: verdictRule5,
  },
  {
    title: 'Inside identified trap zones',
    desc: 'Bull and Bear trap zones are areas where retail traders get caught. Price briefly breaks through key levels only to reverse. Wait for confirmation before entry.',
    getVerdict: verdictRule6,
  },
  {
    title: 'Revenge trading after a loss',
    desc: 'Entering a new trade within 10 minutes of a losing trade is a behavioral red flag. Emotional entries ignore setup quality and compound losses.',
    getVerdict: verdictRule7,
  },
]

// ── verdict badge ─────────────────────────────────────────────────────────────

const VERDICT_META = {
  VALIDATED:     { pillClass: 'pill pill-bull', symbol: '●', text: 'VALIDATED' },
  NOT_CONFIRMED: { pillClass: 'pill pill-gold', symbol: '○', text: 'NOT CONFIRMED' },
  OVERRIDE:      { pillClass: 'pill pill-bear', symbol: '◆', text: 'OVERRIDE' },
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AvoidZones({ journalStats }) {
  const hasData = journalStats != null && (journalStats.total_trades ?? 0) >= 5

  return (
    <div className="rules">
      {RULE_DEFS.map((rule, i) => {
        const verdict = hasData ? rule.getVerdict(journalStats) : null
        const meta    = verdict ? VERDICT_META[verdict.state] : null

        return (
          <div key={i} className="rule">
            <span className="rule-n">{String(i + 1).padStart(2, '0')}</span>
            <div>
              {/* Title row + optional verdict badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                {meta && (
                  <span className={meta.pillClass} style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
                    {meta.symbol} {meta.text}
                  </span>
                )}
                <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>
                  {rule.title}
                </span>
              </div>

              {/* Evidence line — data mode only */}
              {verdict && (
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px', lineHeight: 1.5 }}>
                  {verdict.evidence}
                </div>
              )}

              {/* Static description */}
              <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {rule.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
