import React from 'react'
import { N } from '../../utils/format'

// ── helpers ───────────────────────────────────────────────────────────────────

/** Compare current vs previous value to get direction */
function direction(curr, prev) {
  if (curr == null || prev == null) return null
  if (curr > prev) return 'rising'
  if (curr < prev) return 'falling'
  return 'flat'
}

/**
 * Map histogram value + direction to a colour tone.
 * Mirrors LazyBear TTM Squeeze bar colouring:
 *   Lime  = positive + rising   (momentum accelerating up)
 *   Green = positive + falling  (momentum weakening)
 *   Red   = negative + falling  (momentum accelerating down)
 *   Maroon= negative + rising   (momentum recovering)
 */
function histTone(val, dir) {
  if (val == null) return ''
  const pos = val >= 0
  if (pos  && dir === 'rising')  return 'tone-bull'
  if (pos  && dir === 'falling') return 'tone-gold'
  if (!pos && dir === 'rising')  return 'tone-gold'
  if (!pos && dir === 'falling') return 'tone-bear'
  return pos ? 'tone-bull' : 'tone-bear'
}

function histDirLabel(val, dir) {
  if (val == null) return ''
  const pos = val >= 0
  if (dir === 'rising'  && pos)  return '↑ ACCELERATING'
  if (dir === 'falling' && pos)  return '↓ WEAKENING'
  if (dir === 'rising'  && !pos) return '↑ RECOVERING'
  if (dir === 'falling' && !pos) return '↓ ACCELERATING'
  if (dir === 'flat')            return '→ FLAT'
  return pos ? 'ABOVE ZERO' : 'BELOW ZERO'
}

function combineReading(squeezeState, histVal, histDir, waveVal, waveDir) {
  if (histVal == null && waveVal == null) return null
  const histPos  = histVal != null && histVal >= 0
  const wavePos  = waveVal != null && waveVal >= 0
  const sqzActive = squeezeState === 'short' // TTM "short" = squeeze dots are red (coiling)

  if (histVal != null && waveVal != null) {
    if (histPos && wavePos) {
      return sqzActive
        ? 'Squeeze coiling — both histograms positive. Strong long setup on breakout.'
        : 'Both histograms above zero — bullish momentum aligned.'
    }
    if (!histPos && !wavePos) {
      return sqzActive
        ? 'Squeeze coiling — both histograms negative. Strong short setup on breakout.'
        : 'Both histograms below zero — bearish momentum aligned.'
    }
    // Divergence
    return `Divergence — histogram ${histPos ? 'positive' : 'negative'} / Wave A ${wavePos ? 'positive' : 'negative'}. Reduce position confidence.`
  }
  if (histVal != null) {
    return histPos
      ? 'Squeeze histogram above zero — bullish momentum.'
      : 'Squeeze histogram below zero — bearish momentum.'
  }
  return wavePos
    ? 'Wave A positive — bullish momentum.'
    : 'Wave A negative — bearish momentum.'
}

// ── HistRow sub-component ─────────────────────────────────────────────────────

function HistRow({ label, val, dir, pending }) {
  const tone  = histTone(val, dir)
  const dLabel = histDirLabel(val, dir)
  return (
    <div className="mom-hist-block">
      <div className="mom-hist-title">{label}</div>
      {val != null ? (
        <div className="mom-hist-row">
          <span className={`mom-hist-val ${tone}`}>
            {val >= 0 ? '+' : ''}{N(val, 2)}
          </span>
          {dLabel && (
            <span className={`mom-hist-dir ${tone}`}>{dLabel}</span>
          )}
        </div>
      ) : (
        <div className="mom-pending">{pending}</div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function MomentumSummaryCard({ momentumSummary, liveData }) {
  // Signal state from either WebSocket or cached intelligence report
  const squeeze = liveData?.squeeze || ''

  // Squeeze state label for display
  const sqzLabel = squeeze === 'long'    ? 'BULLISH'   // histogram positive / momentum fired up
                 : squeeze === 'short'   ? 'BEARISH'   // histogram negative / momentum fired down
                 : squeeze === 'neutral' ? 'NEUTRAL'
                 : null
  const sqzTone  = squeeze === 'long'  ? 'tone-bull'
                 : squeeze === 'short' ? 'tone-bear'
                 : 'tone-gold'

  // Histogram values from momentumSummary (enriched via intelligence_update WS or REST)
  const row      = Array.isArray(momentumSummary) ? momentumSummary[0] : null
  const histVal  = row?.histogram ?? null
  const waveVal  = row?.wave_a    ?? null

  // Direction: compare current vs previous (prev tracked in useLiveData)
  const histDir  = direction(histVal,  liveData?.prev_wave_a)
  const waveDir  = direction(waveVal,  liveData?.prev_wave_b)

  const reading  = combineReading(
    row?.squeeze_state || squeeze,
    histVal, histDir,
    waveVal, waveDir
  )

  const noSignal = !sqzLabel && histVal == null && waveVal == null

  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Momentum Summary</span></div>
      <div className="card-body">

        {noSignal && (
          <div className="no-data-placeholder">Waiting for squeeze data…</div>
        )}

        {/* ── Squeeze state ── */}
        {sqzLabel && (
          <div className="mom-state-row">
            <span className="mom-state-label">TTM Squeeze</span>
            <span className={`mom-state-val ${sqzTone}`}>{sqzLabel}</span>
          </div>
        )}

        {/* ── Two histograms ── */}
        <HistRow
          label="Squeeze Histogram"
          val={histVal}
          dir={histDir}
          pending="Add ttm_wave_a to Pine Script alert"
        />
        <HistRow
          label="TTM Wave A"
          val={waveVal}
          dir={waveDir}
          pending="Add ttm_wave_b to Pine Script alert"
        />

        {/* ── Combined reading ── */}
        {reading && (
          <div className="mom-reading">{reading}</div>
        )}

      </div>
    </div>
  )
}
