export const N = (v, d = 2) =>
  v != null ? Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'

export const D = (v) =>
  v != null ? (v >= 0 ? '+' : '') + N(v) : '—'

export function postureClass(p) {
  if (!p) return ''
  const s = p.toLowerCase()
  if (s.includes('strong buy')) return 'posture-strong-buy'
  if (s.includes('moderate buy') || (s.includes('buy') && !s.includes('weak'))) return 'posture-buy'
  if (s.includes('weak buy')) return 'posture-weak-buy'
  if (s.includes('neutral')) return 'posture-neutral'
  if (s.includes('weak sell')) return 'posture-weak-sell'
  if (s.includes('moderate sell') || (s.includes('sell') && !s.includes('weak'))) return 'posture-sell'
  if (s.includes('strong sell')) return 'posture-strong-sell'
  return ''
}

export function momClass(m) {
  if (!m) return ''
  const s = m.toLowerCase()
  if (s.includes('fast up') || s.includes('↑↑')) return 'm-fast-up'
  if (s.includes('slow up') || s.includes('↑')) return 'm-slow-up'
  if (s.includes('fast down') || s.includes('↓↓')) return 'm-fast-down'
  if (s.includes('slow down') || s.includes('↓')) return 'm-slow-down'
  return 'm-neutral'
}

export function momArrow(m) {
  if (!m) return '—'
  const s = m.toLowerCase()
  if (s.includes('fast up') || s.includes('↑↑')) return '↑↑'
  if (s.includes('slow up') || s.includes('↑')) return '↑'
  if (s.includes('fast down') || s.includes('↓↓')) return '↓↓'
  if (s.includes('slow down') || s.includes('↓')) return '↓'
  return '—'
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function postureScore(p) {
  if (!p) return 0
  const s = p.toLowerCase()
  if (s.includes('strong buy')) return 3
  if (s.includes('moderate buy')) return 2
  if (s.includes('weak buy')) return 1
  if (s.includes('neutral')) return 0
  if (s.includes('weak sell')) return -1
  if (s.includes('moderate sell')) return -2
  if (s.includes('strong sell')) return -3
  return 0
}
