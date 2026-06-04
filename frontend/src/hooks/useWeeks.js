import { useState, useEffect } from 'react'
import { getWeeks } from '../api'

export function useWeeks() {
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeks()
      .then(data => {
        setWeeks(data.weeks || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { weeks, loading }
}
