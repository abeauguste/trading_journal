import React, { useState } from 'react'
import { useJournal } from '../../hooks/useJournal'
import UploadZone from './UploadZone'
import JournalScorecard from './JournalScorecard'
import JournalFilters from './JournalFilters'
import JournalChartsRow from './JournalChartsRow'
import TradeTable from './TradeTable'
import HourDayHeatmap from './HourDayHeatmap'
import SessionPerformanceTable from './SessionPerformanceTable'
import RiskBehaviorPanel from './RiskBehaviorPanel'
import KpiLibrary from './KpiLibrary'
import TradeCoachPanel from './TradeCoachPanel'
import TraderScorecard from './TraderScorecard'
import PerformanceAttributionCard from './PerformanceAttributionCard'

export default function JournalTab({ onShowToast }) {
  const {
    trades, allTrades, stats, total, loading,
    uploading, uploadStatus, uploadDetail,
    filters, setFilters,
    uploadTrades, updateTrade, deleteTrade, clearAll,
    page, setPage,
  } = useJournal()

  const [tradeCompact, setTradeCompact] = useState(true)

  const handleUpload = async (files) => {
    try {
      await uploadTrades(files)
    } catch (err) {
      if (onShowToast) onShowToast('Upload failed: ' + err.message)
    }
  }

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow">
          <span className="dot" />Auguste Capital · Journal
        </span>
        <h2 className="h-section">Trade <em>Review</em></h2>
      </div>

      {/* Import card */}
      <div className="card reveal r-1" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">Import Trades</span>
          {stats && stats.total_trades > 0 && (
            <span className="eyebrow" style={{ color: 'var(--text-3)' }}>
              {stats.total_trades} trades in journal
            </span>
          )}
        </div>
        <div className="card-body">
          <UploadZone
            onUpload={handleUpload}
            uploading={uploading}
            uploadStatus={uploadStatus}
            uploadDetail={uploadDetail}
          />
        </div>
      </div>

      {/* Trader Scorecard */}
      <TraderScorecard stats={stats} />

      {/* KPI scorecard */}
      <JournalScorecard stats={stats} loading={loading} />

      {/* Filters */}
      <JournalFilters filters={filters} onChange={setFilters} />

      {/* Charts */}
      {(trades.length > 0 || loading) && (
        <JournalChartsRow allTrades={allTrades} trades={trades} stats={stats} />
      )}

      {stats && stats.total_trades > 0 && (
        <HourDayHeatmap byHourDay={stats.by_hour_day} />
      )}
      {stats && stats.total_trades > 0 && (
        <SessionPerformanceTable bySession={stats.by_session} />
      )}
      {stats && stats.total_trades > 0 && (
        <RiskBehaviorPanel stats={stats} />
      )}
      {stats && stats.total_trades > 0 && (
        <KpiLibrary stats={stats} allTrades={allTrades} />
      )}
      {stats && stats.total_trades > 0 && <PerformanceAttributionCard stats={stats} />}
      {stats && stats.total_trades >= 5 && (
        <TradeCoachPanel
          stats={stats}
          allTrades={allTrades}
          byHourDay={stats.by_hour_day || {}}
        />
      )}

      {/* Trade log table */}
      <div className="card reveal r-5">
        <div className="card-hdr">
          <span className="card-title">Trade Log</span>
          {stats && stats.total_trades > 0 && (
            <>
              <button
                style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-2)', cursor: 'pointer', marginRight: '8px',
                }}
                onClick={() => setTradeCompact(c => !c)}
              >
                {tradeCompact ? 'Show all' : 'Compact'}
              </button>
              <button
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--bear)',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (window.confirm('Delete all trades? This cannot be undone.')) clearAll()
                }}
              >
                Clear All
              </button>
            </>
          )}
        </div>
        <TradeTable
          trades={trades}
          total={total}
          page={page}
          onPageChange={setPage}
          onUpdateTrade={updateTrade}
          onDeleteTrade={deleteTrade}
          loading={loading}
          compact={tradeCompact}
          onToggleCompact={() => setTradeCompact(c => !c)}
        />
      </div>
    </div>
  )
}
