import React from 'react'

const VIX_DATA = [
  {
    regime: 'COMPLACENT',
    band: '< 15',
    minVix: 0, maxVix: 15,
    bias: 'BULL',
    avgWeekly: +0.35,
    rangePts: '25 – 55',
    note: 'Low-vol drift higher. Trend-follow longs, fade overnight gaps down. Squeeze setups dominate; breadth narrow but persistent.',
  },
  {
    regime: 'ELEVATED',
    band: '15 – 25',
    minVix: 15, maxVix: 25,
    bias: 'NEUTRAL',
    avgWeekly: +0.10,
    rangePts: '55 – 110',
    note: 'Normal regime — most trading weeks live here. Two-way action, VWAP mean-reversion works, respect ATR bands.',
  },
  {
    regime: 'FEAR',
    band: '25 – 35',
    minVix: 25, maxVix: 35,
    bias: 'BEAR',
    avgWeekly: -0.45,
    rangePts: '110 – 200',
    note: 'Trending down with violent rips. Sell rallies into VWAP-D, size down, expect 2× ATR weeks. News-driven.',
  },
  {
    regime: 'PANIC',
    band: '> 35',
    minVix: 35, maxVix: Infinity,
    bias: 'BEAR',
    avgWeekly: -0.90,
    rangePts: '200 – 400+',
    note: 'Crash conditions but +3–5% snapback rallies are common. Reduce size dramatically. Mean-reversion on extreme RSI only.',
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

export default function VixHistoricalCard({ vixLevel }) {
  const currentIdx = vixLevel == null || !isFinite(vixLevel)
    ? -1
    : VIX_DATA.findIndex(r => vixLevel >= r.minVix && vixLevel < r.maxVix)

  return (
    <div className="card reveal r-5">
      <div className="card-hdr">
        <span className="card-title">VIX · Regime Performance</span>
        <span className="eyebrow muted">S&amp;P 500 Conditional Returns</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Regime</th>
              <th>Bias</th>
              <th>Avg Weekly</th>
              <th>Typical Range</th>
              <th>Strategy Note</th>
            </tr>
          </thead>
          <tbody>
            {VIX_DATA.map((row, i) => {
              const isCurrent = i === currentIdx
              return (
                <tr
                  key={row.regime}
                  style={isCurrent ? {
                    background: 'var(--gold-soft)',
                    outline: '1px solid var(--gold-line)',
                    outlineOffset: '-1px',
                  } : undefined}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="mono" style={isCurrent ? { color: 'var(--gold)', fontWeight: 600 } : {}}>
                        {row.regime}
                      </span>
                      {isCurrent && (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>NOW</span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{row.band}</div>
                  </td>
                  <td><span className={biasCls(row.bias)}>{row.bias}</span></td>
                  <td>
                    <span className={pctCls(row.avgWeekly)}>
                      {row.avgWeekly >= 0 ? '+' : ''}{row.avgWeekly.toFixed(2)}%
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: '12px' }}>{row.rangePts} pts</td>
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
