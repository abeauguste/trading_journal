import React from 'react'

const DOW_DATA = [
  {
    day: 'Monday',    dow: 1, bias: 'NEUTRAL',
    pct: +0.02, rangePts: 55,
    gap: 'Largest gaps — Fri close to Mon RTH open',
    note: 'Reversal day. Fade the open if gap > 0.5%. Trend day rare. "Turnaround Tuesday" setup often forms.',
  },
  {
    day: 'Tuesday',   dow: 2, bias: 'BULL',
    pct: +0.09, rangePts: 50,
    gap: 'Small gaps, often continues Mon close direction',
    note: 'Statistically strongest day. "Turnaround Tuesday" — reverse Mon weakness or extend Mon strength.',
  },
  {
    day: 'Wednesday', dow: 3, bias: 'NEUTRAL',
    pct: +0.03, rangePts: 48,
    gap: 'Tightest overnight range on non-FOMC weeks',
    note: 'FOMC weeks (8×/yr) spike range to 90+ pts at 2pm ET. Otherwise quietest drift day.',
  },
  {
    day: 'Thursday',  dow: 4, bias: 'NEUTRAL',
    pct: +0.01, rangePts: 52,
    gap: 'Normal gaps; jobless claims at 8:30 ET',
    note: 'Setup day for Friday. Watch weekly OPEX positioning. Trend exhaustion into the close common.',
  },
  {
    day: 'Friday',    dow: 5, bias: 'BULL',
    pct: +0.05, rangePts: 58,
    gap: 'Profit-taking gaps common into weekly close',
    note: 'NFP weeks (1st Fri) → ~85 pt range. Quad witching Fridays → 100+ pts. Afternoons fade in range-bound weeks.',
  },
]

function biasCls(bias) {
  if (bias === 'BULL') return 'pill pill-bull'
  if (bias === 'BEAR') return 'pill pill-bear'
  return 'pill pill-gold'
}

function pctCls(pct) {
  if (pct > 0) return 'mono tone-bull'
  if (pct < 0) return 'mono tone-bear'
  return 'mono tone-gold'
}

export default function DayOfWeekCard() {
  const today = new Date().getDay()
  const currentIdx = DOW_DATA.findIndex(r => r.dow === today)

  return (
    <div className="card reveal r-5">
      <div className="card-hdr">
        <span className="card-title">ES RTH · Day of Week</span>
        <span className="eyebrow muted">9:30 AM – 4:00 PM ET</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Bias</th>
              <th>Avg Daily</th>
              <th>Gap / Open</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {DOW_DATA.map((row, i) => {
              const isCurrent = i === currentIdx
              return (
                <tr
                  key={row.day}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="mono" style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}>
                        {row.day}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>NOW</span>
                      )}
                    </div>
                  </td>
                  <td><span className={biasCls(row.bias)}>{row.bias}</span></td>
                  <td>
                    <span className={pctCls(row.pct)}>
                      {row.pct >= 0 ? '+' : ''}{row.pct.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{row.gap}</td>
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
