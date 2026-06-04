# Handoff: Auguste Capital — Dashboard Reskin

A complete dark-themed, institutional-grade visual reskin of the existing **AATradingJournal** dashboard at augustecapital.net.

The architecture in `CLAUDE.md` is preserved — same React 18 + Vite + plain CSS stack, same `frontend/src/styles/globals.css` token approach, same component folder structure (`components/intelligence/`, `components/markets/`, etc.), same hooks (`useLiveData`, `useForecast`, `useMarkets`, `useIntelligence`), same FastAPI endpoints and WebSocket flow. **Only the visual layer changes.**

---

## About the Design Files

The files in `prototype/` are **design references** created in HTML/React + Babel. They are not drop-in production code. The task for Claude Code is to translate this visual system into your existing Vite app, preserving all data flow and component identity.

The prototype loads React + Babel from a CDN purely so it can be previewed in a browser without a build step. In production, you'll import CSS via Vite, install fonts via `@fontsource` (or `<link>` Google Fonts in `index.html`), and build out tab content as JSX modules in the existing `components/` folders.

## Fidelity

**High-fidelity.** All colors, typography, spacing, hairlines, motion timings, and component anatomy are final. Recreate pixel-faithfully.

---

## Scope

Single surface: the dashboard. 7 tabs, all reskinned. The Intelligence tab carries a **hero panel** at the top — display headline + live ES/NQ/VIX/ATR ticker — that establishes the brand and stays only on that tab.

No marketing site. No public-facing landing pages. No sign-in or invitation flows.

| Tab            | Existing component (per CLAUDE.md) | What the reskin does                                                                |
|----------------|------------------------------------|-------------------------------------------------------------------------------------|
| Intelligence   | `IntelligenceTab`                  | Hero (display + ticker) → posture strip → main panel (price + plan) → VWAP stack detail → TTM Squeeze momentum bars |
| Weekly         | `WeeklyTab`                        | Editorial summary + projected-range visual + 4-point thesis card                    |
| Daily          | `DailyTab`                         | 5 day-cards with today highlighted in gold + summary table (range used, R hits, P&L) |
| Markets        | `MarketsTab`                       | 3 regime cards (VIX, Squeeze, Weekly Range) with bespoke visuals each + compact ticker |
| Historical     | `HistoricalTab`                    | 6-cell stat grid (win rate, avg R, sessions, bull/bear/flat days) + snapshots table |
| Risk           | `RiskTab`                          | Unit-definition card + exposure meter + 5 session rules                             |
| Settings       | `SettingsTab`                      | Manual override form + webhook status + scheduler status                            |

---

## The hero (Intelligence tab only)

