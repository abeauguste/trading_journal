import React, { useState, useEffect } from 'react'
import Logo from './Logo'
import { N } from '../../utils/format'
import { symbolCfg } from '../../config/symbols'
import SymbolToggle from './SymbolToggle'

const TABS = [
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'weekly',       label: 'Weekly' },
  { id: 'daily',        label: 'Daily' },
  { id: 'prep',         label: 'Prep' },
  { id: 'markets',      label: 'Markets' },
  { id: 'historical',   label: 'Historical' },
  { id: 'risk',         label: 'Risk' },
  { id: 'journal',      label: 'Journal' },
  { id: 'settings',     label: 'Settings' },
]

function ETClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' })} ET
    </span>
  )
}

// Is the ES futures market actively trading right now? (Sun 18:00 ET → Fri 17:00 ET,
// minus the daily 17:00–18:00 ET maintenance break.) Used so the staleness alarm only
// fires when data is *expected* to be flowing.
function isFuturesOpen(now) {
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()                       // 0 Sun .. 6 Sat
  const min = et.getHours() * 60 + et.getMinutes()
  const BREAK = 17 * 60, OPEN = 18 * 60
  if (day === 6) return false                    // Saturday: closed
  if (day === 0) return min >= OPEN              // Sunday: opens 18:00 ET
  if (day === 5) return min < BREAK              // Friday: closes 17:00 ET
  return !(min >= BREAK && min < OPEN)           // Mon–Thu: open except the 17–18 break
}

function fmtAge(sec) {
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`
  return `${Math.floor(sec / 86400)}d`
}

// Freshness pill — surfaces silent webhook death. Recomputes every 15s.
function FreshnessPill({ lastUpdated, hasPrice, symbol }) {
  const code = symbolCfg(symbol).code
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 15000)
    return () => clearInterval(id)
  }, [])

  if (!hasPrice || !lastUpdated) return <span className="pill" title="No live data received">OFFLINE</span>

  const ageSec = Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000))
  if (ageSec < 120) return <span className="pill pill-live" title="Live data flowing">LIVE</span>

  const ageStr = fmtAge(ageSec)
  if (!isFuturesOpen(new Date())) {
    return <span className="pill" title={`Last tick ${ageStr} ago · ${code} closed`}>CLOSED · {ageStr}</span>
  }
  if (ageSec < 900) {
    return <span className="pill pill-gold" title={`Last tick ${ageStr} ago`}>{ageStr} AGO</span>
  }
  return <span className="pill pill-bear" title={`No data for ${ageStr} while ${code} is open — check the TradingView webhook`}>STALE {ageStr}</span>
}

export default function TopBar({ liveData, activeTab, onTabChange, symbol, onSymbolChange }) {
  const isLive = liveData?.price != null
  const cfg = symbolCfg(symbol)

  return (
    <nav className="nav">
      <div className="nav-inner container">
        <div className="nav-brand">
          <Logo />
        </div>

        <div className="nav-links">
          {TABS.map(t => (
            <span
              key={t.id}
              className={`nav-link${activeTab === t.id ? ' is-active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </span>
          ))}
        </div>

        <div className="nav-right">
          <SymbolToggle symbol={symbol} onChange={onSymbolChange} />
          <ETClock />
          {liveData?.price != null && (
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '-0.01em' }}>
              {cfg.label} {N(liveData.price)}
            </span>
          )}
          <FreshnessPill lastUpdated={liveData?.lastUpdated} hasPrice={isLive} symbol={symbol} />
        </div>
      </div>

      <div className="nav-tabs-mobile">
        <div className="nav-tabs-mobile-inner">
          {TABS.map(t => (
            <span
              key={t.id}
              className={`nav-link${activeTab === t.id ? ' is-active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </nav>
  )
}
