import React from 'react'
import { usePrep } from '../../hooks/usePrep'
import KeyLevelsCard from './KeyLevelsCard'
import GapCard from './GapCard'
import SessionTimerCard from './SessionTimerCard'
import RangeContextCard from './RangeContextCard'
import OpeningRangeCard from './OpeningRangeCard'
import VWAPContextCard from './VWAPContextCard'
import InventorySignalCard from './InventorySignalCard'

export default function PrepTab({ liveData, economicEvents, symbol = 'ES' }) {
  const { levels, loading } = usePrep(symbol)

  const showOpeningRange = levels?.or5_high != null || levels?.or15_high != null || levels?.session === 'RTH OPEN'

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Prep</span>
        <h2 className="h-section">Pre-Market <em>Prep</em></h2>
      </div>

      <div className="reveal r-1" style={{ marginBottom: 'var(--gap)' }}>
        <SessionTimerCard
          session={levels?.session}
          secondsToRth={levels?.seconds_to_rth}
        />
      </div>

      <div className="reveal r-2" style={{ marginBottom: 'var(--gap)' }}>
        <InventorySignalCard
          inventorySignal={levels?.inventory_signal}
          inventoryDetail={levels?.inventory_detail}
          currentPrice={levels?.current_price ?? liveData?.price}
          pdc={levels?.pdc}
        />
      </div>

      <div className="grid g2 reveal r-3" style={{ marginBottom: 'var(--gap)' }}>
        <KeyLevelsCard
          pdh={levels?.pdh} pdl={levels?.pdl} pdc={levels?.pdc}
          globexHigh={levels?.globex_high} globexLow={levels?.globex_low}
          globexOpen={levels?.globex_open}
          weeklyOpen={levels?.weekly_open} monthlyOpen={levels?.monthly_open}
          roundAbove1={levels?.round_above_1} roundAbove2={levels?.round_above_2}
          roundBelow1={levels?.round_below_1} roundBelow2={levels?.round_below_2}
          currentPrice={levels?.current_price ?? liveData?.price}
          pwh={levels?.pwh} pwl={levels?.pwl}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <GapCard
            gapPts={levels?.gap_pts} gapPct={levels?.gap_pct}
            gapDir={levels?.gap_dir} pdc={levels?.pdc}
            rthOpen={levels?.rth_open}
          />
          <RangeContextCard
            rthHigh={levels?.rth_high} rthLow={levels?.rth_low}
            currentPrice={levels?.current_price ?? liveData?.price}
            currentAtr={levels?.current_atr ?? liveData?.atr}
            priceVsPdrange={levels?.price_vs_pdrange}
            rangeUsedPts={levels?.range_used_pts}
            rangePctOfAtr={levels?.range_pct_of_atr}
            pdh={levels?.pdh} pdl={levels?.pdl}
            atrTargetBull1={levels?.atr_target_bull_1}
            atrTargetBull2={levels?.atr_target_bull_2}
            atrTargetBear1={levels?.atr_target_bear_1}
            atrTargetBear2={levels?.atr_target_bear_2}
            priceVsAtrBand={levels?.price_vs_atr_band}
          />
        </div>
      </div>

      {showOpeningRange && (
        <div className="reveal r-4" style={{ marginBottom: 'var(--gap)' }}>
          <OpeningRangeCard
            or5High={levels?.or5_high} or5Low={levels?.or5_low}
            or5Sealed={levels?.or5_sealed ?? false}
            or15High={levels?.or15_high} or15Low={levels?.or15_low}
            or15Sealed={levels?.or15_sealed ?? false}
            currentPrice={levels?.current_price ?? liveData?.price}
            priceVsOr5={levels?.price_vs_or5}
            priceVsOr15={levels?.price_vs_or15}
          />
        </div>
      )}

      <div className="reveal r-5" style={{ marginBottom: 'var(--gap)' }}>
        <VWAPContextCard
          vwapDaily={levels?.vwap_daily} vwapWeekly={levels?.vwap_weekly}
          vwapMonthly={levels?.vwap_monthly} vwapQuarterly={levels?.vwap_quarterly}
          vwapYearly={levels?.vwap_yearly} vwapPosture={levels?.vwap_posture}
          vwapDailyVsRange={levels?.vwap_daily_vs_range}
          vwapWeeklyVsRange={levels?.vwap_weekly_vs_range}
          vwapMonthlyVsRange={levels?.vwap_monthly_vs_range}
          currentPrice={levels?.current_price ?? liveData?.price}
        />
      </div>

      {/* Today's economic events */}
      {economicEvents?.filter(e => e.days_away === 0).length > 0 && (
        <div className="card reveal r-6">
          <div className="card-hdr"><span className="card-title">Today's Risk Events</span></div>
          <div className="card-body">
            {economicEvents.filter(e => e.days_away === 0).map((e, i) => (
              <div key={i} className="kv-row">
                <span className="kv-key">{e.event_name}</span>
                <span className="kv-val tone-gold">{e.event_time || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
