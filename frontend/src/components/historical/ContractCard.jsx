import React from 'react'

const CONTRACT_DATA = [
  {
    code: 'ESH',
    name: 'March',
    months: [0, 1, 2],
    bias: 'BULL',
    pct: +1.9,
    vol: 'Normal',
    notes: 'Benefits from year-start positioning and Q4 earnings. FOMC meetings in Jan and Mar are key catalysts. Rollover second week of March.',
  },
  {
    code: 'ESM',
    name: 'June',
    months: [3, 4, 5],
    bias: 'BULL',
    pct: +1.6,
    vol: 'Normal',
    notes: 'April strength fades into May/June weakness. FOMC in May and June. Quad witching in June creates volatility. Rollover second week of June.',
  },
  {
    code: 'ESU',
    name: 'September',
    months: [6, 7, 8],
    bias: 'BEAR',
    pct: -0.2,
    vol: 'High',
    notes: 'July summer rally followed by August/September weakness. September historically worst month. High volatility, wide ranges. Rollover second week of September.',
  },
  {
    code: 'ESZ',
    name: 'December',
    months: [9, 10, 11],
    bias: 'BULL',
    pct: +3.5,
    vol: 'Normal',
    notes: 'October volatility risk followed by November/December rally. Year-end window dressing and Santa rally. Strongest contract on average. Rollover second week of December.',
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

export default function ContractCard() {
  const currentMonth = new Date().getMonth()
  const currentIdx = CONTRACT_DATA.findIndex(c => c.months.includes(currentMonth))

  return (
    <div className="card reveal r-4">
      <div className="card-hdr">
        <span className="card-title">ES Futures · Contract Guide</span>
        <span className="eyebrow muted">Quarterly Contract Tendencies</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Bias</th>
              <th>Avg Return</th>
              <th>Volatility</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACT_DATA.map((row, i) => {
              const isCurrent = i === currentIdx
              return (
                <tr
                  key={row.code}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="mono" style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}>
                        {row.code}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>NOW</span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{row.name}</div>
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
