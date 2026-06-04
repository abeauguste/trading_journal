import React from 'react'
import { N, postureClass } from '../../utils/format'

export default function VixPosture({ week }) {
  if (!week) return null
  const w = week.weekly

  const boxes = [
    {
      tf: 'Monthly',
      posture: w.vix_monthly_posture?.value,
      postureNote: w.vix_monthly_posture?.note,
      proj: w.vix_monthly_proj_price?.value,
      projNote: w.vix_monthly_proj_price?.note,
    },
    {
      tf: 'Weekly',
      posture: w.vix_weekly_posture?.value,
      postureNote: w.vix_weekly_posture?.note,
      proj: w.vix_weekly_proj_price?.value,
      projNote: w.vix_weekly_proj_price?.note,
    },
    {
      tf: 'Daily',
      posture: w.vix_daily_posture?.value,
      postureNote: w.vix_daily_posture?.note,
      proj: w.vix_daily_proj_price?.value,
      projNote: w.vix_daily_proj_price?.note,
    },
  ]

  return (
    <div>
      <div className="vix-boxes">
        {boxes.map(b => (
          <div className="vix-box" key={b.tf}>
            <div className="vix-tf">{b.tf}</div>
            <div className={`vix-pos ${postureClass(b.posture)}`}>{b.posture || '—'}</div>
            <div className="vix-proj">{N(b.proj)}</div>
            <div className="vix-note">{b.projNote || b.postureNote || ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
