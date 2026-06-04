import React from 'react'
import EconomicCalendar from './EconomicCalendar'
import EarningsImpact from './EarningsImpact'

export default function RiskCalendarCard({ economicEvents, earningsEvents, warnings }) {
  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">Risk Calendar</span>
        {warnings?.length > 0 && (
          <span className="badge badge-bear">{warnings.length} HIGH IMPACT</span>
        )}
      </div>
      <div className="card-body">
        {warnings?.length > 0 && (
          <div style={{marginBottom:'12px'}}>
            {warnings.map((w, i) => (
              <div key={i} style={{padding:'6px 10px',marginBottom:'5px',background:'rgba(248,81,73,.06)',border:'1px solid rgba(248,81,73,.2)',borderRadius:'5px',fontSize:'11px',color:'var(--text2)'}}>
                <span className={`impact-badge impact-${w.type === 'FOMC' ? 'fomc' : 'high'}`} style={{marginRight:'8px'}}>{w.type}</span>
                {w.message}
              </div>
            ))}
          </div>
        )}
        <div style={{marginBottom:'14px'}}>
          <div className="settings-title" style={{marginBottom:'8px'}}>This Week's Economic Events</div>
          <EconomicCalendar events={economicEvents} />
        </div>
        <div>
          <div className="settings-title" style={{marginBottom:'8px'}}>Earnings This Week (ES Movers)</div>
          <EarningsImpact earnings={earningsEvents} />
        </div>
      </div>
    </div>
  )
}