```
┌────────────────────────────────────────────────────────────┐
│  ● ES · MAR26 · LIVE · 10:42:08 ET                         │
│                                                            │
│  An operating system            ┌────────────────────────┐ │
│  for disciplined                │ ● LIVE · ES WEBHOOK    │ │
│  capital.                       ├────────────────────────┤ │
│                                 │ ES   4,827.50  +0.42% │ │
│  A research and trading…        │ NQ  17,234.25  +0.61% │ │
│                                 │ VIX     14.82  −2.18% │ │
│  STRATEGY · ES futures          │ ATR     22.40  +0.12% │ │
│  HORIZON · 1–10 sessions        ├────────────────────────┤ │
│  SESSION · RTH · MON 23 MAY     │  ╱╲╱  ╱╲╱╲  ╲╱╲╱  ╱╲╱ │ │
│                                 └────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Display headline in **Instrument Serif** with italic emphasis word ("disciplined") in champagne gold
- 3 hero layouts exposed as a tweak: **Split** (default), **Centered**, **Editorial** (giant 3-line phrase)
- Right pane: `<Ticker>` component — 4 instruments, sim drift in the prototype, wire to `useLiveData` in production
- Below 980px viewport: hero collapses to single column, ticker drops below text

The hero only renders on the Intelligence tab. Switching tabs replaces the hero with the tab's own header.

---

## Design Tokens

Replace the contents of `frontend/src/styles/globals.css`'s `:root` block with the tokens below.

### Colors

```css
:root {
  /* Surfaces — warm near-black */
  --bg:        #09080a;    /* page background        (was --bg) */
  --bg-2:      #0c0b0d;    /* dashboard chrome bg */
  --surface:   #111012;    /* card                   (was --card) */
  --surface-2: #15141a;    /* hover / inset         (was --card2) */
  --inset:     #0d0c0e;    /* ticker gradient bottom */

  /* Hairlines */
  --line:      rgba(255,255,255,0.06);   /* subtle border (was --border) */
  --line-2:    rgba(255,255,255,0.10);   /* stronger      (was --border2) */
  --line-3:    rgba(255,255,255,0.18);   /* hover */

  /* Text */
  --text:      #eceae3;
  --text-2:    #b3aea0;
  --text-3:    #7a766c;
  --text-4:    #4a4740;

  /* Accent — champagne gold (replaces cyan) */
  --gold:      #c9a96a;    /* primary accent (was --accent) */
  --gold-2:    #a48954;
  --gold-soft: rgba(201,169,106,0.14);
  --gold-line: rgba(201,169,106,0.30);

  /* Signal semantics — used only for live data */
  --bull:      #6fbf8a;
  --bear:      #c8665c;
  --neutral:   #c9a96a;    /* fold orange into gold */
}
```

**Backwards-compat shims** — keep until every call site has been migrated to the new names:

```css
:root {
  --card:    var(--surface);
  --card2:   var(--surface-2);
  --border:  var(--line);
  --border2: var(--line-2);
  --text2:   var(--text-2);
  --text3:   var(--text-3);
  --accent:  var(--gold);
  --accent2: var(--gold-2);
  --orange:  var(--gold);
  --purple:  var(--gold);  /* retire purple; reuse gold */
}
```

### Typography

```css
:root {
  --f-display: "Instrument Serif", Georgia, serif;
  --f-sans:    "Geist", ui-sans-serif, system-ui, sans-serif;
  --f-mono:    "JetBrains Mono", ui-monospace, monospace;
  --sans: var(--f-sans);   /* shim */
  --mono: var(--f-mono);   /* shim */
}
```

Add to `frontend/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap">
```

Or install `@fontsource/instrument-serif`, `@fontsource/geist-sans`, `@fontsource/jetbrains-mono` and import in `main.jsx`.

### Type ramp

| Role              | Family             | Size                          | Weight | Line height | Letter-spacing       |
|-------------------|--------------------|-------------------------------|--------|-------------|----------------------|
| Display (hero)    | Instrument Serif   | `clamp(48px, 7.6vw, 116px)`   | 400    | 0.96        | −0.015em             |
| Tab heading       | Instrument Serif   | `clamp(48px, 6vw, 96px)`      | 400    | 1.02        | −0.012em             |
| Section heading   | Instrument Serif   | `clamp(36px, 4.8vw, 64px)`    | 400    | 1.02        | −0.012em             |
| Card heading      | Geist              | 17px                          | 500    | 1.3         | −0.005em             |
| Body              | Geist              | 15px (compact: 14px)          | 400    | 1.55        | normal               |
| Lede              | Geist              | `clamp(16px, 1.3vw, 19px)`    | 400    | 1.55        | normal               |
| Eyebrow           | JetBrains Mono     | 11px                          | 400    | 1.4         | 0.14em UPPERCASE     |
| Data / numeric    | JetBrains Mono     | 13.5px                        | 400    | 1.3         | tabular-nums         |
| Large numeric (price) | JetBrains Mono | `clamp(40px, 5vw, 64px)`      | 400    | 1.0         | −0.02em              |
| Stat (regime)     | JetBrains Mono     | `clamp(56px, 7vw, 88px)`      | 400    | 1.0         | −0.02em              |

**Italic = accent.** Use `<em>` inside display headings, colored `var(--gold)`, italic style.

### Spacing & density

```css
:root {
  --pad-page:    clamp(20px, 4vw, 64px);
  --pad-section: clamp(56px, 8vw, 120px);
  --pad-card:    24px;
  --gap:         24px;
  --gap-sm:      12px;
}
[data-density="compact"] {
  --pad-page:    clamp(16px, 3vw, 40px);
  --pad-section: clamp(36px, 5vw, 72px);
  --pad-card:    18px;
  --gap:         16px;
  --gap-sm:      8px;
}
```

Apply density at root: `<html data-density="editorial">` or `compact`. Pick the production default per personal preference (the prototype defaults to editorial).

### Border radius

| Use                          | Radius |
|------------------------------|--------|
| Cards, tables, ticker        | 4px    |
| Buttons, pills, inputs, role-toggles | 2px |
| Dashboard chrome panel       | 6px    |

Hard, near-square corners are intentional. Reserve softness for interactive controls.

### Elevation

Only one shadow in the entire system, used on the main `<DashboardPreview>` chrome:

```css
box-shadow:
  0 30px 80px rgba(0,0,0,0.55),
  0 1px 0 rgba(255,255,255,0.04) inset;
