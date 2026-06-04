import React from 'react'
import { momClass, momArrow } from '../../utils/format'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function DayCard({ day, index }) {
  if (!day) return (
    <div className="dcard">
      <div className="dcard-hdr">
        <div className="dcard-date">{DAYS[index] || `Day ${index + 1}`}</div>
      </div>
      <div className="dcard-body" style={{ color: 'var(--text3)', fontSize: '11px' }}>No data</div>
    </div>
  )

  const tfs = ['4H', 'Daily', 'Weekly', 'Monthly']
  const levels = [day.level_4h, day.level_daily, day.level_weekly, day.level_monthly]
  const moms = [day.momentum_4h, day.momentum_daily, day.momentum_weekly, day.momentum_monthly]

  return (
    <div className="dcard">
      <div className="dcard-hdr">
        <div className="dcard-date">{day.day_date || DAYS[index] || `Day ${index + 1}`}</div>
        {day.event && (
          <div style={{ fontSize: '9px', color: 'var(--neutral)', marginTop: '2px' }}>⚡ {day.event}</div>
        )}
      </div>
      <div className="dcard-body">
        {/* Levels */}
        <div>
          <div className="ds-label">Levels</div>
          {tfs.map((tf, i) => (
            <div className="dl-row" key={tf}>
              <span className="dl-tf">{tf}</span>
              <span className="dl-val n-accent">{levels[i] || '—'}</span>
            </div>
          ))}
        </div>
        {/* Momentum */}
        <div>
          <div className="ds-label">Momentum</div>
          {tfs.map((tf, i) => (
            <div className="dl-row" key={tf}>
              <span className="dl-tf">{tf}</span>
              <span className={`dl-val ${momClass(moms[i])}`}>{moms[i] || '—'}</span>
            </div>
          ))}
        </div>
        {/* Triggers */}
        <div>
          <div className="ds-label">Triggers</div>
          <div className="dl-row">
            <span className="dl-tf">V-Score</span>
            <span className="dl-val" style={{ color: 'var(--purple)' }}>{day.trigger_vscore || '—'}</span>
          </div>
          <div className="dl-row">
            <span className="dl-tf">Level</span>
            <span className="dl-val n-accent">{day.trigger_level != null ? day.trigger_level : '—'}</span>
          </div>
          <div className="dl-row">
            <span className="dl-tf">VIX</span>
            <span className="dl-val n-bear">{day.trigger_vix != null ? day.trigger_vix : '—'}</span>
          </div>
          <div className="dl-row">
            <span className="dl-tf">AI Pivot</span>
            <span className="dl-val" style={{ color: 'var(--gold)' }}>{day.trigger_ai_pivot || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
