import { useState, useEffect, useCallback } from 'react'
import { getCurrentForecast, generateForecast } from '../api'

export function useForecast(symbol = 'ES') {
  const [forecast, setForecast] = useState(null)
  const [dailyForecasts, setDailyForecasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fallback, setFallback] = useState(false)

  const fetchForecast = useCallback(async () => {
    try {
      const data = await getCurrentForecast(symbol)
      setForecast(data.forecast || null)
      setDailyForecasts(data.daily || [])
      setFallback(data.fallback || false)
    } catch {
      setFallback(true)
    } finally {
      setLoading(false)
    }
  }, [symbol])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await generateForecast(symbol)
      await fetchForecast()
    } catch (err) {
      setLoading(false)
      throw err
    }
  }, [fetchForecast, symbol])

  useEffect(() => {
    // Reset stale instrument state on symbol change.
    setForecast(null)
    setDailyForecasts([])
    setLoading(true)
    fetchForecast()
    const id = setInterval(fetchForecast, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchForecast])

  // Re-fetch immediately when useLiveData's WebSocket dispatches a forecastUpdated event
  // — but only for this instrument.
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.symbol && e.detail.symbol !== symbol) return
      fetchForecast()
    }
    window.addEventListener('forecastUpdated', handler)
    return () => window.removeEventListener('forecastUpdated', handler)
  }, [fetchForecast, symbol])

  return { forecast, dailyForecasts, loading, fallback, refresh }
}
