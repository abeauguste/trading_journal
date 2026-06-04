import React from 'react'
import MomentumMatrix from './MomentumMatrix'
import PostureChart from './PostureChart'
import { useWeeks } from '../../hooks/useWeeks'

export default function MomentumTab({ week }) {
  const { weeks } = useWeeks()

  return (
    <div>
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-hdr">
          <span className="card-title">Multi-Timeframe Momentum Matrix</span>
          {week && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{week.sheet}</span>}
        </div>
        <div className="card-body">
          <MomentumMatrix week={week} />
        </div>
      </div>
      <div className="card">
        <div className="card-hdr"><span className="card-title">Weekly Posture History</span></div>
        <div className="card-body">
          <div className="chart-wrap" style={{ height: '230px' }}>
            <PostureChart allWeeks={weeks} />
          </div>
        </div>
      </div>
    </div>
  )
}
