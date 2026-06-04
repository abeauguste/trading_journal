import React, { useState, useEffect } from 'react'

function getEffectiveTradingDate() {
  // After Sunday 6pm ET the ES futures week is open — treat Sunday as Monday
  const etStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const et = new Date(etStr)
  if (et.getDay() === 0 && et.getHours() >= 18) {
    return new Date(et.getFullYear(), et.getMonth(), et.getDate() + 1)
  }
  return et
}

function getWeekDays() {
  const eff = getEffectiveTradingDate()
  const dow = eff.getDay()
  const monday = new Date(eff)
  monday.setDate(eff.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatCountdown(dateStr, timeStr) {
  try {
    const dt = new Date(`${dateStr}T${(timeStr || '09:30').replace(' ET','').substring(0,5)}:00-04:00`)
    const diff = dt - Date.now()
    if (diff < 0) return 'past'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 48) return `in ${Math.floor(h/24)}d`
    return `in ${h}h ${m}m`
  } catch { return '' }
}

export default function EconomicCalendar({ events = [] }) {
  const [, setTick] = useState(0)
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 60000); return () => clearInterval(t) }, [])
  const days = getWeekDays()
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="cal-week">
      {days.map(d => {
        const ds = d.toISOString().slice(0, 10)
        const isToday = ds === today
        const dayEvents = events.filter(e => e.event_date === ds)
        return (
          <div key={ds} className={`cal-day${isToday ? ' today' : ''}`}>
            <div className="cal-day-hdr">
              {d.toLocaleDateString('en-US', { weekday: 'short' })} {d.getDate()}
            </div>
            {dayEvents.length === 0 && <div style={{padding:'8px 10px',fontSize:'10px',color:'var(--text3)'}}>—</div>}
            {dayEvents.map(e => (
              <div key={e.id} className={`cal-event${e.event_type === 'FOMC' ? ' fomc' : ''}`}>
                <span className={`impact-badge impact-${e.event_type === 'FOMC' ? 'fomc' : (e.impact || 'low').toLowerCase()}`}>
                  {e.event_type === 'FOMC' ? 'FOMC' : e.impact}
                </span>
                <div className="cal-event-name">{e.event_name}</div>
                {e.event_time && <div className="cal-event-data">{e.event_time}</div>}
                {e.forecast && <div className="cal-event-data">Est: {e.forecast} | Prev: {e.previous}</div>}
                <span className="countdown">{formatCountdown(e.event_date, e.event_time)}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
