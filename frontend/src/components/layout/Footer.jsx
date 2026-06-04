import React from 'react'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer-slim">
      <div className="hairline" />
      <div className="footer-slim-inner container">
        <div className="footer-brand-row">
          <Logo />
          <span className="footer-slim-tag muted">Not financial advice · Personal research tool</span>
        </div>
        <div className="footer-slim-meta">
          <span className="pill pill-live">LIVE</span>
          <span className="dim">© {new Date().getFullYear()} Auguste Capital</span>
        </div>
      </div>
    </footer>
  )
}
