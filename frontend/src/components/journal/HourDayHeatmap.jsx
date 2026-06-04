import React, { useMemo } from 'react'
import { N } from '../../utils/format'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6) // 6..18

export default function HourDayHeatmap({ byHourDay }) {
  const maxAbs = useMemo(() => {
    if (!byHourDay) return 1
    let m = 1
    for (const day of DAYS) {
      const hourMap = byHourDay[day] || {}
      for (const h of HOURS) {
        const v = hourMap[String(h).padStart(2, '0')]
        if (v != null) m = Math.max(m, Math.abs(v))
      }
    }
    return m
  }, [byHourDay])

  if (!byHourDay || Object.keys(byHourDay).length === 0) {
    return (
      <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">Hour × Day Heatmap</span>
          <span className="eyebrow" style={{ color: 'var(--bear)' }}>Net P&L $</span>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
          No hourly data yet.
        </div>
      </div>
    )
  }

  const cellStyle = (v) => {
    if (v == null) return { background: 'var(--card2)', minWidth: '54px', height: '36px' }
    const intensity = 0.15 + 0.70 * Math.min(Math.abs(v) / maxAbs, 1)
    const bg = v > 0
      ? `rgba(111,191,138,${intensity.toFixed(2)})`
      : `rgba(200,102,92,${intensity.toFixed(2)})`
    return { background: bg, minWidth: '54px', height: '36px' }
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)`,
    gap: '2px',
  }

  return (
    <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Hour × Day Heatmap</span>
        <span className="eyebrow" style={{ color: 'var(--bear)' }}>Net P&L $</span>
      </div>
      <div className="card-body" style={{ paddingTop: '8px' }}>
        <div style={{ overflowX: 'auto' }}>
          {/* Header row */}
          <div style={gridStyle}>
            <div style={{ height: '24px' }} />
            {HOURS.map(h => (
              <div key={h} style={{
                textAlign: 'center', fontSize: '10px',
                fontFamily: 'var(--f-mono)', color: 'var(--text-3)',
                paddingBottom: '4px', height: '24px', lineHeight: '24px',
              }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {/* Data rows */}
          {DAYS.map(day => {
            const hourMap = byHourDay[day] || {}
            return (
              <div key={day} style={{ ...gridStyle, marginTop: '2px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  fontSize: '10px', fontFamily: 'var(--f-mono)',
                  color: 'var(--text-3)', textTransform: 'uppercase',
                  paddingRight: '8px', justifyContent: 'flex-end',
                  height: '36px',
                }}>
                  {day.slice(0, 3)}
                </div>
                {HOURS.map(h => {
                  const key = String(h).padStart(2, '0')
                  const v = hourMap[key] ?? null
                  return (
                    <div key={h} style={{
                      ...cellStyle(v),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '2px',
                    }}>
                      {v != null && (
                        <span style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--text)' }}>
                          {v >= 0 ? '+$' : '-$'}{N(Math.abs(v), 0)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