```

Everything else uses hairlines, not shadows.

### Motion

```css
:root {
  --m: 0.35;                              /* 0–1 intensity scalar */
  --dur-s: calc(160ms * (0.4 + var(--m)));
  --dur-m: calc(420ms * (0.4 + var(--m)));
  --dur-l: calc(900ms * (0.4 + var(--m)));
  --rise:  calc(14px  * var(--m));
  --ease:  cubic-bezier(0.2, 0.7, 0.2, 1);
}
.reveal { opacity: 0; transform: translateY(var(--rise));
  animation: rise var(--dur-l) var(--ease) forwards; }
@keyframes rise { to { opacity: 1; transform: translateY(0); } }
.r-1 { animation-delay: calc(80ms  * var(--m)); }
.r-2 { animation-delay: calc(180ms * var(--m)); }
.r-3 { animation-delay: calc(300ms * var(--m)); }
.r-4 { animation-delay: calc(440ms * var(--m)); }
.r-5 { animation-delay: calc(600ms * var(--m)); }
```

Live indicator pulse (live dots, posture eyebrows):

```css
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--gold-soft); }
  50%      { opacity: 0.55; box-shadow: 0 0 0 6px transparent; }
}
```

---

## Component anatomy

Full source for each in `prototype/components.jsx` (atoms) and `prototype/pages.jsx` (tab content). Below: what to build in each existing folder.

### `<Logo variant>` — 4 variants

| Variant            | Use                  | Anatomy |
|--------------------|----------------------|---------|
| `wordmark-italic`  | **Default** in nav   | Instrument Serif italic "Auguste" + gold "·" + Geist tracked caps "CAPITAL" |
| `wordmark-caps`    | Alternate            | All Geist 600, 0.22em tracking |
| `monogram`         | Compact              | 28px hairline circle with serif italic "A", gold + wordmark |
| `glyph`            | **Favicon basis**    | Horizon line through circle (sextant motif), gold + tracked caps |

### `<Nav>` — top bar

Lives in `components/layout/TopBar.jsx` (replaces existing).

- Sticky, `position: sticky; top: 0; z-index: 50`
- Background: `rgba(9,8,10,0.78)` + `backdrop-filter: blur(18px) saturate(140%)`
- Height: 64px
- Layout (flex, space-between): brand · centered tab links · right-side LIVE pill + clock
- Active tab: gold text + 1px gold underline anchored 22px below at the hairline rule
- Below 1180px: tab links hide from the top row; render `<MobileTabs>` strip below the nav (horizontal scrollable pills)
- All link text: `white-space: nowrap`

### Ticker — `components/intelligence/Ticker.jsx`

Used in hero. 4 rows (ES, NQ, VIX, ATR(20)), each:
- `grid-template-columns: 80px 1fr 80px`
- Row 1: symbol (mono 14px) · price (mono 18px) · % change (right-aligned, bull/bear color)
- Row 2: full-width subtitle (mono 11px UPPERCASE 0.08em, text-3)
- Dashed hairline between rows; solid hairline above sparklines
- 4 sparklines at the bottom in a 1:1:1:1 grid, 24px tall

In production: wire to `useLiveData`'s WebSocket stream; replace `setInterval` drift with real `price_update` messages.

### `<PostureStrip>` — `components/intelligence/PostureStrip.jsx`

5 cells separated by 1px vertical hairlines. Each cell: eyebrow + big serif value (28px, tone-colored) + 12px subtitle.

Cells: **VWAP STACK** · **ATR REGIME** · **VIX REGIME** · **TTM SQUEEZE** · **WEEKLY RANGE**

Pulls from `useLiveData` + `useMarkets`.

Below 980px: collapse to 2-column grid with horizontal hairlines.

### Intelligence tab — `components/intelligence/IntelligenceTab.jsx`

After hero + posture strip, three more sections:

1. **Main dashboard panel** (`<DashboardPreview>`) — browser-chrome panel containing:
   - Top strip: ES · MAR26 · LIVE eyebrow → mono 64px price with last two digits gold → mono delta line
   - Right of top strip: 6-cell KV grid (D-VWAP, W-VWAP, M-VWAP, ATR(20), VIX, SQUEEZE)
   - Below: 1.7fr / 1fr split — chart card on left (260px tall, VWAP anchor dashed line, gradient fill), plan card on right (5 plan rows + 3 regime rows)

2. **VWAP stack detail** — 3-column grid of cards: Daily / Weekly / Monthly. Each card: eyebrow + mono 48px value + tone-colored delta + description.

3. **TTM Squeeze momentum** — Big "RELEASE ↑" current-state header in gold, then a 24-bar histogram strip (120px tall, 3px gaps). Bars use 4 states:
   - `mom-up` (small positive): `text-3` color
   - `mom-down` (small negative): `text-4` color
   - `mom-fired mom-up` (signal): **gold** with soft glow
   - `mom-fired mom-down` (signal): **bear** red

### Weekly tab — `components/weekly/WeeklyTab.jsx`

- Tab header: eyebrow + display heading + lede paragraph
- Two-card grid (1fr / 1.4fr):
  - **Projected range visual:** vertical bar 220px tall, gold gradient fill from bottom to current-price marker, "USED 82%" hairline ticker on the right with bound labels above/below
  - **Weekly thesis card:** 4 numbered points (i / ii / iii / iv) with mini-headings in Instrument Serif 19px

### Daily tab — `components/daily/DailyTab.jsx`

- 5 daily cards in a row (`grid-template-columns: repeat(5, 1fr)`)
- Each card: day code (mono 18px) + date + posture pill, then R1 / PIVOT / S1 rows
- **Today's card** gets `border-color: var(--gold-line)` and a gold-soft gradient background
- Below: summary table (Session / Bias / Range used / R1 hit / S1 hit / VWAP held / P&L)

### Markets tab — `components/markets/MarketsTab.jsx`

Three regime cards in a `repeat(3, 1fr)` grid:

| Card           | Big number       | Visual below                                |
|----------------|------------------|---------------------------------------------|
| VIX Regime     | "14.82" (88px)   | 4-zone hairline scale: complacent/elevated/fear/panic with marker |
| Squeeze        | "3 bars"         | 18-bar momentum histogram (fired bars gold) |
| Weekly Range   | "82%"            | Single horizontal hairline fill bar         |

Below: a compact `<Ticker compact />` (max-width 480px).

### Historical tab — `components/historical/HistoricalTab.jsx`

- 6-cell stat strip (Win rate · Avg R · Sessions · Bull · Bear · Flat) — 1px verticals, big mono values
- Snapshots table: Session / Close / Vol / ATR / VIX / Posture / P&L
  - Header in gold mono UPPERCASE on `--inset` background
  - Hover row: `--surface-2`

### Risk tab — `components/risk/RiskTab.jsx`

- 2-card grid:
  - **Unit definition:** 5 KV rows (capital at risk, contracts, stop dist, target dist, VIX adjustment)
  - **Exposure:** horizontal meter (8px track, bull-to-gold gradient fill, 0–100% labels) + 4 KV rows
- Full-width rules card below: 5 numbered session rules

### Settings tab — `components/settings/SettingsTab.jsx`

- 1.4fr / 1fr grid:
  - **Override form card:** ES price input + VIX input + toggle row (use webhook / use manual values) + save button
  - **Side panel:** webhook status + scheduler status + build/tunnel info as KV rows

### `<Footer>` — slim

Single hairline strip: logo + tagline on the left; LIVE pill + version + copyright on the right.

### Form controls (Settings tab)

```css
.field input {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text);
  font-family: var(--f-sans);
}
.field input:focus {
  border-color: var(--gold-line);
  background: var(--surface-2);
  outline: none;
}
```

Toggle pills (segmented control):
- Default: `surface` bg, `line` border, `text-2` color
- Active: `gold-soft` bg, `gold-line` border, `gold` text

---

## Existing-class migration

Map your existing `globals.css` utility classes onto the new system. The shims above make this incremental.

| Existing class       | New treatment                                                                  |
|----------------------|---------------------------------------------------------------------------------|
| `.topbar`            | Becomes `.nav` — sticky, hairline bottom, 64px                                 |
| `.logo`              | Replace with `<Logo variant="wordmark-italic" />`                              |
| `.stat-pill`         | Becomes `.kv` — mono label + mono value, baseline-aligned                      |
| `.tabbar / .tab`     | Use nav-link styling: 13px Geist, text-2 → gold on active with underline       |
| `.card`              | 4px radius, 1px `--line`, `--surface` bg, 24px padding (compact: 18px)         |
| `.card-hdr`          | Flex row: eyebrow on left, optional pill on right                              |
| `.kv-row`            | `display: flex; justify-content: space-between`, dashed border-bottom         |
| `.badge-bull/bear`   | Becomes `.pill-bull / .pill-bear` (2px radius, no fill, tinted border)         |
| `.sbtn / .sbtn-primary` | Becomes `.btn / .btn-primary`                                              |
| `.n-bull / .n-bear`  | Keep — color is correct                                                        |
| `.tag-live`          | Becomes `.pill-live` — pulsing green dot                                       |
| `.posture-buy/sell/neutral` | Use tone modifiers: `.tone-bull / .tone-bear / .tone-gold`               |
| `.m-fast-up`         | Use `.tone-gold` (fast = signal-strength)                                      |
| `.m-slow-up`         | Use `.tone-gold` at lower opacity, or keep current color                       |
| `.m-fast-down`       | `.tone-bear`                                                                   |
| `.m-neutral`         | `.muted`                                                                       |

---

## Interactions & Behavior

- **Reveal on mount:** Hero text, tab headings, and primary section headings animate in with `.reveal .r-N` staggered classes. Driven by `--m` scalar.
- **Hover:** All interactive elements transition `var(--dur-s)` cubic-bezier(0.2, 0.7, 0.2, 1). Buttons brighten background; cards lift to `--surface-2`; arrow glyphs translate +3px.
- **Active tab:** Gold color + 1px gold underline anchored to the hairline rule beneath the nav.
- **Live data pulse:** `.pill-live::before` and `.eyebrow .dot` pulse on a 2.2–2.4s loop. Bull-green dot in pills, gold dot in eyebrows.
- **Today's daily card:** Gold-soft gradient background, gold-line border. Visual emphasis without color saturation.
- **Settings save:** Wire to existing `POST /live` endpoint per `routers/live.py`. Prototype's button is non-functional.

---

## State Management

**Unchanged.** Use the existing hooks exactly as documented in `CLAUDE.md`:

- `useLiveData` — drives `<Ticker>`, top-strip price/delta, KV grid, posture strip live values
- `useForecast` — drives Weekly + Daily tabs
- `useMarkets` — drives Markets tab regime cards
- `useIntelligence` — drives Intelligence tab squeeze/momentum

The prototype simulates these with `setInterval` drift; production replaces simulation with real WebSocket / polling subscriptions.

Routing in the prototype is hash-based (`#/intelligence`, `#/weekly`, …). Keep your existing tab state machinery (`App.jsx` tab routing) — just point each route at the new tab components.

