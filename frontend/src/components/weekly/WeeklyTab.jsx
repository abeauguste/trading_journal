import React, { useState, useCallback } from 'react'
import { N } from '../../utils/format'
import { symbolCfg } from '../../config/symbols'
import WeeklyNewsCard from './WeeklyNewsCard'
import ScenarioPlanner from './ScenarioPlanner'

function BiasChip({ bias }) {
  if (!bias) return null
  const cls = bias === 'BULL' ? 'pill pill-bull' : bias === 'BEAR' ? 'pill pill-bear' : 'pill pill-gold'
  return <span className={cls}>{bias}</span>
}

function RegimeChip({ label }) {
  if (!label) return null
  const upper = label.toUpperCase()
  const cls = upper.includes('BULL') || upper === 'COMPLACENT' ? 'pill pill-bull'
    : upper.includes('BEAR') || upper === 'PANIC' || upper === 'FEAR' ? 'pill pill-bear'
    : 'pill pill-gold'
  return <span className={cls}>{label}</span>
}

function VWAPRow({ label, vwap, price }) {
  if (vwap == null) return (
    <div className="kv-row">
      <span className="kv-key">{label}</span>
      <span className="kv-val muted">—</span>
    </div>
  )
  const diff = price != null ? price - vwap : null
  const posture = diff == null ? null : Math.abs(diff) < 0.25 ? 'AT' : diff > 0 ? 'ABOVE' : 'BELOW'
  const tone = posture === 'ABOVE' ? 'tone-bull' : posture === 'BELOW' ? 'tone-bear' : 'tone-gold'
  return (
    <div className="kv-row">
      <span className="kv-key">{label}</span>
      <span className={`kv-val mono ${tone}`}>{N(vwap)}</span>
      {diff != null && (
        <span className={`mono ${tone}`} style={{ fontSize: '11px', marginLeft: '8px' }}>
          {diff > 0 ? '+' : ''}{N(diff, 1)}
        </span>
      )}
    </div>
  )
}

