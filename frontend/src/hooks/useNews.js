import { useState, useEffect, useCallback } from 'react'
import { getMarketNews, refreshNews as apiRefreshNews } from '../api'

export function useNews(pollInterval = 300000) {
  const [news, setNews]     = useState([])
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf]     = useState(null)

  const fetchNews = useCallback(async () => {
    try {
      const data = await getMarketNews()
      setNews(data.items || [])
      setAsOf(data.as_of || null)
    } catch {
      // non-fatal — keep stale data
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      await apiRefreshNews()
      await fetchNews()
    } catch {
      // non-fatal
    }
  }, [fetchNews])

  useEffect(() => {
    fetchNews()
    const id = setInterval(fetchNews, pollInterval)
    return () => clearInterval(id)
  }, [fetchNews, pollInterval])

  return { news, loading, asOf, refresh }
}
