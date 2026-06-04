import { useState, useEffect, useCallback } from 'react'
import { getPrepLevels } from '../api'

export function usePrep(symbol = 'ES') {
  const [levels, setLevels] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLevels = useCallback(() => {
    getPrepLevels(symbol).then(d => { setLevels(d); setLoading(false) }).catch(() => setLoading(false))
  }, [symbol])

  useEffect(() => {
    setLevels(null)
    setLoading(true)
    fetchLevels()
    const id = setInterval(fetchLevels, 60000)
    return () => clearInterval(id)
  }, [fetchLevels])

  // Also listen for prepUpdate WebSocket events — only for this instrument.
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.symbol && e.detail.symbol !== symbol) return
      fetchLevels()
    }
    window.addEventListener('prepUpdate', handler)
    return () => window.removeEventListener('prepUpdate', handler)
  }, [fetchLevels, symbol])

  return { levels, loading, refresh: fetchLevels }
}
