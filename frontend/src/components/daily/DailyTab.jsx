import React, { useState, useCallback } from 'react'
import { N } from '../../utils/format'
import DailyNewsCard from './DailyNewsCard'

function DayCard({ day, isToday, today }) {
  const isFuture = !isToday && day.day_date > today
  const biasCls = day.day_bias === 'BULL' ? 'pill pill-bull'
                : day.day_bias === 'BEAR' ? 'pill pill-bear'
                : 'pill pill-gold'

  return (
    <div className={`dcard${isToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`}>
      <div className="dcard-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="daily-d">{day.day_label}</span>
          {isToday && <span className="pill pill-live" style={{ fontSize: '9px' }}>TODAY</span>}
        </div>
        <div className="daily-date muted" style={{ marginTop: '4px' }}>{day.day_date}</div>
        {day.day_bias && (
          <div style={{ marginTop: '8px' }}>
            <span className={biasCls}>{day.day_bias}</span>
          </div>
        )}
      </div>
      <div className="dcard-body">
        {day.event_summary && (
          <div style={{ fontSize: '11px', color: 'var(--gold)', marginBottom: '12px', padding: '6px 8px', background: 'var(--gold-soft)', borderRadius: '2px' }}>
            {day.event_summary}
          </div>
        )}
        {isFuture ? (
          <div className="daily-levels-pending">
            Levels unlock on {day.day_label}
          </div>
        ) : (
          <div className="daily-levels">
            <div className="daily-row">
              <span className="daily-k">D VWAP</span>
              <span className="mono tone-gold">{day.level_daily_vwap != null ? N(day.level_daily_vwap) : '—'}</span>
            </div>
            <div className="daily-row">
              <span className="daily-k">W VWAP</span>
              <span className="mono tone-gold">{day.level_weekly_vwap != null ? N(day.level_weekly_vwap) : '—'}</span>
            </div>
            <div className="daily-row">
              <span className="daily-k">Support</span>
              <span className="mono tone-bull">{day.level_support_1 != null ? N(day.level_support_1) : '—'}</span>
            </div>
            <div className="daily-row">
              <span className="daily-k">Resist.</span>
              <span className="mono tone-bear">{day.level_resistance_1 != null ? N(day.level_resistance_1) : '—'}</span>
            </div>
            <div className="daily-row">
              <span className="daily-k">Max Loss</span>
              <span className="mono">{day.max_loss_pts != null ? `${N(day.max_loss_pts, 1)} pts` : '—'}</span>
            </div>
          </div>
        )}
        {day.day_narrative && (
          <div className="muted" style={{ fontSize: '11px', marginTop: '12px', lineHeight: 1.6 }}>
            {day.day_narrative}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DailyTab({ dailyForecasts, liveData, refreshForecast, news = [], symbol = 'ES' }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  const handleRegenerate = useCallback(async () => {
    setBusy(true); setStatus(null)
    try { await refreshForecast(); setStatus('ok') }
    catch { setStatus('error') }
    finally { setBusy(false); setTimeout(() => setStatus(null), 4000) }
  }, [refreshForecast])

  if (!dailyForecasts || dailyForecasts.length === 0) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p className="lede" style={{ marginBottom: '28px', textAlign: 'center' }}>No daily forecasts generated yet for this week.</p>
      <button className="btn btn-primary" onClick={handleRegenerate} disabled={busy}>
        {busy ? 'Generating…' : 'Generate Forecast'}
      </button>
    </div>
  )

  const today = (() => {
    const now = new Date()
    const etParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now)
    const get = (t) => parseInt(etParts.find(p => p.type === t)?.value || '0')
    const etYear = get('year'), etMonth = get('month'), etDay = get('day'), etHour = get('hour')
    const etWeekday = new Date(etYear, etMonth - 1, etDay).getDay()
    const pastSixPM = etHour >= 18
    let advanceDays = 0
    if (pastSixPM) {
      if (etWeekday === 5) advanceDays = 3
      else if (etWeekday === 6) advanceDays = 2
      else advanceDays = 1
    } else if (etWeekday === 0) { advanceDays = 1 }
    else if (etWeekday === 6) { advanceDays = 2 }
    const active = new Date(etYear, etMonth - 1, etDay + advanceDays)
    return `${active.getFullYear()}-${String(active.getMonth() + 1).padStart(2, '0')}-${String(active.getDate()).padStart(2, '0')}`
  })()

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Plans</span>
        <h2 className="h-section">Daily <em>Levels</em></h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-sm)' }}>
        <span className="eyebrow">Levels update on bar close · 6 PM ET advance</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {status === 'ok'    && <span className="tone-bull" style={{ fontSize: '12px' }}>Forecast updated</span>}
          {status === 'error' && <span className="tone-bear" style={{ fontSize: '12px' }}>Update failed</span>}
          <button className="btn btn-primary" onClick={handleRegenerate} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="day-cards" style={{ marginBottom: 'var(--gap)' }}>
        {dailyForecasts.map(day => (
          <DayCard key={day.day_index} day={day} isToday={day.day_date === today} today={today} />
        ))}
      </div>

      <div className="card">
        <div className="card-hdr"><span className="card-title">Week at a Glance</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th><th>Date</th><th>Bias</th><th>Events</th>
                <th>D VWAP</th><th>Support</th><th>Resist.</th><th>Max Loss</th>
              </tr>
            </thead>
            <tbody>
              {dailyForecasts.map(day => (
                <tr key={day.day_index} style={{ fontWeight: day.day_date === today ? 600 : 400 }}>
                  <td className="mono">{day.day_label}</td>
                  <td className="muted mono">{day.day_date}</td>
                  <td>
                    {day.day_bias && (
                      <span className={`pill${day.day_bias === 'BULL' ? ' pill-bull' : day.day_bias === 'BEAR' ? ' pill-bear' : ' pill-gold'}`} style={{ fontSize: '9.5px' }}>
                        {day.day_bias}
                      </span>
                    )}
                  </td>
                  <td className="tone-gold" style={{ fontSize: '12px' }}>{day.event_summary || '—'}</td>
                  <td className="mono tone-gold">{day.level_daily_vwap != null ? N(day.level_daily_vwap) : '—'}</td>
                  <td className="mono tone-bull">{day.level_support_1 != null ? N(day.level_support_1) : '—'}</td>
                  <td className="mono tone-bear">{day.level_resistance_1 != null ? N(day.level_resistance_1) : '—'}</td>
                  <td className="mono">{day.max_loss_pts != null ? N(day.max_loss_pts, 1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DailyNewsCard news={news} />
    </div>
  )
}
