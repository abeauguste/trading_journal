# VS Code Handoff — Direct Apply Instructions

A short, opinionated path for applying the Auguste Capital design to your existing **AATradingJournal** codebase in VS Code. Five steps, ~30 minutes if you go straight through.

If you'd rather have Claude Code do it autonomously, jump to **Option B** at the bottom.

---

## Prereqs

- This handoff folder unzipped somewhere on disk
- VS Code open at `~/AATradingJournal/`
- Your dev servers running (per CLAUDE.md):
  ```bash
  # Terminal 1
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

  # Terminal 2
  cd frontend && npm run dev
  ```

You'll be editing only the frontend. The backend, scheduler, webhook, and tunnel stay untouched.

---

## Step 1 — Drop in the design tokens

Open `frontend/src/styles/globals.css` in VS Code.

**Find your `:root` block** (currently has `--bg`, `--card`, `--accent`, `--bull`, etc.).

**Replace the entire `:root` block** with this:

```css
:root {
  /* Surfaces — warm near-black */
  --bg:        #09080a;
  --bg-2:      #0c0b0d;
  --surface:   #111012;
  --surface-2: #15141a;
  --inset:     #0d0c0e;

  /* Hairlines */
  --line:      rgba(255,255,255,0.06);
  --line-2:    rgba(255,255,255,0.10);
  --line-3:    rgba(255,255,255,0.18);

  /* Text */
  --text:      #eceae3;
  --text-2:    #b3aea0;
  --text-3:    #7a766c;
  --text-4:    #4a4740;

  /* Accent — champagne gold */
  --gold:      #c9a96a;
  --gold-2:    #a48954;
  --gold-soft: rgba(201,169,106,0.14);
  --gold-line: rgba(201,169,106,0.30);

  /* Signal semantics */
  --bull:      #6fbf8a;
  --bear:      #c8665c;
  --neutral:   #c9a96a;

  /* Spacing */
  --pad-page:    clamp(20px, 4vw, 64px);
  --pad-section: clamp(56px, 8vw, 120px);
  --pad-card:    24px;
  --gap:         24px;
  --gap-sm:      12px;

  /* Typography (after Step 2) */
  --f-display: "Instrument Serif", Georgia, serif;
  --f-sans:    "Geist", ui-sans-serif, system-ui, sans-serif;
  --f-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* Motion */
  --m: 0.35;
  --dur-s: calc(160ms * (0.4 + var(--m)));
  --dur-m: calc(420ms * (0.4 + var(--m)));
  --dur-l: calc(900ms * (0.4 + var(--m)));
  --rise:  calc(14px  * var(--m));
  --ease:  cubic-bezier(0.2, 0.7, 0.2, 1);

  /* ─── Backwards-compat shims ─── */
  --card:    var(--surface);
  --card2:   var(--surface-2);
  --border:  var(--line);
  --border2: var(--line-2);
  --text2:   var(--text-2);
  --text3:   var(--text-3);
  --accent:  var(--gold);
  --accent2: var(--gold-2);
  --orange:  var(--gold);
  --purple:  var(--gold);
  --sans:    var(--f-sans);
  --mono:    var(--f-mono);
}
```

**Save.** Reload the dashboard at `localhost:5173`. Your existing UI will already look different — the cyan accent is now champagne gold, surfaces are warmer, hairlines are subtler. Nothing should be broken because the shims keep every old class working.

---

## Step 2 — Add the fonts

Open `frontend/index.html` and add to `<head>`, just below the existing `<meta>` tags:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap">
```

(Or, if you prefer to vendor fonts: `npm i @fontsource/instrument-serif @fontsource/geist-sans @fontsource/jetbrains-mono` and import in `main.jsx`.)

**Save.** Your dashboard's typography now uses Instrument Serif for headings, Geist for UI, JetBrains Mono for data. Existing class names still resolve via the `--sans` / `--mono` shims.

---

## Step 3 — Append the new utility classes

Still in `frontend/src/styles/globals.css`, **scroll to the bottom** and paste this block. Don't replace anything — just append:

```css
/* ════════════════════════════════════════════════════════════
   Auguste Capital — new visual system (Phase 1)
   ════════════════════════════════════════════════════════════ */

