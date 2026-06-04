import React, { useState, useEffect } from 'react'
import TVConnection from './TVConnection'
import ManualOverride from './ManualOverride'
import TVWidget from './TVWidget'
import IntegrationGuide from './IntegrationGuide'
import { getLive } from '../../api'

export default function SettingsTab({ liveData, symbol = 'ES', onUpdateLive, onResetLive, onShowToast }) {
  // ES live data comes from App (the active feed may be ES or NQ). We always show the
  // ES connection status from the ES feed and the NQ status from a dedicated fetch so
  // both webhook blocks reflect their real source independently.
  const [esLive, setEsLive] = useState(null)
  const [nqLive, setNqLive] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getLive('ES').then(d => { if (!cancelled) setEsLive(d) }).catch(() => {})
      getLive('NQ').then(d => { if (!cancelled) setNqLive(d) }).catch(() => {})
    }
    load()
    const id = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Prefer the live App-provided data for whichever symbol is active (freshest).
  const esData = symbol === 'ES' ? liveData : esLive
  const nqData = symbol === 'NQ' ? liveData : nqLive

  return (
    <div>
      <div className="section-hd">
        <span className="eyebrow"><span className="dot" />Auguste Capital · Configuration</span>
        <h2 className="h-section">Settings & <em>Integrations</em></h2>
      </div>

      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <TVConnection symbol="ES" liveData={esData} onShowToast={onShowToast} />
        <TVConnection symbol="NQ" liveData={nqData} onShowToast={onShowToast} />
      </div>

      <div className="grid g2" style={{ marginBottom: 'var(--gap)' }}>
        <TVConnection variant="vix" onShowToast={onShowToast} />
        <ManualOverride
          liveData={liveData}
          symbol={symbol}
          onUpdateLive={onUpdateLive}
          onResetLive={onResetLive}
          onShowToast={onShowToast}
        />
      </div>
      <TVWidget symbol={symbol} />
      <IntegrationGuide />
    </div>
  )
}
