// components.jsx — Auguste Capital: Logo, Nav, Footer, Ticker, atomic UI

/* ─── LOGO SYSTEM (4 variants) ────────────────────────────── */

function Logo({ variant = "wordmark-italic", size = 18, mark = false }) {
  const px = size;
  // Variant A — Italic ligature wordmark (default)
  if (variant === "wordmark-italic") {
    return (
      <span className="logo logo-italic" style={{ fontSize: px }}>
        <em>Auguste</em>
        <span className="logo-sep">·</span>
        <span className="logo-cap">Capital</span>
      </span>
    );
  }
  // Variant B — Tracked roman caps
  if (variant === "wordmark-caps") {
    return (
      <span className="logo logo-caps" style={{ fontSize: px * 0.72 }}>
        AUGUSTE&nbsp;&nbsp;CAPITAL
      </span>
    );
  }
  // Variant C — Monogram + wordmark
  if (variant === "monogram") {
    return (
      <span className="logo logo-mono" style={{ fontSize: px }}>
        <span className="logo-monogram" aria-hidden="true">
          <svg viewBox="0 0 28 28" width={px * 1.5} height={px * 1.5}>
            <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" />
            <text x="14" y="19" textAnchor="middle" fontFamily="var(--f-display)" fontStyle="italic" fontSize="15" fill="currentColor">A</text>
          </svg>
        </span>
        {!mark && (
          <span className="logo-italic">
            <em>Auguste</em>
            <span className="logo-sep">·</span>
            <span className="logo-cap">Capital</span>
          </span>
        )}
      </span>
    );
  }
  // Variant D — Glyph mark (sextant: horizon through circle)
  if (variant === "glyph") {
    return (
      <span className="logo logo-mono" style={{ fontSize: px }}>
        <span className="logo-monogram" aria-hidden="true">
          <svg viewBox="0 0 28 28" width={px * 1.5} height={px * 1.5}>
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.7" />
            <line x1="3" y1="14" x2="25" y2="14" stroke="currentColor" strokeOpacity="0.75" strokeWidth="0.7" />
            <circle cx="14" cy="14" r="1.6" fill="currentColor" />
          </svg>
        </span>
        {!mark && (
          <span className="logo-caps" style={{ fontSize: px * 0.7 }}>AUGUSTE&nbsp;&nbsp;CAPITAL</span>
        )}
      </span>
    );
  }
  return null;
}

/* ─── NAV ─────────────────────────────────────────────────── */

