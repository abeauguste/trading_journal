import React from 'react'

function vixScore(vixLevel) {
  if (vixLevel == null) return { label: '—', score: 0, cls: 'pill-gold' }
  if (vixLevel < 15) return { label: 'COMPLACENT', score: +2, cls: 'pill-bull' }
  if (vixLevel < 25) return { label: 'ELEVATED',   score:  0, cls: 'pill-gold' }
  if (vixLevel < 35) return { label: 'FEAR',        score: -1, cls: 'pill-bear' }
  return               { label: 'PANIC',            score: -2, cls: 'pill-bear' }
}

function vwapScore(summary) {
  if (!summary) return { label: '—', score: 0, cls: 'pill-gold' }
  const s = summary.toUpperCase()
  if (s.includes('FULL BULL'))  return { label: 'FULL BULL',  score: +2, cls: 'pill-bull' }
  if (s.includes('MIXED BULL')) return { label: 'MIXED BULL', score: +1, cls: 'pill-bull' }
  if (s.includes('MIXED BEAR')) return { label: 'MIXED BEAR', score: -1, cls: 'pill-bear' }
  if (s.includes('FULL BEAR'))  return { label: 'FULL BEAR',  score: -2, cls: 'pill-bear' }
  return { label: 'NEUTRAL', score: 0, cls: 'pill-gold' }
}

function squeezeScore(state) {
  // state is always 'BULLISH' | 'BEARISH' | 'NEUTRAL' from squeeze_state field
  if (!state) return { label: '—', score: 0, cls: 'pill-gold' }
  const s = state.toUpperCase()
  if (s.includes('BULL')) return { label: state, score: +1, cls: 'pill-bull' }
  if (s.includes('BEAR')) return { label: state, score: -1, cls: 'pill-bear' }
  return { label: state, score: 0, cls: 'pill-gold' }
}

function getVerdict(score) {
  if (score >= 4)  return { label: 'FULL BULL', cls: 'tone-bull' }
  if (score >= 2)  return { label: 'BULLISH',   cls: 'tone-bull' }
  if (score >= -1) return { label: 'NEUTRAL',   cls: 'tone-gold' }
  if (score >= -3) return { label: 'BEARISH',   cls: 'tone-bear' }
  return               { label: 'FULL BEAR',    cls: 'tone-bear' }
}

function atrPillCls(regime) {
  if (regime === 'EXPANDED')   return 'pill-bear'
  if (regime === 'COMPRESSED') return 'pill-gold'
  return 'pill-gold'  // NORMAL — gold is neutral enough; no dedicated "normal" pill class
}

const CARD_SHELL = ({ children }) => (
  <div className="card reveal r-1" style={{ marginBottom: 'var(--gap)' }}>
    <div className="card-hdr">
      <span className="card-title">Regime Synthesis</span>
      <span className="eyebrow muted">Multi-Signal Score</span>
    </div>
    {children}
  </div>
)

export default function RegimeSynthesisCard({ regime, liveData }) {
  const vixLevel     = liveData?.vix
  const summary      = liveData?.vwapAnalysis?.summary
  const squeezeState = regime?.momentum?.squeeze_state
  const atrRegime    = regime?.atr_regime?.regime

  // Guard: if no live signals at all, show loading state instead of fake NEUTRAL
  const hasData = vixLevel != null || summary != null || squeezeState != null
  if (!hasData) {
    return (
      <CARD_SHELL>
        <div className="card-body">
          <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            Awaiting live market data…
          </div>
        </div>
      </CARD_SHELL>
    )
  }

  const vixSig     = vixScore(vixLevel)
  const vwapSig    = vwapScore(summary)
  const squeezeSig = squeezeScore(squeezeState)

  const score   = vixSig.score + vwapSig.score + squeezeSig.score
  const verdict = getVerdict(score)

  const bullCount = [vixSig, vwapSig, squeezeSig].filter(s => s.score > 0).length
  const bearCount = [vixSig, vwapSig, squeezeSig].filter(s => s.score < 0).length

  let alignText
  if (score > 0)                          alignText = `${bullCount} of 3 signals bullish`
  else if (score < 0)                     alignText = `${bearCount} of 3 signals bearish`
  else if (bullCount === 0 && bearCount === 0) alignText = 'No directional edge'
  else                                    alignText = 'Mixed signals'

  const rows = [
    { label: 'VIX',        sig: vixSig,     showScore: true  },
    { label: 'VWAP Stack', sig: vwapSig,    showScore: true  },
    { label: 'Squeeze',    sig: squeezeSig, showScore: true  },
    {
      label: 'ATR',
      sig: { label: atrRegime ?? '—', score: null, cls: atrPillCls(atrRegime) },
      showScore: false,
    },
  ]

  return (
    <CARD_SHELL>
      <div className="card-body">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: verdict */}
          <div style={{ minWidth: '130px' }}>
            <div className={`mono ${verdict.cls}`} style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1 }}>
              {verdict.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
              {alignText}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="mono" style={{ fontSize: '22px', color: score >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                {score >= 0 ? '+' : ''}{score}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>/ ±5</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'var(--line)', alignSelf: 'stretch', minHeight: '80px' }} />

          {/* Right: signal rows */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            {rows.map(({ label, sig, showScore }) => (
              <div key={label} className="kv-row" style={{ alignItems: 'center' }}>
                <span className="kv-key" style={{ fontSize: '11px', minWidth: '80px' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`pill ${sig.cls}`} style={{ fontSize: '9.5px' }}>{sig.label}</span>
                  {showScore && sig.score !== null && (
                    <span className="mono" style={{
                      fontSize: '11px',
                      color: sig.score > 0 ? 'var(--bull)' : sig.score < 0 ? 'var(--bear)' : 'var(--text-3)',
                    }}>
                      {sig.score >= 0 ? '+' : ''}{sig.score}
                    </span>
                  )}
                  {!showScore && (
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>context only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CARD_SHELL>
  )
}
