import React from 'react'
import { postureClass } from '../../utils/format'

export default function PostureMatrix({ week }) {
  if (!week) return null
  const w = week.weekly

  const rows = [
    {
      label: 'ES',
      monthly: w.es_monthly_posture?.value,
      weekly: w.es_weekly_posture?.value,
      daily: w.es_daily_posture?.value,
    },
    {
      label: 'VIX',
      monthly: w.vix_monthly_posture?.value,
      weekly: w.vix_weekly_posture?.value,
      daily: w.vix_daily_posture?.value,
    },
  ]

  return (
    <div>
      <div className="pg">
        <div className="pg-cell pg-hdr pg-lbl">Symbol</div>
        <div className="pg-cell pg-hdr">Monthly</div>
        <div className="pg-cell pg-hdr">Weekly</div>
        <div className="pg-cell pg-hdr">Daily</div>
        {rows.map(r => (
          <React.Fragment key={r.label}>
            <div className="pg-cell pg-lbl">{r.label}</div>
            <div className={`pg-cell ${postureClass(r.monthly)}`}>{r.monthly || '—'}</div>
            <div className={`pg-cell ${postureClass(r.weekly)}`}>{r.weekly || '—'}</div>
            <div className={`pg-cell ${postureClass(r.daily)}`}>{r.daily || '—'}</div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: '12px' }}>
        {rows.map(r => (
          <div key={r.label} style={{ marginBottom: '8px' }}>
            {['monthly', 'weekly', 'daily'].map(tf => {
              const note = week.weekly[`${r.label === 'ES' ? 'es' : 'vix'}_${tf}_posture`]?.note
              if (!note) return null
              return (
                <div key={tf} style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label} {tf}:</span> {note}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