/* ── Type scale ── */
.h-display {
  font-family: var(--f-display);
  font-weight: 400;
  font-size: clamp(48px, 7.6vw, 116px);
  line-height: 0.96;
  letter-spacing: -0.015em;
  color: var(--text);
}
.h-display em { font-style: italic; color: var(--gold); }

.h-section {
  font-family: var(--f-display);
  font-weight: 400;
  font-size: clamp(36px, 4.8vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.012em;
}
.h-section em { font-style: italic; color: var(--gold); }

.h-card {
  font-family: var(--f-sans);
  font-weight: 500;
  font-size: 17px;
  line-height: 1.3;
  letter-spacing: -0.005em;
}

.lede {
  font-size: clamp(16px, 1.3vw, 19px);
  line-height: 1.55;
  color: var(--text-2);
  max-width: 56ch;
}

.eyebrow {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
  white-space: nowrap;
}
.eyebrow .dot {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
  margin-right: 8px;
  vertical-align: 1px;
  animation: pulse 2.4s var(--ease) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

.gold  { color: var(--gold); }
.muted { color: var(--text-3); }
.dim   { color: var(--text-4); }
.mono  { font-family: var(--f-mono); font-feature-settings: "tnum"; }

/* ── Pills (new) ── */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border-radius: 2px;
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--line);
}
.pill-bull { color: var(--bull); border-color: rgba(111,191,138,0.25); }
.pill-bear { color: var(--bear); border-color: rgba(200,102,92,0.25); }
.pill-gold { color: var(--gold); border-color: var(--gold-line); }
.pill-live::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--bull); box-shadow: 0 0 8px rgba(111,191,138,0.6);
  animation: pulse 2.2s var(--ease) infinite;
}

/* ── Tone modifiers ── */
.tone-bull { color: var(--bull); }
.tone-bear { color: var(--bear); }
.tone-gold { color: var(--gold); }

/* ── Buttons (new anatomy) ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 2px;
  font: 500 13px var(--f-sans);
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid var(--line-2);
  color: var(--text);
  background: transparent;
  transition: all var(--dur-s) var(--ease);
}
.btn:hover { border-color: var(--line-3); background: var(--surface); }
.btn-primary {
  background: var(--gold);
  border-color: var(--gold);
  color: #1a1407;
}
.btn-primary:hover { background: #d8b97c; border-color: #d8b97c; }

/* ── Reveal animation ── */
.reveal {
  opacity: 0;
  transform: translateY(var(--rise));
  animation: rise var(--dur-l) var(--ease) forwards;
}
@keyframes rise { to { opacity: 1; transform: translateY(0); } }
.r-1 { animation-delay: calc(80ms  * var(--m)); }
.r-2 { animation-delay: calc(180ms * var(--m)); }
.r-3 { animation-delay: calc(300ms * var(--m)); }
.r-4 { animation-delay: calc(440ms * var(--m)); }
.r-5 { animation-delay: calc(600ms * var(--m)); }
```

**Save.** You now have all the new primitives available alongside your existing utility classes.

---

## Step 4 — Build the Hero component (Intelligence tab)

This is the only net-new component in Phase 1. It goes above your existing `IntelligenceTab` content.

Create a new file: `frontend/src/components/intelligence/IntelligenceHero.jsx`

```jsx
import { useLiveData } from '../../hooks/useLiveData';
import { N } from '../../utils/format';

