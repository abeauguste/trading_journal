import React from 'react'
import { N } from '../../utils/format'

export default function LiveVWAPCard({ vwapAnalysis, liveData, week }) {
  const price = liveData?.price
  // Live VWAP anchors from MULTITIMEFRAME_VWAP_MANOJ (plot_0 through plot_4).
  // Falls back to static plan data if webhook hasn't sent the value yet.
  const vwaps = [
    { label: 'VWAP Daily',     liveVal: liveData?.vwap,           planVal: week?.weekly?.vwap_daily?.value },
    { label: 'VWAP Weekly',    liveVal: liveData?.vwap_weekly,    planVal: week?.weekly?.vwap_weekly?.value },
    { label: 'VWAP Monthly',   liveVal: liveData?.vwap_monthly,   planVal: week?.weekly?.vwap_monthly?.value },
    { label: 'VWAP Quarterly', liveVal: liveData?.vwap_quarterly, planVal: week?.weekly?.vwap_quarterly?.value },
    { label: 'VWAP Yearly',    liveVal: liveData?.vwap_yearly,    planVal: week?.weekly?.vwap_yearly?.value },
  ]
  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Live VWAP Analysis</span></div>
      <div className="card-body">
        {!price && <div className="no-data-placeholder">Waiting for webhook data…</div>}
        {price && vwaps.map(({ label, liveVal, planVal }) => {
          const vwap = liveVal ?? planVal
          const isLive = liveVal != null
          const dist = vwap != null ? price - vwap : null
          const above = dist != null && dist >= 0
          return (
            <div key={label} className="vwap-live-row">
              <div>
                <div style={{fontSize:'11px',color:'var(--text2)'}}>{label}</div>
                {vwap != null && <div style={{fontSize:'10px',color:'var(--text3)',fontFamily:'var(--mono)'}}>{N(vwap)}</div>}
              </div>
              <div style={{textAlign:'right'}}>
                {dist != null ? (
                  <span className={above ? 'vwap-dir-up' : 'vwap-dir-down'}>
                    {above ? '↑' : '↓'} {N(Math.abs(dist))} pts
                  </span>
                ) : <span style={{color:'var(--text3)'}}>—</span>}
                {vwap != null && (
                  <span className={`vwap-source-badge tag ${isLive ? 'tag-live' : 'tag-manual'}`}>
                    {isLive ? 'LIVE' : 'PLAN'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
