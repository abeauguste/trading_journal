import React from 'react'

function formatDay(daysAway) {
  if (daysAway === 0) return 'TODAY'
  if (daysAway === 1) return 'TOMORROW'
  const d = new Date()
  d.setDate(d.getDate() + daysAway)
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

// Days remaining in the current trading week (through Friday).
// Sun → 5, Mon → 4, Tue → 3, Wed → 2, Thu → 1, Fri → 0, Sat → 5 (plan for next week)
function daysUntilFriday() {
  const dow = new Date().getDay()
  if (dow === 0 || dow === 6) return 5
  return 5 - dow
}

export default function EventsThisWeekCard({ economicEvents }) {
  const maxDays  = daysUntilFriday()
  const thisWeek = (economicEvents ?? []).filter(
    e => e.days_away != null
      && e.days_away >= 0
      && e.days_away <= maxDays
      && e.impact?.toUpperCase() === 'HIGH'
  )

  return (
    <div className="card reveal r-4" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">High-Impact Events This Week</span>
        <span className="eyebrow muted">
          {thisWeek.length} Event{thisWeek.length !== 1 ? 's' : ''}
        </span>
      </div>
      {thisWeek.length === 0 ? (
        <div className="card-body">
          <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            No high-impact events scheduled this week.
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Event</th>
                <th>Time (ET)</th>
                <th>Forecast</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {thisWeek.map((e) => {
                const isToday = e.days_away === 0
                const rowKey  = `${e.days_away ?? ''}-${e.name || e.event || ''}-${e.time || ''}`
                return (
                  <tr
                    key={rowKey}
                    style={isToday ? {
                      background: 'var(--gold-soft)',
                      outline: '1px solid var(--gold-line)',
                      outlineOffset: '-1px',
                    } : undefined}
                  >
                    <td>
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          color: isToday ? 'var(--gold)' : 'var(--text-3)',
                          fontWeight: isToday ? 600 : undefined,
                        }}
                      >
                        {formatDay(e.days_away)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{e.name || e.event || '—'}</td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      {e.time || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      {e.forecast != null ? e.forecast : '—'}
                    </td>
                    <td>
                      {e.actual != null ? (
                        <span className="pill pill-gold" style={{ fontSize: '9px' }}>Released</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Pending</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
