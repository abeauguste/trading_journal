import React from 'react'
import Hero from './Hero'
import PostureStrip from './PostureStrip'
import MarketStatusBanner from './MarketStatusBanner'
import LiveVWAPCard from './LiveVWAPCard'
import ATRRegimeCard from './ATRRegimeCard'
import VIXRegimeCard from './VIXRegimeCard'
import MomentumSummaryCard from './MomentumSummaryCard'
import RiskCalendarCard from './RiskCalendarCard'
import WeeklyBriefingCard from './WeeklyBriefingCard'
import MarketCatalystsCard from './MarketCatalystsCard'
import DayTypeCard from './DayTypeCard'

export default function IntelligenceTab({ liveData, intelligence, economicEvents, earningsEvents, warnings, week, news = [], symbol = 'ES' }) {
  const vwapAnalysis    = liveData?.vwapAnalysis || intelligence?.vwap_posture
  const atrRegime       = liveData?.atrRegime    || intelligence?.atr_regime
  const momentumSummary = liveData?.momentumSummary ||
    (intelligence?.momentum ? [{ timeframe: 'Live', signal: intelligence.momentum.signal }] : null)
  const dayType = liveData?.dayType || intelligence?.day_type

  return (
    <div>
      <Hero liveData={liveData} symbol={symbol} />
      <PostureStrip
        liveData={liveData}
        intelligence={intelligence}
        atrRegime={atrRegime}
        vwapAnalysis={vwapAnalysis}
        symbol={symbol}
      />

      <div style={{ marginTop: 'var(--gap)' }}>
        <DayTypeCard dayType={dayType} />
        <MarketStatusBanner />
        <div className="grid g3" style={{ marginBottom: 'var(--gap)' }}>
          <LiveVWAPCard vwapAnalysis={vwapAnalysis} liveData={liveData} week={week} />
          <ATRRegimeCard atrRegime={atrRegime} liveData={liveData} />
          <VIXRegimeCard liveData={liveData} week={week} />
        </div>
        <div className="grid g21" style={{ marginBottom: 'var(--gap)' }}>
          <RiskCalendarCard economicEvents={economicEvents} earningsEvents={earningsEvents} warnings={warnings} />
          <MomentumSummaryCard momentumSummary={momentumSummary} liveData={liveData} />
        </div>
        <MarketCatalystsCard news={news} />
        <WeeklyBriefingCard intelligence={intelligence} liveData={liveData} week={week} />
      </div>
    </div>
  )
}
