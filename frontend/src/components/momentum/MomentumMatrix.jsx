import React from 'react'
import { momClass, momArrow } from '../../utils/format'

export default function MomentumMatrix({ week }) {
  if (!week) return null
  const daily = week.daily || []

  const tfs = ['4H', 'Daily', 'Weekly', 'Monthly']

  return (
    <div className="mom-grid">
      {/* Header row */}
      <div className="mcell mhdr mlbl">Day</div>
      {tfs.map(tf => (
        <div className="mcell mhdr" key={tf}>{tf}</div>
      ))}

      {/* Data rows */}
      {daily.map((d, i) => {
        const moms = [d.momentum_4h, d.momentum_daily, d.momentum_weekly, d.momentum_monthly]
        return (
          <React.Fragment key={i}>
            <div className="mcell mlbl" style={{ textAlign: 'left', color: 'var(--accent)' }}>
              {d.day_date || `Day ${i + 1}`}
            </div>
            {moms.map((m, j) => (
              <div key={j} className={`mcell ${momClass(m)}`}>
                {momArrow(m)}
                <div style={{ fontSize: '9px', color: 'inherit', opacity: 0.7, marginTop: '1px' }}>
                  {m ? m.replace('Slow-', '').replace('Fast-', '').split('/')[0] : ''}
                </div>
              </div>
            ))}
          </React.Fragment>
        )
      })}

      {daily.length === 0 && (
        <div className="mcell" style={{ gridColumn: '1/-1', color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>
          No daily data available
        </div>
      )}
    </div>
  )
}
