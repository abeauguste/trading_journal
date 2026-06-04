import React, { useState, useEffect } from 'react'
import Ticker from './Ticker'
import { symbolCfg } from '../../config/symbols'

function ETClock({ symbol }) {
  const cfg = symbolCfg(symbol)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/New_York',
  })
  const dayStr = now.toLocaleDateString('en-US', {
    weekday: 'short', day: '2-digit', month: 'short',
    timeZone: 'America/New_York',
  }).toUpperCase()

  const monthCode = now.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' }).toUpperCase()
  const year2     = String(now.getFullYear()).slice(-2)
  const contract  = `${monthCode}${year2}`

  return (
    <span className="eyebrow reveal r-1">
      <span className="dot" />
      {cfg.code} · {contract} · {timeStr} ET · {dayStr}
    </span>
  )
}

export default function Hero({ liveData, symbol = 'ES' }) {
  const cfg = symbolCfg(symbol)
  const now = new Date()
  const dayStr = now.toLocaleDateString('en-US', {
    weekday: 'short', day: '2-digit', month: 'short',
    timeZone: 'America/New_York',
  }).toUpperCase()

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-text">
          <ETClock symbol={symbol} />
          <h1 className="h-display reveal r-2">
            An operating system<br />
            for <em>disciplined</em><br />
            capital.
          </h1>
          <div className="hero-meta reveal r-3">
            <span>STRATEGY <span className="dim">·</span> {cfg.code} futures</span>
            <span>HORIZON <span className="dim">·</span> 1–10 sessions</span>
            <span>SESSION <span className="dim">·</span> RTH · {dayStr}</span>
          </div>
        </div>
        <div className="hero-aside reveal r-3">
          <Ticker liveData={liveData} symbol={symbol} />
        </div>
      </div>
    </section>
  )
}
