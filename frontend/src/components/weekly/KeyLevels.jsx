import React from 'react'
import { N } from '../../utils/format'

export default function KeyLevels({ week }) {
  if (!week) return null
  const w = week.weekly

  const levels = [
    { label: 'H2', value: w.es_weekly_h2?.value, note: w.es_weekly_h2?.note, color: 'var(--bear)', cls: 'n-bear' },
    { label: 'H1', value: w.es_weekly_h1?.value, note: w.es_weekly_h1?.note, color: 'var(--bear)', cls: 'n-bear' },
    { label: 'VWAP-W', value: w.vwap_weekly?.value, note: 'Weekly VWAP', color: 'var(--accent)', cls: 'n-accent' },
    { label: 'OPEN', value: w.es_open_price?.value, note: w.es_open_price?.note, color: 'var(--text)', cls: '' },
    { label: 'VWAP-D', value: w.vwap_daily?.value, note: 'Daily VWAP', color: 'var(--accent)', cls: 'n-accent' },
    { label: 'L1', value: w.es_weekly_l1?.value, note: w.es_weekly_l1?.note, color: 'var(--bull)', cls: 'n-bull' },
    { label: 'L2', value: w.es_weekly_l2?.value, note: w.es_weekly_l2?.note, color: 'var(--bull)', cls: 'n-bull' },
  ]

  return (
    <div>
      {levels.map((l, i) => (
        <div className="ind-row" key={i}>
          <div>
            <div className="ind-label">{l.label}</div>
            {l.note && <div className="ind-sub">{l.note}</div>}
          </div>
          <span className={`num ${l.cls}`} style={l.cls ? {} : { color: l.color }}>
            {N(l.value)}
          </span>
        </div>
      ))}
      {w.buy_level?.value != null && (
        <div className="ind-row">
          <div>
            <div className="ind-label">Buy Zone</div>
            {w.buy_level.note && <div className="ind-sub">{w.buy_level.note}</div>}
          </div>
          <span className="num n-bull">{N(w.buy_level.value)}</span>
        </div>
      )}
      {w.sell_level?.value != null && (
        <div className="ind-row">
          <div>
            <div className="ind-label">Sell Zone</div>
            {w.sell_level.note && <div className="ind-sub">{w.sell_level.note}</div>}
          </div>
          <span className="num n-bear">{N(w.sell_level.value)}</span>
        </div>
      )}
    </div>
  )
}
