import React from 'react'

const EVENT_DATA = [
  {
    event: 'Normal Week', key: 'normal',
    rangeVsNormal: '1.0×',
    bias: 'NEUTRAL',
    volProfile: 'Baseline ATR, steady RTH volume',
    note: 'Default regime — ~32 of 52 weeks/year. Trade VWAP posture and ATR bands as usual.',
  },
  {
    event: 'FOMC Week', key: 'fomc',
    rangeVsNormal: '1.3×',
    bias: 'NEUTRAL',
    volProfile: 'Compressed Mon–Wed AM, expands at 2pm ET Wed',
    note: '8×/year. Drift up into the 2pm statement then violent reaction. Avoid new positions 11am–2pm Wed.',
  },
  {
    event: 'NFP Week', key: 'nfp',
    rangeVsNormal: '1.2×',
    bias: 'NEUTRAL',
    volProfile: 'Quiet Mon–Thu, huge 8:30 ET Friday move',
    note: 'First Friday of month. Average 0.7% RTH range on NFP Friday vs 0.4% normal Friday.',
  },
  {
    event: 'Monthly OPEX', key: 'opex',
    rangeVsNormal: '1.15×',
    bias: 'NEUTRAL',
    volProfile: 'Pinned to large strikes Mon–Wed, gamma unwind Fri PM',
    note: '3rd Friday. Price gravitates to max-pain strike mid-week. Monday after OPEX historically weak.',
  },
  {
    event: 'Quad Witching', key: 'quad',
    rangeVsNormal: '1.5×',
    bias: 'NEUTRAL',
    volProfile: 'Record volume, wide intraday ranges all week',
    note: '4×/year (Mar/Jun/Sep/Dec 3rd Fri). All four expiration classes expire simultaneously. Biggest volume days of the year.',
  },
]

function biasCls(bias) {
  if (bias === 'BULL') return 'pill pill-bull'
  if (bias === 'BEAR') return 'pill pill-bear'
  return 'pill pill-gold'
}

// Returns day-of-month for the Nth occurrence of a weekday in a given month
// weekday: 0=Sun..6=Sat, n: 1-based
function nthWeekday(year, month, weekday, n) {
  const firstDow = new Date(year, month, 1).getDay()
  const offset = (weekday - firstDow + 7) % 7
  return 1 + offset + (n - 1) * 7
}

// FOMC meeting Wednesdays 2025–2026 (Fed publishes these in advance)
const FOMC_WEDNESDAYS = [
  '2025-01-29','2025-03-19','2025-05-07','2025-06-18',
  '2025-07-30','2025-09-17','2025-10-29','2025-12-10',
  '2026-01-28','2026-03-18','2026-04-29','2026-06-17',
  '2026-07-29','2026-09-16','2026-10-28','2026-12-09',
]

function getEffectiveTradingDate() {
  // Sunday 6pm ET → ES futures week is open, treat as next Monday
  const etStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const et = new Date(etStr)
  if (et.getDay() === 0 && et.getHours() >= 18) {
    return new Date(et.getFullYear(), et.getMonth(), et.getDate() + 1)
  }
  return et
}

function currentEventKey() {
  const eff = getEffectiveTradingDate()
  const y   = eff.getFullYear()
  const m   = eff.getMonth()
  const d   = eff.getDate()
  const dow = eff.getDay()

  const thirdFri = nthWeekday(y, m, 5, 3)
  const weekMon  = thirdFri - 4
  const isQuadMonth = [2, 5, 8, 11].includes(m)

  // Precedence: quad > opex > nfp > fomc > normal
  if (dow >= 1 && dow <= 5) {
    // Quad Witching: 3rd Friday of Mar/Jun/Sep/Dec — full week
    if (isQuadMonth && d >= weekMon && d <= thirdFri) return 'quad'

    // Monthly OPEX: 3rd Friday of every other month — full week
    if (!isQuadMonth && d >= weekMon && d <= thirdFri) return 'opex'

    // NFP: week containing first Friday of the month
    const firstFri = nthWeekday(y, m, 5, 1)
    if (d >= firstFri - 4 && d <= firstFri) return 'nfp'
    // Mon–Thu of next month's NFP week (first Fri is 1–4 days into next month)
    const nextM = (m + 1) % 12
    const nextY = m === 11 ? y + 1 : y
    const nextFirstFri = nthWeekday(nextY, nextM, 5, 1)
    const lastDayThisMonth = new Date(y, m + 1, 0).getDate()
    const daysUntilNextFirstFri = (lastDayThisMonth - d) + nextFirstFri
    if (daysUntilNextFirstFri >= 1 && daysUntilNextFirstFri <= 4) return 'nfp'

    // FOMC: week containing the Fed meeting Wednesday
    const inFomc = FOMC_WEDNESDAYS.some(iso => {
      const wed = new Date(iso + 'T12:00:00')
      const mon = new Date(wed); mon.setDate(wed.getDate() - 2)
      const fri = new Date(wed); fri.setDate(wed.getDate() + 2)
      return eff >= mon && eff <= fri
    })
    if (inFomc) return 'fomc'
  }

  return 'normal'
}

export default function EventWeekCard() {
  const currentKey = currentEventKey()
  const currentIdx = EVENT_DATA.findIndex(r => r.key === currentKey)

  return (
    <div className="card reveal r-6" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Event Weeks · Range &amp; Vol Effects</span>
        <span className="eyebrow muted">Relative to Normal Week Baseline</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Bias</th>
              <th>Range vs Normal</th>
              <th>Vol Profile</th>
              <th>Key Note</th>
            </tr>
          </thead>
          <tbody>
            {EVENT_DATA.map((row, i) => {
              const isCurrent = i === currentIdx
              return (
                <tr
                  key={row.key}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="mono" style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}>
                        {row.event}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>NOW</span>
                      )}
                    </div>
                  </td>
                  <td><span className={biasCls(row.bias)}>{row.bias}</span></td>
                  <td><span className="mono tone-gold">{row.rangeVsNormal}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{row.volProfile}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
