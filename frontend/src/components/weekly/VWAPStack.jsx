import React from 'react'
import { N } from '../../utils/format'

export default function VWAPStack({ week }) {
  if (!week) return null
  const w = week.weekly

  const vwaps = [
    { label: 'Daily', field: w.vwap_daily, color: 'var(--accent)' },
    { label: 'Weekly', field: w.vwap_weekly, color: 'var(--accent)' },
    { label: 'Monthly', field: w.vwap_monthly, color: 'var(--gold)' },
    { label: 'Quarterly', field: w.vwap_quarterly, color: 'var(--purple)' },
    { label: 'Yearly', field: w.vwap_yearly, color: 'var(--orange)' },
  ]

  return (
    <div>
      {vwaps.map((v, i) => (
        <div className="atr-row" key={i}>
          <div>
            <div className="atr-lbl">VWAP {v.label}</div>
            {v.field?.note && (
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{v.field.note}</div>
            )}
          </div>
          <span className="atr-val" style={{ color: v.color }}>{N(v.field?.value)}</span>
        </div>
      ))}
    </div>
  )
}
