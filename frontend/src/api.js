import axios from 'axios'

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE ?? '/api' })

// symbol query helper — '?symbol=ES' when a symbol is provided, else ''
const sq = (s) => (s ? `?symbol=${s}` : '')

export const getWeeks = () => client.get('/weeks').then(r => r.data)
export const getLatestWeek = () => client.get('/weeks/latest').then(r => r.data)
export const getWeek = (id) => client.get(`/weeks/${id}`).then(r => r.data)
export const getHistorical = (symbol) => client.get(`/historical${sq(symbol)}`).then(r => r.data)
export const getLive = (symbol) => client.get(`/live${sq(symbol)}`).then(r => r.data)
export const setLive = (data, symbol) => client.post(`/live${sq(symbol)}`, data).then(r => r.data)
export const clearLive = (symbol) => client.delete(`/live${sq(symbol)}`).then(r => r.data)
export const getWebhookEvents = (limit = 50, offset = 0) =>
  client.get(`/webhook/events?limit=${limit}&offset=${offset}`).then(r => r.data)
export const sendTestWebhook = (data) => client.post('/webhook/es', data).then(r => r.data)
export const sendTestWebhookNq = (data) => client.post('/webhook/nq', data).then(r => r.data)
export const getIntelligence = (symbol) => client.get(`/intelligence/latest${sq(symbol)}`).then(r => r.data)
export const getEconomicCalendar = (daysAhead=14) => client.get(`/calendar/economic?days_ahead=${daysAhead}`).then(r => r.data)
export const getEarningsCalendar = () => client.get('/calendar/earnings').then(r => r.data)
export const generateIntelligence = (symbol) => client.post(`/intelligence/generate${sq(symbol)}`).then(r => r.data)
export const refreshCalendars = () => client.post('/calendar/refresh').then(r => r.data)
export const getCurrentForecast = (symbol) => client.get(`/forecast/current${sq(symbol)}`).then(r => r.data)
export const generateForecast = (symbol) => client.post(`/forecast/generate${sq(symbol)}`).then(r => r.data)
export const getMarketsRegime = (symbol) => client.get(`/markets/regime${sq(symbol)}`).then(r => r.data)
export const getMarketNews = (hoursAgo = 168, minScore = 7, limit = 50) =>
  client.get(`/news/market-moving?hours_ago=${hoursAgo}&min_score=${minScore}&limit=${limit}`).then(r => r.data)
export const refreshNews = () => client.post('/news/refresh').then(r => r.data)

// --- Journal ---
export const JOURNAL_PAGE_SIZE = 25

export const importTrades = (trades) =>
  client.post('/journal/trades/import', trades).then(r => r.data)

export const getTrades = (filters = {}, page = 1) => {
  const p = new URLSearchParams({ page, page_size: JOURNAL_PAGE_SIZE })
  if (filters.symbol)       p.set('symbol', filters.symbol)
  if (filters.positionType) p.set('position_type', filters.positionType)
  if (filters.dateFrom)     p.set('date_from', filters.dateFrom)
  if (filters.dateTo)       p.set('date_to', filters.dateTo)
  if (filters.minScore)     p.set('min_score', filters.minScore)
  return client.get(`/journal/trades?${p}`).then(r => r.data)
}

// Fetch all trades for charts (no pagination — large page_size, capped at backend le=2000)
export const getAllTradesForCharts = (filters = {}) => {
  const p = new URLSearchParams({ page: 1, page_size: 2000 })
  if (filters.symbol)       p.set('symbol', filters.symbol)
  if (filters.positionType) p.set('position_type', filters.positionType)
  if (filters.dateFrom)     p.set('date_from', filters.dateFrom)
  if (filters.dateTo)       p.set('date_to', filters.dateTo)
  if (filters.minScore)     p.set('min_score', filters.minScore)
  return client.get(`/journal/trades?${p}`).then(r => r.data)
}

export const getJournalStats = (filters = {}) => {
  const p = new URLSearchParams()
  if (filters.symbol)       p.set('symbol', filters.symbol)
  if (filters.positionType) p.set('position_type', filters.positionType)
  if (filters.dateFrom)     p.set('date_from', filters.dateFrom)
  if (filters.dateTo)       p.set('date_to', filters.dateTo)
  if (filters.minScore)     p.set('min_score', filters.minScore)  // fixed: was missing minScore
  return client.get(`/journal/stats?${p}`).then(r => r.data)
}

export const updateTradeAnnotations = (id, patch) =>
  client.patch(`/journal/trades/${id}`, patch).then(r => r.data)

export const deleteTrade = (id) =>
  client.delete(`/journal/trades/${id}`).then(r => r.data)

export const clearAllTrades = () =>
  client.delete('/journal/trades?confirm=true').then(r => r.data)

export const getPrepLevels = (symbol) => client.get(`/prep${sq(symbol)}`).then(r => r.data)
