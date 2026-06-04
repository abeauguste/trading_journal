import React from 'react'
import { symbolCfg } from '../../config/symbols'
import HistoricalChart from './HistoricalChart'
import HistoricalTable from './HistoricalTable'
import SeasonalityCard from './SeasonalityCard'
import SeasonCard from './SeasonCard'
import ContractCard from './ContractCard'
import VixHistoricalCard from './VixHistoricalCard'
import DayOfWeekCard from './DayOfWeekCard'
import EventWeekCard from './EventWeekCard'
import ForecastAccuracyCard from './ForecastAccuracyCard'

export default function HistoricalTab({ historical, allWeeks, liveData, symbol = 'ES' }) {
  const cfg = symbolCfg(symbol)
  const forecastRows = historical.filter(h => h.source === 'forecast')
  const hasLiveData  = forecastRows.length > 0

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Archive</span>
        <h2 className="h-section">Historical <em>Data</em></h2>
      </div>

      <div className="card reveal r-1" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">
            {cfg.code} Open Price —{' '}
            {hasLiveData
              ? `Last ${forecastRows.length} Forecast Week${forecastRows.length > 1 ? 's' : ''}`
              : '22-Week Archive'}{' '}
            with VWAP Layers
          </span>
          {hasLiveData && <span className="pill pill-bull">LIVE</span>}
        </div>
        <div className="card-body">
          <div className="chart-wrap" style={{ height: '300px' }}>
            <HistoricalChart historical={forecastRows} />
          </div>
        </div>
      </div>

      <SeasonalityCard />

      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <SeasonCard />
        <ContractCard />
      </div>

      {/* NEW: Tier 1 — VIX Regime + Day of Week */}
      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <VixHistoricalCard vixLevel={liveData?.vix} />
        <DayOfWeekCard />
      </div>

      {/* NEW: Tier 2 — Event Week Effects */}
      <EventWeekCard />

      {/* NEW: Tier 3 — Forecast Accuracy */}
      <ForecastAccuracyCard forecastRows={forecastRows} />

      {/* AI Forecast History — renumbered r-5 → r-8 */}
      <div className="card reveal r-8">
        <div className="card-hdr">
          <span className="card-title">AI Forecast History</span>
          {hasLiveData && <span className="pill pill-bull">Last {forecastRows.length} Week{forecastRows.length > 1 ? 's' : ''}</span>}
        </div>
        <div className="table-wrap">
          <HistoricalTable historical={forecastRows} mode="forecast" />
        </div>
      </div>
    </div>
  )
}
