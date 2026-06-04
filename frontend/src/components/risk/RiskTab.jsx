import React from 'react'
import RiskCalculator from './RiskCalculator'
import ATRStops from './ATRStops'
import AvoidZones from './AvoidZones'
import KellySizing from './KellySizing'
import PreTradeChecklist from './PreTradeChecklist'

export default function RiskTab({ week, liveData, economicEvents, journalStats }) {
  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Risk</span>
        <h2 className="h-section">Position <em>Sizing</em></h2>
      </div>

      {/* Row 1: Calculator + ATR Stops */}
      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hdr"><span className="card-title">Position Sizing Calculator</span></div>
          <div className="card-body">
            <RiskCalculator stats={journalStats} />
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">ATR-Based Stop Levels</span></div>
          <div className="card-body">
            <ATRStops week={week} liveData={liveData} />
          </div>
        </div>
      </div>

      {/* Row 2: Kelly Criterion (full width) */}
      <KellySizing journalStats={journalStats} />

      {/* Row 3: Pre-Trade Checklist (full width) */}
      <PreTradeChecklist liveData={liveData} economicEvents={economicEvents} journalStats={journalStats} />

      {/* Row 4: Avoidance Rules (full width) */}
      <div className="card">
        <div className="card-hdr"><span className="card-title">Trade Avoidance Rules</span></div>
        <div className="card-body">
          <AvoidZones journalStats={journalStats} />
        </div>
      </div>
    </div>
  )
}
