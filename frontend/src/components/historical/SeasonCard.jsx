import React from 'react'

const SEASON_DATA = [
  {
    season: 'Spring',
    range: 'Mar – May',
    months: [2, 3, 4],
    bias: 'BULL',
    pct: +2.8,
    vol: 'Normal',
    notes: 'April is the strongest month. Q1 earnings and tax-season inflows drive gains. May weakens as "Sell in May" narratives emerge but net spring return stays positive.',
  },
  {
    season: 'Summer',
    range: 'Jun – Aug',
    months: [5, 6, 7],
    bias: 'NEUTRAL',
    pct: +0.8,
    vol: 'Low',
    notes: 'Institutional desks thin out and volume drops. June and August drag while July provides a brief summer rally. Choppy, low-conviction price action dominates.',
  },
  {
    season: 'Fall',
    range: 'Sep – Nov',
    months: [8, 9, 10],
    bias: 'NEUTRAL',
    pct: +1.1,
    vol: 'High',
    notes: 'September is historically the worst single month. October volatility spikes are common. November is one of the strongest months — fall is a tale of two halves.',
  },
  {
    season: 'Winter',
    range: 'Dec – Feb',
    months: [11, 0, 1],
    bias: 'BULL',
    pct: +2.5,
    vol: 'Normal',
    notes: 'December Santa rally and year-end window dressing. January sees fresh institutional positioning. February is historically weak but the season nets positive overall.',
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

export default function SeasonCard() {
  const currentMonth = new Date().getMonth()
  const currentIdx = SEASON_DATA.findIndex(s => s.months.includes(currentMonth))

  return (
    <div className="card reveal r-4">
      <div className="card-hdr">
        <span className="card-title">ES Futures · Seasonal Posture</span>
        <span className="eyebrow muted">Quarterly Tendencies</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Season</th>
              <th>Bias</th>
              <th>Avg Return</th>
              <th>Volatility</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {SEASON_DATA.map((row, i) => {
              const isCurrent = i === currentIdx
              return (
                <tr
                  key={row.season}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="mono" style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}>
                        {row.season}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>NOW</span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{row.range}</div>
                  </td>
                  <td><span className={biasCls(row.bias)}>{row.bias}</span></td>
                  <td>
                    <span className={pctCls(row.pct)}>
                      {row.pct >= 0 ? '+' : ''}{row.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{row.vol}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{row.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
