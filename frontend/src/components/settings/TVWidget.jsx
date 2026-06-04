import React, { useEffect, useRef, useState } from 'react'
import { symbolCfg } from '../../config/symbols'

export default function TVWidget({ symbol: activeSymbol = 'ES' }) {
  const containerRef = useRef(null)
  const [symbol, setSymbol] = useState(() => symbolCfg(activeSymbol).tvSymbol)
  const [interval, setInterval] = useState('60')

  // Follow the global ES|NQ toggle (the user can still override via the chart's own dropdown).
  useEffect(() => {
    setSymbol(symbolCfg(activeSymbol).tvSymbol)
  }, [activeSymbol])

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    containerRef.current.innerHTML = ''

    const container = document.createElement('div')
    container.id = 'tv-widget-container'
    container.style.height = '100%'
    containerRef.current.appendChild(container)

    const initWidget = () => {
      if (cancelled) return
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval,
          container_id: 'tv-widget-container',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#161b22',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
        })
      }
    }

    if (window.TradingView) {
      // Library already loaded — initialize immediately
      initWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      containerRef.current.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [symbol, interval])

  return (
    <div className="card" style={{ marginBottom: '14px' }}>
      <div className="card-hdr">
        <span className="card-title">TradingView Live Chart</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="sinput"
            style={{ width: 'auto', padding: '4px 8px' }}
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
          >
            <option value="CME_MINI:ES1!">ES Futures (ES1!)</option>
            <option value="CME_MINI:NQ1!">NQ Futures (NQ1!)</option>
            <option value="CBOE:VIX">VIX Index</option>
            <option value="TVC:DXY">DXY Dollar Index</option>
            <option value="TVC:TNX">10Y Yield (TNX)</option>
          </select>
          <select
            className="sinput"
            style={{ width: 'auto', padding: '4px 8px' }}
            value={interval}
            onChange={e => setInterval(e.target.value)}
          >
            <option value="5">5m</option>
            <option value="15">15m</option>
            <option value="60">1H</option>
            <option value="240">4H</option>
            <option value="D">Daily</option>
            <option value="W">Weekly</option>
          </select>
        </div>
      </div>
      <div style={{ padding: 0, height: '500px' }} ref={containerRef} />
    </div>
  )
}