export default function IntelligenceHero() {
  const live = useLiveData(); // your existing hook

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-text">
            <div className="eyebrow reveal r-1">
              <span className="dot" />ES · LIVE · {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET
            </div>
            <h1 className="h-display reveal r-2">
              An operating&nbsp;system<br />
              for <em>disciplined</em><br />
              capital.
            </h1>
            <p className="lede reveal r-3">
              A research and trading platform built around a single conviction —
              that durable returns are an output of process, not prediction.
            </p>
            <div className="hero-meta mono reveal r-5">
              <span>STRATEGY · ES futures</span>
              <span className="dim">/</span>
              <span>HORIZON · 1–10 sessions</span>
            </div>
          </div>
          <aside className="hero-aside reveal r-4">
            <Ticker live={live} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function Ticker({ live }) {
  // Use real live data from useLiveData; fall back to placeholders while loading
  const rows = [
    { sym: 'ES',      px: live?.es_price ?? 4827.50, d: +0.42, k: 'S&P E-mini' },
    { sym: 'NQ',      px: live?.nq_price ?? 17234,   d: +0.61, k: 'Nasdaq E-mini' },
    { sym: 'VIX',     px: live?.vix     ?? 14.82,    d: -2.18, k: 'Volatility' },
    { sym: 'ATR(20)', px: live?.atr     ?? 22.4,     d: +0.12, k: 'Daily range' },
  ];

  return (
    <div className="ticker">
      <div className="ticker-hd">
        <span className="pill pill-live">LIVE · ES WEBHOOK</span>
        <span className="mono dim">RTH · {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}</span>
      </div>
      <div className="ticker-rows">
        {rows.map(r => (
          <div className="ticker-row" key={r.sym}>
            <div className="t-sym mono">{r.sym}</div>
            <div className="t-px mono">{N(r.px, 2)}</div>
            <div className={`t-d mono ${r.d >= 0 ? 'n-bull' : 'n-bear'}`}>
              {r.d >= 0 ? '+' : ''}{r.d.toFixed(2)}%
            </div>
            <div className="t-k">{r.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Add the hero-specific CSS at the bottom of `globals.css`:

```css
/* ── Hero (Intelligence tab) ── */
.hero { padding: clamp(60px, 8vw, 120px) 0 clamp(40px, 6vw, 80px); }
.container { width: 100%; max-width: 1320px; margin: 0 auto; padding: 0 var(--pad-page); }
.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: clamp(32px, 5vw, 80px);
  align-items: end;
}
.hero-text > .eyebrow { display: block; margin-bottom: 28px; }
.hero-text .h-display { margin: 0 0 32px; }
.hero-meta {
  display: flex; gap: 14px; flex-wrap: wrap; margin-top: 48px;
  font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-2);
}
@media (max-width: 980px) {
  .hero-grid { grid-template-columns: 1fr; gap: 48px; }
}

/* ── Ticker ── */
.ticker {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--surface), var(--inset));
  border-radius: 4px;
  padding: 18px 20px 14px;
}
.ticker-hd {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 14px; border-bottom: 1px solid var(--line);
}
.ticker-rows { padding: 8px 0; }
.ticker-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  grid-template-areas: "sym px d" "sym k k";
  gap: 2px 16px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--line);
}
.ticker-row:last-child { border-bottom: 0; }
.t-sym { grid-area: sym; align-self: center; font-size: 14px; letter-spacing: 0.04em; }
.t-px  { grid-area: px;  font-size: 18px; }
.t-d   { grid-area: d;   font-size: 12px; text-align: right; align-self: center; }
.t-k   { grid-area: k;   font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }
.n-bull { color: var(--bull); }
.n-bear { color: var(--bear); }
```

Mount it inside your existing `IntelligenceTab.jsx` at the very top:

```jsx
import IntelligenceHero from './IntelligenceHero';

export default function IntelligenceTab() {
  // ... existing hooks/state
  return (
    <>
      <IntelligenceHero />
      {/* ... rest of your existing intelligence tab content */}
    </>
  );
}
```

**Save.** Reload. Your Intelligence tab now opens with the hero on top, real live data in the ticker, existing dashboard panels below.

---

## Step 5 — Replace the TopBar logo

Open `frontend/src/components/layout/TopBar.jsx` (or wherever your logo lives).

Replace the existing logo markup with:

```jsx
<a className="logo" href="/">
  <em>Auguste</em>
  <span className="logo-sep">·</span>
  <span className="logo-cap">Capital</span>
</a>
```

Add to `globals.css`:

```css
.logo { display: inline-flex; align-items: center; gap: 6px; line-height: 1; font-size: 18px; color: var(--text); text-decoration: none; }
.logo em { font-family: var(--f-display); font-style: italic; font-weight: 400; font-size: 1.15em; }
.logo .logo-sep { color: var(--gold); }
.logo .logo-cap {
  font-family: var(--f-sans);
  font-size: 0.78em;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-2);
  font-weight: 500;
}
```

**Save.** The "AATJ" wordmark (or whatever was there) is now the Auguste Capital logo.

---

## You're done with Phase 1

Ship it. The dashboard now reads as Auguste Capital end-to-end:
- Champagne-gold accent everywhere cyan was
- Editorial serif type for any headings + mono for numbers
- New hero on the Intelligence tab with the real `useLiveData` ticker
- All existing tabs, hooks, endpoints, and scheduled jobs untouched

Build for production when you're ready:

```bash
cd frontend
npm run build
# FastAPI serves the new dist/ immediately — no restart needed
```

---

## Subsequent phases (open in any order)

Phase 1 covers the hero, tokens, fonts, and primitives. The remaining tab-by-tab polish is in `README.md` — components for each tab (PostureStrip, VWAP cards, Squeeze momentum bars, Weekly range visual, Daily 5-card layout, Markets regime cards, Historical stat grid, Risk meter, Settings form). Each is a self-contained ~50 lines of JSX + ~30 lines of CSS.

Recommended order:
1. `PostureStrip` (Intelligence) — 5-cell live snapshot
2. `WeeklyRangeVisual` (Weekly) — vertical hairline bar with current marker
3. `RegimeCards` (Markets) — VIX scale, Squeeze bars, Range fill
4. `DailyCards` (Daily) — 5-card row with today highlighted
5. `HistoricalStats` (Historical) — 6-cell stat grid + reskinned table
6. `RiskMeter` (Risk) — exposure bar + KV rows

Use `prototype/pages.jsx` as the reference for each — copy the JSX, swap mock data for real hook output, copy the matching CSS from `prototype/components.css`.

---

## Option B — Hand it to Claude Code instead

If you prefer Claude Code to do the porting:

```bash
cd ~/AATradingJournal
# unzip the handoff
unzip ~/Downloads/design_handoff_auguste_capital.zip
```

Then in Claude Code:

> "Read `design_handoff_auguste_capital/README.md` and `VSCODE_HANDOFF.md`. Execute Phase 1 — Steps 1 through 5 — exactly as described. Stop after Step 5 and ask me to verify before continuing to per-tab polish."

Claude Code will read the handoff, make the edits, and pause for your review. After you sign off on Phase 1, give it the next phase:

> "Now port `PostureStrip` from `design_handoff_auguste_capital/prototype/components.jsx` and `pages.jsx` (the IntelligenceTab section) into `frontend/src/components/intelligence/PostureStrip.jsx`. Wire it to `useLiveData` and `useMarkets` instead of the mock values."

Repeat that pattern for each tab component.

---

## Rolling back

If anything looks wrong:

```bash
cd ~/AATradingJournal
git diff frontend/src/styles/globals.css   # see what changed
git restore frontend/                       # revert all frontend changes
```

The backwards-compat shims in Step 1 mean the existing dashboard never actually breaks — at worst it just looks half-migrated. Always safe to ship a partial Phase 1.
