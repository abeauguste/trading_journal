import React from 'react'

export default function EarningsImpact({ earnings = [] }) {
  if (earnings.length === 0) return <div className="no-data-placeholder">No major earnings this week</div>
  return (
    <div className="earnings-grid">
      {earnings.map(e => (
        <div key={e.id || e.ticker} className="earnings-card">
          <div className="earnings-ticker n-accent">{e.ticker}</div>
          {e.company_name && <div className="earnings-meta">{e.company_name}</div>}
          <div className="earnings-meta">
            {e.earnings_date} · {e.timing || 'TBD'}
          </div>
          <div style={{marginTop:'6px'}}>
            <span className="impact-badge impact-earnings">ES MOVER</span>
          </div>
        </div>
      ))}
    </div>
  )
}
