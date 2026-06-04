import React from 'react'
import VixPosture from './VixPosture'
import VixAnalysis from './VixAnalysis'
import VixChart from './VixChart'

export default function VixTab({ week, allWeeks }) {
  return (
    <div>
      <div className="grid g2" style={{ marginBottom: '14px' }}>
        <div className="card">
          <div className="card-hdr"><span className="card-title">VIX Posture & Projections</span></div>
          <div className="card-body">
            <VixPosture week={week} />
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">VIX Regime Analysis</span></div>
          <div className="card-body">
            <VixAnalysis week={week} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-hdr"><span className="card-title">VIX Projected Levels — Historical</span></div>
        <div className="card-body">
          <div className="chart-wrap" style={{ height: '240px' }}>
            <VixChart allWeeks={allWeeks} />
          </div>
        </div>
      </div>
    </div>
  )
}