function ScenarioCard({ label, entry, target, stop, isBull }) {
  const tone = isBull ? 'tone-bull' : 'tone-bear'
  const rr = entry && target && stop && entry !== stop
    ? Math.abs((target - entry) / (entry - stop)).toFixed(1)
    : null
  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">{label}</span>
        {rr && <span className={`eyebrow ${tone}`}>R:R {rr}:1</span>}
      </div>
      <div className="card-body">
        <div className="kv-row"><span className="kv-key">Entry</span><span className="kv-val mono">{entry != null ? N(entry) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Target</span><span className={`kv-val mono ${tone}`}>{target != null ? N(target) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Stop</span><span className={`kv-val mono ${isBull ? 'tone-bear' : 'tone-bull'}`}>{stop != null ? N(stop) : '—'}</span></div>
      </div>
    </div>
  )
}

export default function WeeklyTab({ forecast, liveData, refreshForecast, news = [], journalStats, symbol = 'ES' }) {
  const cfg = symbolCfg(symbol)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  const handleRefresh = useCallback(async () => {
    setBusy(true); setStatus(null)
    try { await refreshForecast(); setStatus('ok') }
    catch { setStatus('error') }
    finally { setBusy(false); setTimeout(() => setStatus(null), 4000) }
  }, [refreshForecast])

  if (!forecast) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p className="lede" style={{ marginBottom: '28px', textAlign: 'center' }}>No forecast generated yet for this week.</p>
      <button className="btn btn-primary" onClick={refreshForecast}>Generate Forecast</button>
    </div>
  )

  const price = liveData?.price ?? forecast.as_of_price
  const vwapD = liveData?.vwap        ?? forecast.vwap_daily
  const vwapW = liveData?.vwap_weekly ?? forecast.vwap_weekly
  const vwapM = liveData?.vwap_monthly ?? forecast.vwap_monthly
  const vwapQ = forecast.vwap_quarterly
  const vwapY = forecast.vwap_yearly
  const atr   = liveData?.atr ?? forecast.atr_current
  const riskEvents = forecast.risk_events || []

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Forecast</span>
        <h2 className="h-section">Weekly <em>Plan</em></h2>
      </div>

      {/* Posture banner */}
      <div className="card" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <BiasChip bias={forecast.weekly_bias} />
          <span className="muted" style={{ flex: 1, fontSize: '13px' }}>{forecast.vwap_posture_label || '—'}</span>
          {price != null && (
            <span className="mono tone-gold" style={{ fontSize: '15px' }}>{cfg.label} {N(price)}</span>
          )}
          {forecast.week_label && <span className="eyebrow">{forecast.week_label}</span>}
          {status === 'ok'    && <span className="tone-bull" style={{ fontSize: '12px' }}>Updated</span>}
          {status === 'error' && <span className="tone-bear" style={{ fontSize: '12px' }}>Update failed</span>}
          <button className="btn btn-primary" onClick={handleRefresh} disabled={busy} style={{ marginLeft: 'auto', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* VWAP + Risk events */}
      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hdr"><span className="card-title">VWAP Stack</span></div>
          <div className="card-body">
            <VWAPRow label="Daily VWAP"     vwap={vwapD} price={price} />
            <VWAPRow label="Weekly VWAP"    vwap={vwapW} price={price} />
            <VWAPRow label="Monthly VWAP"   vwap={vwapM} price={price} />
            <VWAPRow label="Quarterly VWAP" vwap={vwapQ} price={price} />
            <VWAPRow label="Yearly VWAP"    vwap={vwapY} price={price} />
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <span className="card-title">Risk Events This Week</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {forecast.has_fomc_this_week && <span className="pill pill-bear">FOMC</span>}
              {forecast.has_cpi_this_week  && <span className="pill pill-bear">CPI</span>}
            </div>
          </div>
          <div className="card-body">
            {riskEvents.length === 0 ? (
              <p className="muted" style={{ fontSize: '13px' }}>No high-impact events this week.</p>
            ) : (
              riskEvents.map((e, i) => (
                <div key={i} className="kv-row" style={{ alignItems: 'flex-start', paddingTop: '10px', paddingBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>{e.event_name}</div>
                    <div className="eyebrow" style={{ letterSpacing: '0.06em' }}>{e.event_date}{e.event_time ? ` · ${e.event_time}` : ''}</div>
                  </div>
                  <span className={`pill${e.days_away === 0 ? ' pill-bear' : e.days_away <= 2 ? ' pill-gold' : ''}`}>
                    {e.days_away === 0 ? 'TODAY' : `${e.days_away}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ATR / VIX / Momentum */}
      <div className="grid g3" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hdr"><span className="card-title">ATR</span></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Current ATR</span><span className="kv-val mono">{atr != null ? N(atr, 1) : '—'}</span></div>
            <div className="kv-row"><span className="kv-key">Regime</span><RegimeChip label={forecast.atr_regime} /></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">VIX</span></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">VIX</span><span className="kv-val mono tone-bear">{forecast.vix_current != null ? N(forecast.vix_current, 2) : '—'}</span></div>
            <div className="kv-row"><span className="kv-key">Regime</span><RegimeChip label={forecast.vix_regime} /></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">Momentum</span></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Signal</span><RegimeChip label={forecast.momentum_signal} /></div>
            <div className="kv-row"><span className="kv-key">Squeeze</span><span className="kv-val mono">{forecast.squeeze_state || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* Bull / Bear scenarios */}
      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <ScenarioCard label="Bull Scenario" entry={forecast.bull_entry} target={forecast.bull_target} stop={forecast.bull_stop} isBull={true} />
        <ScenarioCard label="Bear Scenario" entry={forecast.bear_entry} target={forecast.bear_target} stop={forecast.bear_stop} isBull={false} />
      </div>

      {/* Scenario Planner */}
      <ScenarioPlanner liveData={liveData} journalStats={journalStats} />

      {/* Narrative */}
      {forecast.narrative && (
        <div className="card">
          <div className="card-hdr"><span className="card-title">Weekly Intelligence Narrative</span></div>
          <div className="card-body">
            <div className="narrative">{forecast.narrative}</div>
          </div>
        </div>
      )}

      <WeeklyNewsCard news={news} />
    </div>
  )
}