---

## Responsive Behavior

| Breakpoint    | Behavior |
|---------------|----------|
| ≥ 1180px      | Full desktop nav with all tabs inline; 5-column daily; 3-column regime; 6-cell historical |
| 980 – 1180px  | Nav collapses to logo + status; `<MobileTabs>` strip appears below nav (horizontal scroll) |
| 880 – 980px   | Hero → single column; posture → 2-column; regime → single column; daily → 2-column |
| ≤ 600px       | Daily → 1 column; historical stats → 2 columns; settings → 1 column                |

All breakpoints are `(max-width: …)`. No JS-driven layout switching.

---

## Files in this bundle

```
design_handoff_auguste_capital/
├── README.md                    ← this file
└── prototype/
    ├── index.html               ← entry point; CDN React + Babel
    ├── styles.css               ← design tokens, type, primitives, motion
    ├── components.css           ← nav, hero, ticker, dashboard, tabs, footer, form
    ├── app.jsx                  ← root + tab router + Tweaks state
    ├── components.jsx           ← Logo, Nav, Ticker, PostureStrip, PriceChart, KV
    ├── pages.jsx                ← 7 tab components
    └── tweaks-panel.jsx         ← in-design Tweaks panel (strip in production)
```

Preview locally:

```bash
cd prototype/
python3 -m http.server 8080
# open http://localhost:8080
```

