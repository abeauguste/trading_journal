import React, { useState, useEffect } from 'react'
import { getMarketSession } from '../../utils/marketHours'

export default function MarketStatusBanner() {
  const [session, setSession] = useState(getMarketSession())
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => { const n = new Date(); setTime(n); setSession(getMarketSession(n)) }, 10000)
    return () => clearInterval(t)
  }, [])
  const cls = session.session === 'regular' || session.session === 'extended' ? 'ms-open' : session.session === 'pre' ? 'ms-pre' : 'ms-closed'
  const badgeCls = session.is_open ? 'ms-open-badge' : session.session === 'pre' ? 'ms-pre-badge' : 'ms-closed-badge'
  return (
    <div className={`market-status-banner ${cls}`}>
      <span className={`ms-session-badge ${badgeCls}`}>{session.label}</span>
      <span style={{color:'var(--text2)',fontSize:'11px'}}>{time.toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit'})} ET</span>
      <span style={{color:'var(--text3)',fontSize:'11px'}}>{time.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</span>
    </div>
  )
}
