import React from 'react'
import { momClass, momArrow } from '../../utils/format'

export default function DailyTable({ week }) {
  if (!week) return null
  const daily = week.daily || []

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="hist-tbl">
        <thead>
          <tr>
            <th>Date</th>
            <th>4H Level</th>
            <th>Daily</th>
            <th>Weekly</th>
            <th>Monthly</th>
            <th>Mom 4H</th>
            <th>Mom D</th>
            <th>Mom W</th>
            <th>Mom M</th>
            <th>V-Score</th>
            <th>Level</th>
            <th>VIX</th>
            <th>AI Pivot</th>
            <th>Event</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--accent)' }}>{d.day_date || `Day ${i + 1}`}</td>
              <td>{d.level_4h || '—'}</td>
              <td>{d.level_daily || '—'}</td>
              <td>{d.level_weekly || '—'}</td>
              <td>{d.level_monthly || '—'}</td>
              <td className={momClass(d.momentum_4h)}>{d.momentum_4h || '—'}</td>
              <td className={momClass(d.momentum_daily)}>{d.momentum_daily || '—'}</td>
              <td className={momClass(d.momentum_weekly)}>{d.momentum_weekly || '—'}</td>
              <td className={momClass(d.momentum_monthly)}>{d.momentum_monthly || '—'}</td>
              <td style={{ color: 'var(--purple)' }}>{d.trigger_vscore || '—'}</td>
              <td style={{ color: 'var(--accent)' }}>{d.trigger_level != null ? d.trigger_level : '—'}</td>
              <td style={{ color: 'var(--bear)' }}>{d.trigger_vix != null ? d.trigger_vix : '—'}</td>
              <td style={{ color: 'var(--gold)' }}>{d.trigger_ai_pivot || '—'}</td>
              <td style={{ color: 'var(--neutral)' }}>{d.event || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
