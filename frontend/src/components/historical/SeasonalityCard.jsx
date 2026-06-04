import React from 'react'

const SEASONAL_DATA = [
  { month: 'January',   bias: 'BULL',    pct: +1.2, desc: 'New year flows, seasonal optimism' },
  { month: 'February',  bias: 'NEUTRAL', pct: -0.1, desc: 'Historically weak, Q1 positioning' },
  { month: 'March',     bias: 'NEUTRAL', pct: +0.8, desc: 'Quarter-end rebalancing' },
  { month: 'April',     bias: 'BULL',    pct: +1.5, desc: 'Strongest month, tax season inflows' },
  { month: 'May',       bias: 'NEUTRAL', pct: +0.2, desc: '"Sell in May" uncertainty begins' },
  { month: 'June',      bias: 'NEUTRAL', pct: -0.1, desc: 'Low volume, pre-summer drift' },
  { month: 'July',      bias: 'BULL',    pct: +1.4, desc: 'Summer rally, mid-year repositioning' },
  { month: 'August',    bias: 'BEAR',    pct: -0.5, desc: 'Low volume, institutional absence' },
  { month: 'September', bias: 'BEAR',    pct: -1.1, desc: 'Historically worst month' },
  { month: 'October',   bias: 'NEUTRAL', pct: +0.4, desc: 'Volatile but often recovery' },
  { month: 'November',  bias: 'BULL',    pct: +1.8, desc: 'Best month, year-end rally begins' },
  { month: 'December',  bias: 'BULL',    pct: +1.3, desc: 'Santa rally, window dressing' },
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

export default function SeasonalityCard() {
  const currentMonth = new Date().getMonth() // 0 = January

  return (
    <div className="card reveal r-3" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">ES Futures · Monthly Seasonality</span>
        <span className="eyebrow muted">S&amp;P 500 / ES Long-Run Averages</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Bias</th>
              <th>Avg Return</th>
              <th>Tendency</th>
            </tr>
          </thead>
          <tbody>
            {SEASONAL_DATA.map((row, i) => {
              const isCurrent = i === currentMonth
              return (
                <tr
                  key={row.month}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <span
                      className="mono"
                      style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}
                    >
                      {row.month}
                    </span>
                    {isCurrent && (
                      <span className="pill pill-gold" style={{ marginLeft: '8px', fontSize: '9px' }}>
                        NOW
                      </span>
                    )}
                  </td>
                  <td><span className={biasCls(row.bias)}>{row.bias}</span></td>
                  <td>
                    <span className={pctCls(row.pct)}>
                      {row.pct >= 0 ? '+' : ''}{row.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text3)' }}>{row.desc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
