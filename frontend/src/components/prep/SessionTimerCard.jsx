import React, { useState, useEffect } from 'react'

function formatTime(secs) {
  if (secs == null || secs <= 0) return '00:00:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export default function SessionTimerCard({ session, secondsToRth }) {
  const [remaining, setRemaining] = useState(secondsToRth)

  useEffect(() => { setRemaining(secondsToRth) }, [secondsToRth])

  useEffect(() => {
    if (!remaining || remaining <= 0) return
    const id = setInterval(() => setRemaining(r => Math.max(0, (r || 0) - 1)), 1000)
    return () => clearInterval(id)
  }, [remaining > 0 ? 1 : 0])

  const sessionColor = session === 'PRE-MARKET' ? 'var(--gold)'
    : session === 'RTH OPEN' || session === 'MID-SESSION' || session === 'POWER HOUR' || session === 'CLOSING' ? 'var(--bull)'
    : 'var(--text-3)'

  return (
    <div className="card">
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '4px' }}>Session</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '16px', fontWeight: 600, color: sessionColor }}>
            {session || 'LOADING'}
          </div>
        </div>
        {session === 'PRE-MARKET' && remaining != null && (
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow" style={{ marginBottom: '4px' }}>RTH Opens In</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '24px', fontWeight: 600, color: 'var(--gold)' }}>
              {formatTime(remaining)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
