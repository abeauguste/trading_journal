import { useState, useEffect, useRef } from 'react'
import { getLive, setLive, clearLive, getIntelligence } from '../api'

function buildInitialLive() {
  return {
    price: null, vix: null, source: null,
    atr: null, squeeze: null, ticker: null,
    wave_a: null, prev_wave_a: null,   // TTM Squeeze histogram (ttm_wave_a)
    wave_b: null, prev_wave_b: null,   // TTM Wave A histogram (ttm_wave_b)
    vwap: null, vwap_weekly: null, vwap_monthly: null, vwap_quarterly: null, vwap_yearly: null,
    open: null, high: null, low: null, volume: null, tv_time: null,
    lastUpdated: null,
    atrRegime: null, vwapAnalysis: null, momentumSummary: null, weeklyPlan: null,
    dayType: null,
  }
}

export function useLiveData(symbol = 'ES') {
  const [liveData, setLiveData] = useState(buildInitialLive)
  const wsRef = useRef(null)

  useEffect(() => {
    // Reset to empty shape immediately so stale values never render under a new instrument.
    setLiveData(buildInitialLive())

    getLive(symbol).then(data => setLiveData(prev => ({
      ...prev, ...data,
      vwap: data.vwap_daily ?? prev.vwap,
      atr: data.atr ?? prev.atr,
      wave_a: data.ttm_wave_a ?? prev.wave_a,
      wave_b: data.ttm_wave_b ?? prev.wave_b,
      high: data.es_high ?? prev.high,
      low: data.es_low ?? prev.low,
      // Seed freshness from the server's last es_price write so a reload with no live
      // WS traffic still shows the true data age (not the page-load time).
      lastUpdated: data.updated_at ? new Date(data.updated_at) : prev.lastUpdated,
    }))).catch(() => {})
    getIntelligence(symbol).then(data => {
      if (data?.report) {
        setLiveData(prev => ({
          ...prev,
          atrRegime: data.report.atr_regime || null,
          vwapAnalysis: data.report.vwap_posture || null,
          momentumSummary: data.report.momentum
            ? [{
                timeframe: 'Live',
                signal: data.report.momentum.signal,
                squeeze_state: data.report.momentum.squeeze_state,
                histogram: data.report.momentum.histogram ?? null,
                wave_a: data.report.momentum.wave_a ?? null,
              }]
            : null,
        }))
      }
    }).catch(() => {})

    let reconnectTimer = null
    const connect = () => {
      try {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsHost  = import.meta.env.VITE_API_HOST || `${window.location.hostname}:8000`
        const ws = new WebSocket(`${wsProto}//${wsHost}/ws`)
        wsRef.current = ws
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            // LINCHPIN: drop instrument-scoped messages for a different symbol.
            // Legacy/global messages (no symbol) always pass through.
            if (msg.symbol && msg.symbol !== symbol) return
            if (msg.type === 'price_update') {
              setLiveData(prev => ({
                ...prev,
                price: msg.price ?? prev.price,
                vix: msg.vix ?? prev.vix,
                source: msg.source ?? prev.source,
                atr: msg.atr ?? prev.atr, squeeze: msg.squeeze ?? prev.squeeze,
                ticker: msg.ticker ?? prev.ticker,
                wave_a: msg.ttm_wave_a ?? prev.wave_a,
                prev_wave_a: msg.ttm_wave_a != null ? prev.wave_a : prev.prev_wave_a,
                wave_b: msg.ttm_wave_b ?? prev.wave_b,
                prev_wave_b: msg.ttm_wave_b != null ? prev.wave_b : prev.prev_wave_b,
                vwap: msg.vwap ?? prev.vwap,
                vwap_weekly: msg.vwap_weekly ?? prev.vwap_weekly,
                vwap_monthly: msg.vwap_monthly ?? prev.vwap_monthly,
                vwap_quarterly: msg.vwap_quarterly ?? prev.vwap_quarterly,
                vwap_yearly: msg.vwap_yearly ?? prev.vwap_yearly,
                open: msg.open ?? prev.open, high: msg.high ?? prev.high,
                low: msg.low ?? prev.low, volume: msg.volume ?? prev.volume,
                tv_time: msg.tv_time ?? prev.tv_time, lastUpdated: new Date(),
              }))
              window.dispatchEvent(new CustomEvent('prepUpdate', { detail: { symbol } }))
            } else if (msg.type === 'forecast_updated') {
              window.dispatchEvent(new CustomEvent('forecastUpdated', { detail: { symbol: msg.symbol || symbol } }))
            } else if (msg.type === 'intelligence_update') {
              setLiveData(prev => ({
                ...prev,
                atrRegime: msg.atr_regime || prev.atrRegime,
                vwapAnalysis: msg.vwap_analysis || prev.vwapAnalysis,  // now contains full vwap_posture structure
                momentumSummary: msg.momentum_summary || prev.momentumSummary,
                weeklyPlan: msg.weekly_plan || prev.weeklyPlan,
                dayType: msg.day_type || prev.dayType,
              }))
            }
          } catch {}
        }
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000) }
        ws.onerror = () => {}
      } catch {}
    }
    connect()
    // Clear any pending reconnect so a stale-symbol socket can't resurrect after a toggle.
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
    }
  }, [symbol])

  const updateLive = async (price, vix) => {
    try { const data = await setLive({ price, vix }, symbol); setLiveData(prev => ({ ...prev, ...data })) } catch {}
  }
  const resetLive = async () => {
    try { await clearLive(symbol); setLiveData(prev => ({ ...prev, price: null, vix: null, source: null })) } catch {}
  }
  return { liveData, updateLive, resetLive }
}