---

## Out of scope / open items

- **Real WebSocket wiring** in the prototype is mocked. Replace `useLiveTick` calls in `components.jsx` with the existing `useLiveData` hook.
- **Real chart** in `<PriceChart>` is procedural noise. Replace with a Recharts / Lightweight Charts component fed from `LiveData` + `AtrSnapshot` history.
- **Real table data** in Historical / Daily is hardcoded. Wire to `GET /historical` and `GET /forecast/current`.
- **Tweaks panel** is for design exploration only — strip it from production. Pick one logo variant, one type pairing, one hero layout, one density default; bake them in.
- **Logo glyph** (sextant motif) is functional but minimal — a proper logo pass would refine proportions for use as favicon and dock icon. Recommend `wordmark-italic` for nav and a refined `glyph` for favicon.

---

## Recommended implementation order

Each step is independently shippable.

1. **Tokens.** Replace `:root` in `frontend/src/styles/globals.css`. Keep shims. Verify the existing dashboard still renders (cyan → gold automatically).
2. **Fonts.** Install / import Instrument Serif + Geist + JetBrains Mono. Verify all existing text adopts the new families.
3. **Primitives.** Migrate `.card`, `.btn`, `.pill`, `.kv` to new anatomy. The existing tabs inherit automatically.
4. **Nav + Footer.** Build `<Logo>` + `<Nav>` + `<MobileTabs>` + slim `<Footer>` in `components/layout/`. Replace existing `TopBar`.
5. **Intelligence hero + posture strip.** Net-new — slot above existing `IntelligenceTab` content. Move existing tab body underneath as the "main dashboard panel" with new chrome.
6. **Per-tab polish.** Weekly → Daily → Markets → Historical → Risk → Settings, in that order. Each tab is mostly already correct in data shape; only visual treatment changes.
