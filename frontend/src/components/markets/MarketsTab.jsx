import React from 'react'
import { useMarkets } from '../../hooks/useMarkets'
import RegimeSynthesisCard from './RegimeSynthesisCard'
import VixRegimeCard from './VixRegimeCard'
import SqueezeCard from './SqueezeCard'
import WeeklyRangeCard from './WeeklyRangeCard'
import VwapStackCard from './VwapStackCard'
import AtrRegimeCard from './AtrRegimeCard'
import EventsThisWeekCard from './EventsThisWeekCard'

export default function MarketsTab({ liveData, economicEvents, symbol = 'ES' }) {
  const { regime, loading } = useMarkets(symbol)

  if (loading && !regime) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-3)' }}>Loading market regime…</div>
  )

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Markets</span>
        <h2 className="h-section">Regime <em>Overview</em></h2>
      </div>

      {/* Tier 1: Regime synthesis — full width */}
      <RegimeSynthesisCard regime={regime} liveData={liveData} />

      {/* Tier 1 continued: VIX + Squeeze + Weekly Range */}
      <div className="grid g3" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card reveal r-2">
          <div className="card-hdr">
            <span className="card-title">VIX Regime</span>
            {liveData?.vix != null && <span className="pill pill-live">LIVE</span>}
          </div>
          <div className="card-body">
            <VixRegimeCard vix={liveData?.vix} regime={regime?.vix} />
          </div>
        </div>
        <div className="card reveal r-2">
          <div className="card-hdr">
            <span className="card-title">TTM Squeeze · Wave A</span>
          </div>
          <div className="card-body">
            <SqueezeCard squeeze={liveData?.squeeze} momentumData={regime?.momentum} />
          </div>
        </div>
        <div className="card reveal r-2">
          <div className="card-hdr">
            <span className="card-title">Weekly Range Projection</span>
          </div>
          <div className="card-body">
            <WeeklyRangeCard weeklyRange={regime?.es_weekly_range} livePrice={liveData?.price} />
          </div>
        </div>
      </div>

      {/* Tier 2: VWAP Stack + ATR Regime */}
      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <VwapStackCard vwapAnalysis={liveData?.vwapAnalysis} />
        <AtrRegimeCard atrRegime={regime?.atr_regime} />
      </div>

      {/* Tier 3: High-impact events this week */}
      <EventsThisWeekCard economicEvents={economicEvents} />
    </div>
  )
}
