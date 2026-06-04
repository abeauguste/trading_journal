import React from 'react'

const TYPE_META = {
  TREND_DAY:    { label: 'Trend Day',    pillClass: 'pill-bull',  tone: 'tone-bull' },
  GAP_AND_GO:   { label: 'Gap and Go',   pillClass: 'pill-bull',  tone: 'tone-bull' },
  GAP_AND_FADE: { label: 'Gap and Fade', pillClass: 'pill-bear',  tone: 'tone-bear' },
  RANGE_DAY:    { label: 'Range Day',    pillClass: 'pill-gold',  tone: 'tone-gold' },
  ELEVATED_VOL: { label: 'Elevated Vol', pillClass: 'pill-bear',  tone: 'tone-bear' },
}

export default function DayTypeCard({ dayType }) {
  if (!dayType?.type) {
    return (
      <div className="card" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr"><span className="card-title">Day Type Forecast</span></div>
        <div className="card-body" style={{ color: 'var(--text-3)', fontSize: '12px' }}>
          Day type pending — waiting for session data.
        </div>
      </div>
    )
  }

  const meta = TYPE_META[dayType.type] || TYPE_META.RANGE_DAY
  const confPct = Math.round((dayType.confidence || 0) * 100)

  return (
    <div className="card" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Day Type Forecast</span>
        <span className="eyebrow" style={{ color: 'var(--text-3)' }}>{confPct}% confidence</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <span className={`pill ${meta.pillClass}`} style={{ fontSize: '11px' }}>{meta.label.toUpperCase()}</span>
          {dayType.gap_pct != null && (
            <span className="eyebrow" style={{ color: 'var(--text-3)' }}>
              Gap {dayType.gap_pct > 0 ? '+' : ''}{dayType.gap_pct.toFixed(2)}%
            </span>
          )}
        </div>
        <div style={{ height: '3px', background: 'var(--card2)', borderRadius: '2px', marginBottom: '10px' }}>
          <div style={{
            height: '100%', width: `${confPct}%`,
            background: meta.pillClass === 'pill-bull' ? 'var(--bull)' : meta.pillClass === 'pill-bear' ? 'var(--bear)' : 'var(--gold)',
            borderRadius: '2px', transition: 'width 0.4s',
          }} />
        </div>
        {dayType.implication && (
          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65, padding: '10px 12px', background: 'var(--card2)', borderRadius: '4px', borderLeft: '3px solid var(--gold)' }}>
            {dayType.implication}
          </div>
        )}
      </div>
    </div>
  )
}
