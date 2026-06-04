import React from 'react'

export default function AINarrative({ week }) {
  if (!week) return null
  const w = week.weekly

  const plan = w.plan_of_action
  const event = w.major_economic_event

  return (
    <div>
      {event?.value && (
        <div style={{ marginBottom: '10px', padding: '8px 12px', background: 'rgba(210,153,34,.08)', border: '1px solid rgba(210,153,34,.25)', borderRadius: '6px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--neutral)', fontWeight: 700 }}>Major Economic Event</span>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>{event.value}</div>
          {event.note && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>{event.note}</div>}
        </div>
      )}
      <div className="narrative">
        {plan?.note ? (
          <span dangerouslySetInnerHTML={{ __html: plan.note.replace(/\n/g, '<br/>') }} />
        ) : plan?.value ? (
          <span>{plan.value}</span>
        ) : (
          <span style={{ color: 'var(--text3)' }}>No plan narrative available for this week.</span>
        )}
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text3)' }}>
        Week: <span style={{ color: 'var(--accent)' }}>{week.sheet}</span>
        &nbsp;|&nbsp;Contract: <span style={{ color: 'var(--text2)' }}>{week.contract}</span>
        &nbsp;|&nbsp;Date: <span style={{ color: 'var(--text2)' }}>{week.week_date}</span>
      </div>
    </div>
  )
}
