import { useState, useEffect, useCallback } from 'react'
import {
  getTrades, getAllTradesForCharts, getJournalStats, importTrades,
  updateTradeAnnotations, deleteTrade, clearAllTrades,
} from '../api'
import { processFiles, mapTradeToApi } from '../utils/aaProcessor'

export function useJournal() {
  const [trades,       setTrades]       = useState([])
  const [allTrades,    setAllTrades]    = useState([])  // full dataset for equity curve chart
  const [stats,        setStats]        = useState(null)
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [uploading,    setUploading]    = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle')  // idle | parsing | posting | done | error
  const [uploadDetail, setUploadDetail] = useState('')
  const [page,         setPage]         = useState(1)
  const [filters,      setFiltersState] = useState({
    symbol: '', positionType: '', dateFrom: '', dateTo: '', minScore: '',
  })

  const fetchAll = useCallback(async (f = filters, p = page) => {
    setLoading(true)
    try {
      const [tradesRes, allTradesRes, statsRes] = await Promise.all([
        getTrades(f, p),
        getAllTradesForCharts(f),
        getJournalStats(f),
      ])
      setTrades(tradesRes.trades || [])
      setTotal(tradesRes.total  || 0)
      setAllTrades(allTradesRes.trades || [])
      setStats(statsRes)
    } catch (err) {
      console.error('useJournal fetchAll:', err)
    } finally {
      setLoading(false)
    }
  }, [])  // intentionally stable — called with explicit args

  const setFilters = useCallback((newFilters) => {
    setPage(1)
    setFiltersState(newFilters)
  }, [])

  useEffect(() => { fetchAll(filters, page) }, [filters, page])

  const uploadTrades = useCallback(async (files) => {
    setUploading(true)
    setUploadStatus('parsing')
    setUploadDetail('')
    try {
      const { trades: processed, formatDetected, rawFillCount } = await processFiles(files)
      setUploadDetail(`${formatDetected} format — ${rawFillCount || processed.length} items found`)
      setUploadStatus('posting')
      const apiTrades = processed.map(mapTradeToApi)
      const result = await importTrades(apiTrades)
      setUploadStatus('done')
      setUploadDetail(
        `${result.inserted} trade${result.inserted !== 1 ? 's' : ''} imported` +
        ` — ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped`
      )
      await fetchAll(filters, 1)
      setPage(1)
      // Auto-reset to idle so the zone is usable again
      setTimeout(() => { setUploadStatus('idle'); setUploadDetail('') }, 4000)
    } catch (err) {
      setUploadStatus('error')
      setUploadDetail(err.message || 'Upload failed')
      throw err
    } finally {
      setUploading(false)
    }
  }, [filters, fetchAll])

  const updateTrade = useCallback(async (id, patch) => {
    await updateTradeAnnotations(id, patch)
    await fetchAll(filters, page)
  }, [filters, page, fetchAll])

  const handleDeleteTrade = useCallback(async (id) => {
    await deleteTrade(id)
    await fetchAll(filters, page)
  }, [filters, page, fetchAll])

  const clearAll = useCallback(async () => {
    await clearAllTrades()
    setPage(1)
    await fetchAll(filters, 1)
  }, [filters, fetchAll])

  return {
    trades, allTrades, stats, total, loading,
    uploading, uploadStatus, uploadDetail,
    filters, setFilters,
    uploadTrades, updateTrade,
    deleteTrade: handleDeleteTrade,
    clearAll,
    page, setPage,
  }
}
