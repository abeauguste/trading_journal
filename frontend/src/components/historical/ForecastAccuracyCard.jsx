import React from 'react'

function computeAccuracy(forecastRows) {
  if (!forecastRows || forecastRows.length < 2) {
    return { insufficient: true, count: forecastRows?.length ?? 0 }
  }

  const sorted = [...forecastRows].sort((a, b) =>
    String(a.sheet || a.date || '').localeCompare(String(b.sheet || b.date || ''))
  )

  let bullCorrect = 0, bullTotal = 0
  let bearCorrect = 0, bearTotal = 0
  let neutralSkipped = 0
  const evals = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i]
    const nxt = sorted[i + 1]
    const o0 = Number(cur.open), o1 = Number(nxt.open)
    if (!Number.isFinite(o0) || !Number.isFinite(o1)) continue
    const bias = cur.weekly_bias
    if (!bias || bias === 'NEUTRAL') { neutralSkipped++; continue }
    const actual = o1 > o0 ? 'BULL' : o1 < o0 ? 'BEAR' : null
    if (!actual) continue
    const hit = bias === actual
    evals.push({ week: cur.sheet || cur.date || `Week ${i + 1}`, bias, actual, hit, deltaPts: Math.round(o1 - o0) })
    if (bias === 'BULL') { bullTotal++; if (hit) bullCorrect++ }
    else if (bias === 'BEAR') { bearTotal++; if (hit) bearCorrect++ }
  }

  const evaluated = evals.length
  const correct = bullCorrect + bearCorrect
  const overallPct = evaluated > 0 ? (correct / evaluated) * 100 : null
  const bullPct = bullTotal > 0 ? (bullCorrect / bullTotal) * 100 : null
  const bearPct = bearTotal > 0 ? (bearCorrect / bearTotal) * 100 : null

  return { insufficient: false, evals, evaluated, correct, bullCorrect, bullTotal, bullPct, bearCorrect, bearTotal, bearPct, neutralSkipped, overallPct }
}

const statBox = {
  padding: '14px',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.06)',
}

const statLabel = {
  fontSize: '10px',
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const statSub = {
  fontSize: '11px',
  color: 'var(--text-3)',
  marginTop: '4px',
}

export default function ForecastAccuracyCard({ forecastRows }) {
  const acc = computeAccuracy(forecastRows)

  const overallColor =
    acc.overallPct == null   ? 'var(--text-3)' :
    acc.overallPct >= 60     ? 'var(--bull)'   :
    acc.overallPct >= 45     ? 'var(--gold)'   :
                               'var(--bear)'

  return (
    <div className="card reveal r-7" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">AI Forecast Accuracy</span>
        <span className="eyebrow muted">Bias vs Next-Week Open</span>
      </div>
      <div className="card-body">
        {acc.insufficient ? (
          <div>
            {acc.count === 0 && (
              <div className="muted" style={{ padding: '20px', fontSize: '13px' }}>
                No forecasts archived yet. Accuracy tracking begins after 2 forecast weeks are recorded.
              </div>
            )}
            {acc.count === 1 && (
              <div className="muted" style={{ padding: '20px', fontSize: '13px' }}>
                1 forecast archived. Scoring begins when the next week's open is recorded — check back Monday.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Stat grid */}
            <div className="grid g4">
              <div style={statBox}>
                <div style={statLabel}>Overall Accuracy</div>
                <div className="mono" style={{ fontSize: '26px', marginTop: '6px', color: overallColor }}>
                  {acc.overallPct != null ? acc.overallPct.toFixed(0) + '%' : '—'}
                </div>
                <div style={statSub}>{acc.correct} / {acc.evaluated} correct</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>BULL Calls</div>
                <div className="mono tone-bull" style={{ fontSize: '26px', marginTop: '6px' }}>
                  {acc.bullPct != null ? acc.bullPct.toFixed(0) + '%' : '—'}
                </div>
                <div style={statSub}>{acc.bullCorrect} / {acc.bullTotal} correct</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>BEAR Calls</div>
                <div className="mono tone-bear" style={{ fontSize: '26px', marginTop: '6px' }}>
                  {acc.bearPct != null ? acc.bearPct.toFixed(0) + '%' : '—'}
                </div>
                <div style={statSub}>{acc.bearCorrect} / {acc.bearTotal} correct</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Neutral Skipped</div>
                <div className="mono tone-gold" style={{ fontSize: '26px', marginTop: '6px' }}>
                  {acc.neutralSkipped}
                </div>
                <div style={statSub}>Excluded from scoring</div>
              </div>
            </div>

            {/* All-NEUTRAL degenerate state banner */}
            {acc.evaluated === 0 && (
              <div className="muted" style={{ marginBottom: '12px', fontSize: '12px' }}>
                All archived forecasts were NEUTRAL — no directional calls to score yet.
              </div>
            )}

            {/* Recent evaluations table */}
            {acc.evals.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recent Evaluations
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>Predicted</th>
                        <th>Actual</th>
                        <th>Result</th>
                        <th>Δ pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...acc.evals].reverse().slice(0, 5).map((ev) => (
                        <tr key={ev.week}>
                          <td className="mono tone-gold">{ev.week}</td>
                          <td>
                            <span className={`pill ${ev.bias === 'BULL' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: '9.5px' }}>{ev.bias}</span>
                          </td>
                          <td>
                            <span className={`pill ${ev.actual === 'BULL' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: '9.5px' }}>{ev.actual}</span>
                          </td>
                          <td>
                            <span className={ev.hit ? 'tone-bull mono' : 'tone-bear mono'} style={{ fontSize: '12px' }}>
                              {ev.hit ? 'Correct' : 'Miss'}
                            </span>
                          </td>
                          <td className={`mono ${ev.deltaPts >= 0 ? 'tone-bull' : 'tone-bear'}`}>
                            {ev.deltaPts >= 0 ? '+' : ''}{ev.deltaPts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
              Scored by comparing weekly bias to the next week's open price direction. Neutral biases and flat opens are excluded.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
