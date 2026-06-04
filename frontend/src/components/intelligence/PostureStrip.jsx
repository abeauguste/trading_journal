import React from 'react'
import { N } from '../../utils/format'
import { getVixRegime } from '../../utils/vixRegime'
import { symbolCfg } from '../../config/symbols'

function Cell({ label, value, tone, sub }) {
  return (
    <div className="posture-cell">
      <span className="eyebrow">{label}</span>
      <div className={`posture-v${tone ? ' ' + tone : ''}`}>{value || '—'}</div>
      {sub && <div className="posture-d">{sub}</div>}
    </div>
  )
}

export default function PostureStrip({ liveData, intelligence, atrRegime, vwapAnalysis, symbol = 'ES' }) {
  const vix = liveData?.vix
  const { regime: vixRegime } = getVixRegime(vix)

  const rawPosture = vwapAnalysis?.summary || intelligence?.vwap_posture?.summary || ''
  const vwapLabel  = rawPosture ? rawPosture.split(' — ')[0] : '—'
  const vwapTone   = rawPosture.includes('BULL') ? 'tone-bull'
                   : rawPosture.includes('BEAR') ? 'tone-bear'
                   : 'tone-gold'

  const rawAtr  = (atrRegime?.regime || intelligence?.atr_regime?.regime || '').toUpperCase()
  const atrLabel = rawAtr || '—'
  const atrTone  = rawAtr === 'EXPANDED'   ? 'tone-bear'
                 : rawAtr === 'COMPRESSED' ? 'tone-gold'
                 : rawAtr === 'NORMAL'     ? 'tone-bull'
                 : ''

  const vixTone = vixRegime === 'COMPLACENT' ? 'tone-bull'
                : vixRegime === 'ELEVATED'   ? 'tone-gold'
                : vixRegime === 'UNKNOWN'    ? ''
                : 'tone-bear'

  const squeeze = liveData?.squeeze || intelligence?.momentum?.squeeze_state || ''
  const squeezeLabel = squeeze === 'long'  ? 'BULLISH'
                     : squeeze === 'short' ? 'BEARISH'
                     : squeeze             ? squeeze.toUpperCase()
                     : '—'
  const squeezeTone  = squeeze === 'long'  ? 'tone-bull'
                     : squeeze === 'short' ? 'tone-bear'
                     : 'tone-gold'

  const esPrice = liveData?.price

  return (
    <div className="posture reveal r-2" style={{ marginTop: '32px', marginBottom: '40px' }}>
      <Cell
        label="VWAP STACK"
        value={vwapLabel}
        tone={vwapTone}
        sub="vs D / W / M anchors"
      />
      <Cell
        label="ATR REGIME"
        value={atrLabel}
        tone={atrTone}
        sub={atrRegime?.current_atr ? `ATR ${N(atrRegime.current_atr, 1)}` : 'volatility'}
      />
      <Cell
        label="VIX REGIME"
        value={vixRegime === 'UNKNOWN' ? '—' : vixRegime}
        tone={vixTone}
        sub={vix ? `VIX ${N(vix, 2)}` : 'fear gauge'}
      />
      <Cell
        label="TTM SQUEEZE"
        value={squeezeLabel}
        tone={squeezeTone}
        sub="momentum signal"
      />
      <Cell
        label="WEEKLY RANGE"
        value={esPrice ? N(esPrice, 2) : '—'}
        tone="tone-gold"
        sub={`live ${symbolCfg(symbol).code} price`}
      />
    </div>
  )
}
