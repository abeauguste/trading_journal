import { useState, useEffect } from 'react'
import { getIntelligence, getEconomicCalendar, getEarningsCalendar } from '../api'

export function useIntelligence(symbol = 'ES') {
  const [intelligence, setIntelligence] = useState(null)
  const [economicEvents, setEconomicEvents] = useState([])
  const [earningsEvents, setEarningsEvents] = useState([])
  const [warnings, setWarnings]             = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    // Reset instrument-scoped report immediately on symbol change.
    setIntelligence(null)
    const fetchAll = async () => {
      const [intRes, econRes, earnRes] = await Promise.allSettled([
        getIntelligence(symbol), getEconomicCalendar(), getEarningsCalendar(),
      ])
      if (intRes.status  === 'fulfilled' && intRes.value?.report)  setIntelligence(intRes.value.report)
      if (econRes.status === 'fulfilled') { setEconomicEvents(econRes.value.events || []); setWarnings(econRes.value.warnings || []) }
      if (earnRes.status === 'fulfilled') setEarningsEvents(earnRes.value.earnings || [])
      setLoading(false)
    }
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [symbol])

  return { intelligence, economicEvents, earningsEvents, warnings, loading }
}
