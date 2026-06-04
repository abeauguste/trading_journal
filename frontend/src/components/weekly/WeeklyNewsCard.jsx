import React, { useState } from 'react'
import { timeAgo } from '../../utils/format'

function ScoreBadge({ score }) {
  const color = score >= 9 ? 'var(--bear)' : score >= 8 ? 'var(--gold)' : 'var(--text-2)'
  return (
    <span className="mono" style={{ fontSize: '13px', color, fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>
      {score}
    </span>
  )
}

function BiasPill({ bias }) {
  if (!bias) return null
  const cls = bias === 'BULL' ? 'pill pill-bull' : bias === 'BEAR' ? 'pill pill-bear' : 'pill pill-gold'
  return <span className={cls} style={{ fontSize: '9px' }}>{bias}</span>
}

export default function WeeklyNewsCard({ news = [] }) {
  const [expanded, setExpanded] = useState(false)
  if (!news.length) return null

  const visible = expanded ? news.slice(0, 10) : news.slice(0, 5)
  const hasMore = news.length > 5

  return (
    <div className="card" style={{ marginTop: 'var(--gap)' }}>
      <div className="card-hdr">
        <span className="card-title">Market Catalysts This Week</span>
        <span className="eyebrow">{news.length} item{news.length !== 1 ? 's' : ''} · ES impact ≥7/10</span>
      </div>

      <div style={{ padding: 0 }}>
        {visible.map((item, i) => (
          <div
            key={item.id ?? i}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              gap: '14px',
              alignItems: 'flex-start',
              padding: '13px 20px',
              borderBottom: i < visible.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <ScoreBadge score={item.score} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', lineHeight: 1.45, marginBottom: '5px', color: 'var(--text)' }}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 120ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <BiasPill bias={item.bias} />
                <span className="eyebrow" style={{ letterSpacing: '0.07em' }}>{item.source}</span>
                <span className="muted" style={{ fontSize: '11px' }}>
                  {timeAgo(item.published_at || item.fetched_at)}
                </span>
                {item.reason && (
                  <span className="muted" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                    · {item.reason}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '12px', color: 'var(--text-3)', padding: '6px 0' }}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'Show fewer' : `Show ${Math.min(news.length, 10) - 5} more`}
          </button>
        </div>
      )}
    </div>
  )
}
