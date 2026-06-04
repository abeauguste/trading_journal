import React from 'react'
import { N } from '../../utils/format'

export default function ProjectedPrices({ week }) {
  if (!week) return null
  const w = week.weekly

  const items = [
    { label: 'ES Monthly Proj', field: w.es_monthly_proj_price, color: 'var(--bear)' },
    { label: 'ES Weekly Proj', field: w.es_weekly_proj_price, color: 'var(--neutral)' },
    { label: 'ES Daily Proj', field: w.es_daily_proj_price, color: 'var(--accent)' },
    { label: 'VIX Monthly Proj', field: w.vix_monthly_proj_price, color: 'var(--bear)' },
    { label: 'VIX Weekly Proj', field: w.vix_weekly_proj_price, color: 'var(--neutral)' },
    { label: 'VIX Daily Proj', field: w.vix_daily_proj_price, color: 'var(--accent)' },
  ]

  return (
    <div>
      {items.map((item, i) => (
        <div className="ind-row" key={i}>
          <div>
            <div className="ind-label">{item.label}</div>
            {item.field?.note && <div className="ind-sub">{item.field.note}</div>}
          </div>
          <span className="num" style={{ color: item.color }}>
            {N(item.field?.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
