export function getMarketSession(now = new Date()) {
  const et = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric',
    hour12: false, weekday: 'short',
  }).formatToParts(now)
  const parts = Object.fromEntries(et.map(p => [p.type, p.value]))
  const day = parts.weekday
  const h = parseInt(parts.hour)
  const m = parseInt(parts.minute)
  const totalMin = h * 60 + m
  if (day === 'Sat') return { is_open: false, session: 'closed', label: 'CLOSED' }
  if (day === 'Sun' && totalMin < 18 * 60) return { is_open: false, session: 'closed', label: 'CLOSED' }
  if (day === 'Fri' && totalMin >= 17 * 60) return { is_open: false, session: 'closed', label: 'CLOSED' }
  // 4:15-4:30 PM maintenance break
  if (totalMin >= 16 * 60 + 15 && totalMin < 16 * 60 + 30) return { is_open: false, session: 'break', label: 'BREAK' }
  // Pre-market 4:00-9:30
  if (totalMin >= 4 * 60 && totalMin < 9 * 60 + 30) return { is_open: true, session: 'pre', label: 'PRE-MARKET' }
  // Regular 9:30-4:00 PM
  if (totalMin >= 9 * 60 + 30 && totalMin < 16 * 60) return { is_open: true, session: 'regular', label: 'MARKET OPEN' }
  // After hours 4:30-5:00 PM ET (ES continues)
  return { is_open: true, session: 'extended', label: 'AFTER HOURS' }
}
