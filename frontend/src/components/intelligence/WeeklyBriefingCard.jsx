import React from 'react'

export default function WeeklyBriefingCard({ intelligence, liveData, week }) {
  const text = intelligence?.weekly_plan_suggestion
  const fallback = week?.weekly?.plan_of_action?.note || week?.weekly?.plan_of_action?.value
  const generated = intelligence?.generated_at ? new Date(intelligence.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' : null
  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">Weekly Intelligence Briefing</span>
        {generated && <span style={{fontSize:'10px',color:'var(--text3)'}}>Updated {generated}</span>}
      </div>
      <div className="card-body">
        <div className="narrative">
          {text || fallback || 'Intelligence briefing will appear here after the first webhook is received from TradingView.'}
        </div>
        {intelligence?.risk_events_this_week?.length > 0 && (
          <div style={{marginTop:'12px'}}>
            {intelligence.risk_events_this_week.map((e, i) => (
              <div key={i} style={{padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:'11px',color:'var(--text2)'}}>
                <span className={`impact-badge impact-${e.event_type === 'FOMC' ? 'fomc' : 'high'}`} style={{marginRight:'8px'}}>{e.event_type}</span>
                {e.warning}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