function Nav({ route, onNav, logoVariant }) {
  const items = [
    { id: "intelligence", label: "Intelligence" },
    { id: "weekly",       label: "Weekly" },
    { id: "daily",        label: "Daily" },
    { id: "markets",      label: "Markets" },
    { id: "historical",   label: "Historical" },
    { id: "risk",         label: "Risk" },
    { id: "settings",     label: "Settings" },
  ];
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="nav-brand" onClick={() => onNav("intelligence")}>
          <Logo variant={logoVariant} size={18} />
        </a>
        <nav className="nav-links">
          {items.map(it => (
            <a key={it.id}
               className={"nav-link" + (route === it.id ? " is-active" : "")}
               onClick={() => onNav(it.id)}>
              {it.label}
            </a>
          ))}
        </nav>
        <div className="nav-right mono dim nav-status">
          <span className="pill pill-live">LIVE</span>
          <span>10:42:08 ET</span>
        </div>
      </div>
      <div className="hairline" />
    </header>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────── */

function Footer({ logoVariant, onNav }) {
  const cols = [
    { h: "Firm",       links: ["Overview", "Strategy", "Leadership", "Careers"] },
    { h: "Product",    links: ["Intelligence", "Markets", "Daily plan", "Risk"] },
    { h: "Research",   links: ["Insights", "White papers", "Methodology", "Glossary"] },
    { h: "Legal",      links: ["Disclosures", "Privacy", "Terms", "Form ADV"] },
  ];
  return (
    <footer className="footer">
      <div className="hairline" />
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo variant={logoVariant} size={22} />
          <p className="muted footer-tag">
            An operating system for disciplined capital.
            <br/>Encoded, instrumented, patient.
          </p>
          <div className="footer-status mono">
            <span className="pill pill-live">SYSTEMS · NOMINAL</span>
            <span className="dim">v2026.05 · build 84b1c0</span>
          </div>
        </div>
        {cols.map(c => (
          <div key={c.h} className="footer-col">
            <div className="eyebrow">{c.h}</div>
            <ul>
              {c.links.map(l => <li key={l}><a>{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="hairline" />
      <div className="container footer-base mono">
        <span>© 2026 Auguste Capital, LLC</span>
        <span className="dim">Not an offer to sell or solicit. See disclosures.</span>
        <span>NEW YORK · 40.7484° N, 73.9857° W</span>
      </div>
    </footer>
  );
}

/* ─── LIVE TICKER ─────────────────────────────────────────── */

function useLiveTick(seed = 4827.5, vol = 0.4) {
  const [v, setV] = React.useState(seed);
  React.useEffect(() => {
    const id = setInterval(() => {
      setV(prev => {
        const drift = (Math.random() - 0.5) * vol;
        return Math.max(0, prev + drift);
      });
    }, 1500);
    return () => clearInterval(id);
  }, [vol]);
  return v;
}

function Ticker({ compact = false }) {
  const es  = useLiveTick(4827.5, 0.6);
  const nq  = useLiveTick(17234, 2.2);
  const vix = useLiveTick(14.82, 0.05);
  const atr = useLiveTick(22.4, 0.04);

  const rows = [
    { sym: "ES",  px: es,  d: +0.42, k: "S&P E-mini" },
    { sym: "NQ",  px: nq,  d: +0.61, k: "Nasdaq E-mini" },
    { sym: "VIX", px: vix, d: -2.18, k: "Volatility" },
    { sym: "ATR(20)", px: atr, d: +0.12, k: "Daily range" },
  ];

  return (
    <div className={"ticker" + (compact ? " ticker-compact" : "")}>
      <div className="ticker-hd">
        <span className="pill pill-live">LIVE · ES WEBHOOK</span>
        <span className="mono dim">RTH · 10:42:08 ET</span>
      </div>
      <div className="ticker-rows">
        {rows.map(r => (
          <div className="ticker-row" key={r.sym}>
            <div className="t-sym mono">{r.sym}</div>
            <div className="t-px mono">{r.px.toFixed(r.sym === "ATR(20)" || r.sym === "VIX" ? 2 : 2)}</div>
            <div className={"t-d mono " + (r.d >= 0 ? "n-bull" : "n-bear")}>
              {r.d >= 0 ? "+" : ""}{r.d.toFixed(2)}%
            </div>
            <div className="t-k">{r.k}</div>
          </div>
        ))}
      </div>
      <div className="ticker-sparks">
        <Spark color="bull" />
        <Spark color="bull" />
        <Spark color="bear" />
        <Spark color="bull" />
      </div>
    </div>
  );
}

function Spark({ color = "bull", points = 24 }) {
  const data = React.useMemo(() => {
    const arr = [];
    let v = 50;
    for (let i = 0; i < points; i++) {
      v += (Math.random() - 0.5) * 12;
      v = Math.max(10, Math.min(90, v));
      arr.push(v);
    }
    return arr;
  }, [points]);
  const w = 100, h = 24;
  const step = w / (data.length - 1);
  const path = data.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (y / 100) * h}`).join(" ");
  const stroke = color === "bull" ? "var(--bull)" : color === "bear" ? "var(--bear)" : "var(--gold)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.2" />
    </svg>
  );
}

/* ─── POSTURE STRIP ────────────────────────────────────────── */

function PostureStrip() {
  const cells = [
    { k: "VWAP STACK",   v: "FULL BULL",  d: "Price above D · W · M anchors",  tone: "bull" },
    { k: "ATR REGIME",   v: "EXPANDED",   d: "20-bar p72 · range opening",      tone: "gold" },
    { k: "VIX REGIME",   v: "COMPLACENT", d: "14.82 · risk-on bias",            tone: "bull" },
    { k: "TTM SQUEEZE",  v: "RELEASE ↑",  d: "Long signal · 3 bars",            tone: "bull" },
    { k: "WEEKLY RANGE", v: "82% USED",   d: "4790 / 4862 projected",           tone: "gold" },
  ];
  return (
    <div className="posture">
      {cells.map((c, i) => (
        <div className="posture-cell" key={i}>
          <div className="eyebrow">{c.k}</div>
          <div className={"posture-v " + ("tone-" + c.tone)}>{c.v}</div>
          <div className="posture-d">{c.d}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── KV ROW ──────────────────────────────────────────────── */

function KV({ k, v, tone }) {
  return (
    <div className="kv">
      <span className="kv-k">{k}</span>
      <span className={"kv-v mono " + (tone ? "tone-" + tone : "")}>{v}</span>
    </div>
  );
}

/* ─── PRICE CHART (mock) ──────────────────────────────────── */

function PriceChart({ height = 220, accent = "gold" }) {
  const data = React.useMemo(() => {
    const arr = []; let v = 50;
    for (let i = 0; i < 80; i++) {
      v += (Math.random() - 0.48) * 6;
      v = Math.max(15, Math.min(85, v));
      arr.push(v);
    }
    return arr;
  }, []);
  const w = 600, h = height;
  const step = w / (data.length - 1);
  const path = data.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (y / 100) * h}`).join(" ");
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  const stroke = accent === "gold" ? "var(--gold)" : "var(--bull)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="chart" width="100%" height={h}>
      <defs>
        <linearGradient id="gFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="var(--gold)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((t,i)=>(
        <line key={i} x1="0" y1={h*t} x2={w} y2={h*t} stroke="var(--line)" strokeDasharray="2 4" />
      ))}
      {/* VWAP anchor */}
      <line x1="0" y1={h*0.42} x2={w} y2={h*0.42} stroke="var(--gold-line)" strokeDasharray="3 3" />
      <path d={fill} fill="url(#gFill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.4" />
      {/* last dot */}
      <circle cx={w} cy={h - (data[data.length-1]/100)*h} r="3" fill={stroke} />
    </svg>
  );
}

/* ─── EXPORT TO GLOBAL ────────────────────────────────────── */
Object.assign(window, {
  Logo, Nav, Footer, Ticker, Spark, PostureStrip, KV, PriceChart, useLiveTick,
});
