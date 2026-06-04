import { useState, useEffect, useCallback } from 'react'
import { getMarketsRegime } from '../api'

export function useMarkets(symbol = 'ES') {
  const [regime, setRegime] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRegime = useCallback(async () => {
    try {
      const data = await getMarketsRegime(symbol)
      setRegime(data)
    } catch {}
    finally { setLoading(false) }
  }, [symbol])

  useEffect(() => {
    setRegime(null)
    fetchRegime()
    const id = setInterval(fetchRegime, 60_000)
    return () => clearInterval(id)
  }, [fetchRegime])

  return { regime, loading }
}
