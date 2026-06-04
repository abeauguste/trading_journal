import React from 'react'
import { N } from '../../utils/format'

// ── Scoring functions (each returns { score 0–4, note string }) ──

function scoreProfit(s) {
  const pf = s.profit_factor
  if (pf == null) return { score: 2, note: 'Insufficient data' }
  if (pf >= 2.0) return { score: 4, note: `PF ${N(pf, 2)} — exceptional edge` }
  if (pf >= 1.5) return { score: 3, note: `PF ${N(pf, 2)} — solid profitability` }
  if (pf >= 1.0) return { score: 2, note: `PF ${N(pf, 2)} — near breakeven` }
  if (pf >= 0.5) return { score: 1, note: `PF ${N(pf, 2)} — losing ground` }
  return { score: 0, note: `PF ${N(pf, 2)} — critical loss ratio` }
}

function scoreWinRate(s) {
  const wr = s.win_rate_pct
  if (wr == null) return { score: 2, note: 'Insufficient data' }
  if (wr >= 65) return { score: 4, note: `${N(wr, 0)}% — elite accuracy` }
  if (wr >= 55) return { score: 3, note: `${N(wr, 0)}% — above average` }
  if (wr >= 45) return { score: 2, note: `${N(wr, 0)}% — coin-flip territory` }
  if (wr >= 35) return { score: 1, note: `${N(wr, 0)}% — needs improvement` }
  return { score: 0, note: `${N(wr, 0)}% — entry strategy critical` }
}

function scoreRisk(s) {
  const dd = s.max_drawdown_pct != null ? Math.abs(s.max_drawdown_pct) : null
  if (dd == null) return { score: 2, note: 'Insufficient data' }
  if (dd <= 2)  return { score: 4, note: `${N(dd, 1)}% max drawdown — tight control` }
  if (dd <= 5)  return { score: 3, note: `${N(dd, 1)}% max drawdown — well managed` }
  if (dd <= 10) return { score: 2, note: `${N(dd, 1)}% max drawdown — acceptable` }
  if (dd <= 20) return { score: 1, note: `${N(dd, 1)}% max drawdown — elevated risk` }
  return { score: 0, note: `${N(dd, 1)}% max drawdown — critical exposure` }
}

function scoreDiscipline(s) {
  const revenge    = s.revenge_trades     ?? 0
  const overtrade  = s.overtrading_days   ?? 0
  const issues     = revenge + overtrade
  if (issues === 0) return { score: 4, note: 'No behavioral red flags detected' }
  if (issues <= 2)  return { score: 3, note: `${issues} minor issue${issues > 1 ? 's' : ''} — minor slippage` }
  if (issues <= 5)  return { score: 2, note: `${revenge} revenge, ${overtrade} overtrading day${overtrade !== 1 ? 's' : ''}` }
  if (issues <= 10) return { score: 1, note: `${revenge} revenge trades — emotional patterns` }
  return { score: 0, note: 'Significant emotional trading patterns' }
}

function scoreConsistency(s) {
  const exp      = s.expectancy_per_trade
  const lossStr  = s.streak_max_loss ?? 0
  if (exp == null) return { score: 2, note: 'Insufficient data' }
  if (exp > 200 && lossStr <= 2) return { score: 4, note: `$${N(exp, 0)}/trade — disciplined edge` }
  if (exp > 50  && lossStr <= 3) return { score: 3, note: `$${N(exp, 0)}/trade expectancy` }
  if (exp > 0   && lossStr <= 5) return { score: 2, note: `$${N(exp, 0)}/trade — needs tightening` }
  if (exp > 0)                   return { score: 1, note: `${lossStr} max consecutive losses` }
  return { score: 0, note: 'Negative expectancy — strategy review needed' }
}

// ── Grade helpers ──

const toGrade = (avg) => {
  if (avg >= 3.5) return 'A'
  if (avg >= 2.5) return 'B'
  if (avg >= 1.5) return 'C'
  if (avg >= 0.5) return 'D'
  return 'F'
}

const GRADE_COLOR = {
  A: 'var(--bull)',
  B: '#4ade80',
  C: 'var(--gold)',
  D: 'var(--orange, #e07b39)',
  F: 'var(--bear)',
}

const GRADE_LABEL = {
  A: 'Excellent',
  B: 'Proficient',
  C: 'Developing',
  D: 'Needs Work',
  F: 'Critical',
}

// ── Component ──

export default function TraderScorecard({ stats }) {
  if (!stats || (stats.total_trades ?? 0) < 3) return null

  const categories = [
    { label: 'Profitability', icon: '$', ...scoreProfit(stats) },
    { label: 'Win Rate',      icon: '✓', ...scoreWinRate(stats) },
    { label: 'Risk Mgmt',     icon: '⚡', ...scoreRisk(stats) },
    { label: 'Discipline',    icon: '◎', ...scoreDiscipline(stats) },
    { label: 'Consistency',   icon: '~', ...scoreConsistency(stats) },
  ]

  const avgScore    = categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  const overallGrade = toGrade(avgScore)
  const overallColor = GRADE_COLOR[overallGrade]

  return (
    <div className="card reveal r-2" style={{ marginBottom: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Trader Scorecard</span>
        <span className="eyebrow" style={{ color: 'var(--text-3)' }}>Performance Grade</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>

          {/* ── Overall grade ── */}
          <div style={{
            flexShrink: 0,
            width: '130px',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${overallColor}`,
            borderRadius: '4px',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '10px', fontFamily: 'var(--f-mono)',
              textTransform: 'uppercase', letterSpacing: '.12em',
              color: 'var(--text-3)',
            }}>
              Overall
            </div>
            <div style={{
              fontSize: '56px', fontFamily: 'var(--f-mono)',
              fontWeight: 700, lineHeight: 1,
              color: overallColor,
            }}>
              {overallGrade}
            </div>
            <div style={{ fontSize: '11px', color: overallColor, fontWeight: 600 }}>
              {GRADE_LABEL[overallGrade]}
            </div>
            <div style={{
              fontSize: '10px', color: 'var(--text-3)',
              marginTop: '4px', fontFamily: 'var(--f-mono)',
            }}>
              {stats.total_trades} trades
            </div>
          </div>

          {/* ── Sub-grade rows ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0,
          }}>
            {categories.map((cat, i) => {
              const g = toGrade(cat.score)
              const c = GRADE_COLOR[g]
              const last = i === categories.length - 1
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '9px 0',
                  borderBottom: last ? 'none' : '1px dashed var(--border)',
                }}>
                  {/* Grade badge */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    background: `${c}1a`,
                    border: `1px solid ${c}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontFamily: 'var(--f-mono)',
                    fontWeight: 700,
                    color: c,
                    flexShrink: 0,
                  }}>
                    {g}
                  </div>

                  {/* Label + note */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 600,
                      color: 'var(--text-2)', marginBottom: '2px',
                    }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                      {cat.note}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{
                    width: '60px',
                    height: '4px',
                    background: 'var(--border)',
                    borderRadius: '2px',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(cat.score / 4) * 100}%`,
                      background: c,
                      borderRadius: '2px',
                      transition: 'width .3s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
