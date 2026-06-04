import React from 'react'
import { usePrep } from '../../hooks/usePrep'
import KeyLevelsCard from './KeyLevelsCard'
import GapCard from './GapCard'
import SessionTimerCard from './SessionTimerCard'
import RangeContextCard from './RangeContextCard'

export default function PrepTab({ liveData, economicEvents }) {
  const { levels, loading } = usePrep()

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

      <div className="grid g2 reveal r-2" style={{ marginBottom: 'var(--gap)' }}>
        <KeyLevelsCard
          pdh={levels?.pdh} pdl={levels?.pdl} pdc={levels?.pdc}
          globexHigh={levels?.globex_high} globexLow={levels?.globex_low}
          globexOpen={levels?.globex_open}
          weeklyOpen={levels?.weekly_open} monthlyOpen={levels?.monthly_open}
          roundAbove1={levels?.round_above_1} roundAbove2={levels?.round_above_2}
          roundBelow1={levels?.round_below_1} roundBelow2={levels?.round_below_2}
          currentPrice={levels?.current_price ?? liveData?.price}
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
          />
        </div>
      </div>

      {/* Today's economic events */}
      {economicEvents?.filter(e => e.days_away === 0).length > 0 && (
        <div className="card reveal r-3">
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
