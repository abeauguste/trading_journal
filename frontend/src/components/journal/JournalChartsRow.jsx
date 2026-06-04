import React from 'react'
import EquityCurveChart from './EquityCurveChart'
import PnlByDayChart from './PnlByDayChart'
import SessionHeatmap from './SessionHeatmap'

export default function JournalChartsRow({ allTrades, trades, stats }) {
  return (
    <div className="grid g3 reveal r-4" style={{ marginBottom: 'var(--gap)' }}>
      {/* Equity Curve — uses full dataset (not paginated) */}
      <div className="card">
        <div className="card-hdr">
          <span className="card-title">Equity Curve</span>
        </div>
        <div className="card-body" style={{ paddingTop: '8px' }}>
          <EquityCurveChart trades={allTrades ?? trades} />
        </div>
      </div>

      {/* P&L by Day */}
      <div className="card">
        <div className="card-hdr">
          <span className="card-title">Avg P&L by Day</span>
        </div>
        <div className="card-body" style={{ paddingTop: '8px' }}>
          <PnlByDayChart byDayOfWeek={stats?.by_day_of_week} />
        </div>
      </div>

      {/* Session Win Rate */}
      <div className="card">
        <div className="card-hdr">
          <span className="card-title">Session Win Rate</span>
        </div>
        <div className="card-body" style={{ paddingTop: '8px' }}>
          <SessionHeatmap bySession={stats?.by_session} />
        </div>
      </div>
    </div>
  )
}
