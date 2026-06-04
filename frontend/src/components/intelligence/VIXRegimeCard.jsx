import React from 'react'
import { N } from '../../utils/format'
import { getVixRegime } from '../../utils/vixRegime'

export default function VIXRegimeCard({ liveData, week }) {
  const vix = liveData?.vix ?? week?.weekly?.vix_weekly_proj_price?.value
  const { regime, label, color } = getVixRegime(vix)
  const isLive = !!liveData?.vix
  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">VIX Regime</span>
        {isLive ? <span className="tag tag-live">LIVE</span> : <span className="tag tag-manual">PLAN</span>}
      </div>
      <div className="card-body">
        <div style={{textAlign:'center',padding:'12px 0'}}>
          <div style={{fontSize:'36px',fontWeight:'700',fontFamily:'var(--mono)',color}}>{vix != null ? N(vix,2) : '—'}</div>
          <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>VIX Index</div>
          <div style={{marginTop:'10px',fontSize:'12px',color,fontWeight:'600'}}>{regime}</div>
          <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'4px',lineHeight:1.5}}>{label}</div>
        </div>
      </div>
    </div>
  )
}
