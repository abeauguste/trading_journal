# AATradingJournal — Claude Context

## What this project is
A personal ES futures trading journal and intelligence dashboard. It ingests live market data from TradingView via webhook, computes VWAP posture, ATR regime, VIX analysis, and TTM Squeeze momentum, then generates AI-driven weekly and daily trading plans displayed in a React dashboard.

## Live URLs
- **Dashboard**: https://augustecapital.net
- **Webhook endpoint**: https://api.augustecapital.net/webhook/es
- **API base**: https://api.augustecapital.net

## Tech stack
- **Backend**: Python 3, FastAPI, SQLAlchemy, SQLite, APScheduler, uvicorn
- **Frontend**: React 18, Vite, plain CSS (no UI library, no Tailwind)
- **Tunnel**: Cloudflare named tunnel `trading-journal` (auto-starts via macOS launchd)
- **Data source**: TradingView Pine Script webhook alerts → POST /webhook/es

## Project structure
```
AATradingJournal/
├── backend/
│   ├── main.py              # FastAPI app, router registration, static file serving
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── intelligence.py      # VWAP posture, ATR regime, weekly/daily forecast logic
│   ├── scheduler.py         # APScheduler jobs (Mon 7:30 AM forecast, 6 PM day advance)
│   ├── fetchers.py          # yfinance VIX fetcher, bootstrap logic
│   ├── migrations.py        # SQLite ALTER TABLE migrations (run at startup)
│   ├── database.py          # SQLAlchemy engine + session
│   ├── websocket_manager.py # WebSocket broadcast manager
│   └── routers/
│       ├── webhook.py       # POST /webhook/es — TradingView data ingestion
│       ├── forecast.py      # GET /forecast/current, POST /forecast/generate
│       ├── markets.py       # GET /markets/regime — VIX, squeeze, weekly range
│       ├── live.py          # GET/POST/DELETE /live — LiveData table
│       ├── intelligence.py  # GET /intelligence/latest, POST /intelligence/generate
│       ├── calendar.py      # Economic + earnings calendar
│       ├── weeks.py         # Legacy PlanWeek endpoints (archived data)
│       ├── historical.py    # Historical snapshots
│       └── websocket.py     # WS /ws endpoint
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component, tab routing, hook composition
│   │   ├── api.js           # Axios client (baseURL from VITE_API_BASE env var)
│   │   ├── hooks/
│   │   │   ├── useLiveData.js    # WebSocket connection, live price/VWAP/ATR state
│   │   │   ├── useForecast.js    # Weekly/daily forecast polling + forecastUpdated event
│   │   │   ├── useMarkets.js     # Markets regime polling (60s interval)
│   │   │   └── useIntelligence.js
│   │   ├── components/
│   │   │   ├── layout/           # TopBar, TabBar, Footer, WeekSelector, Toast
│   │   │   ├── intelligence/     # IntelligenceTab — VWAP stack, ATR, VIX, momentum
│   │   │   ├── weekly/           # WeeklyTab — AI-generated weekly forecast
│   │   │   ├── daily/            # DailyTab — 5-day plan cards + summary table
│   │   │   ├── markets/          # MarketsTab — VixRegimeCard, SqueezeCard, WeeklyRangeCard
│   │   │   ├── historical/       # HistoricalTab
│   │   │   ├── risk/             # RiskTab
│   │   │   └── settings/         # SettingsTab — manual price/VIX override
│   │   ├── styles/
│   │   │   └── globals.css       # All styles — dark theme, CSS variables, utility classes
│   │   └── utils/
│   │       └── format.js         # N() number formatter, momClass, postureClass helpers
│   ├── .env.production           # VITE_API_BASE= (empty), VITE_API_HOST=api.augustecapital.net
│   └── dist/                     # Built output served by FastAPI (run: npm run build)
└── CLAUDE.md                     # This file
```

## Design system (globals.css)
All styling is in `frontend/src/styles/globals.css`. Dark theme only.

### CSS variables
```css
--bg          /* page background — very dark */
--card        /* card background */
--card2       /* secondary card / inset background */
--border      /* subtle border color */
--border2     /* slightly stronger border */
--text        /* primary text */
--text2       /* secondary text */
--text3       /* muted/label text */
--accent      /* cyan — live prices, highlights */
--accent2     /* softer cyan */
--bull        /* green — bullish signals */
--bear        /* red — bearish signals */
--gold        /* amber/gold — events, warnings */
--neutral     /* amber — neutral signals */
--orange      /* orange — weak bear */
--purple      /* purple — special signals */
--mono        /* monospace font family */
--sans        /* sans-serif font family */
```

### Utility classes
```
Layout:   .grid .g2 .g3 .g4 .g12 .g21
Cards:    .card .card-hdr .card-title .card-body
KV rows:  .kv-row .kv-key .kv-val
Badges:   .badge .badge-bull .badge-bear .badge-neutral
Tags:     .tag .tag-live .tag-manual .tag-bear
Buttons:  .sbtn .sbtn-primary
Numbers:  .n-bull .n-bear .n-accent .n-gold .n-purple
Posture:  .posture-buy .posture-sell .posture-neutral (etc.)
Momentum: .m-fast-up .m-slow-up .m-fast-down .m-slow-down .m-neutral
TopBar:   .topbar .logo .topbar-stats .stat-pill .slabel .svalue
Tabs:     .tabbar .tab .tab.active
```

## Tabs / pages
| Tab | Component | Data source |
|---|---|---|
| Intelligence | IntelligenceTab | useLiveData (WS) + useIntelligence |
| Weekly | WeeklyTab | useForecast → GET /forecast/current |
| Daily | DailyTab | useForecast → GET /forecast/current |
| Markets | MarketsTab | useMarkets → GET /markets/regime + useLiveData |
| Historical | HistoricalTab | GET /historical |
| Risk | RiskTab | selected PlanWeek |
| Settings | SettingsTab | manual live data override |

## Data flow
```
TradingView Pine Script alert
  → POST https://api.augustecapital.net/webhook/es
  → stores WebhookEvent, updates LiveData, creates AtrSnapshot
  → computes IntelligenceReport
  → patches DailyForecast levels (update_daily_levels)
  → broadcasts WebSocket messages:
      "price_update"        → useLiveData updates header stats
      "intelligence_update" → useLiveData updates VWAP/ATR/momentum panels
      "forecast_updated"    → useForecast refetches daily plan levels
```

## Scheduled jobs (APScheduler, America/New_York)
- **Monday 7:30 AM ET** — generate full WeeklyForecast + 5 DailyForecast rows
- **Mon–Fri 6:00 PM ET** — advance TODAY to next trading day, refresh next day's levels

## Key business logic
- **VWAP posture**: price vs daily/weekly/monthly VWAP anchors → FULL BULL / MIXED / FULL BEAR
- **ATR regime**: rolling 20-bar percentile → EXPANDED / NORMAL / COMPRESSED
- **VIX regime**: <15 COMPLACENT, 15–25 ELEVATED, 25–35 FEAR, >35 PANIC
- **Squeeze**: TTM Squeeze signal from TradingView ("long"/"short"/"neutral")
- **TODAY advancement**: 6 PM ET — weekday logic in DailyTab.jsx IIFE
- **Weekly range projection**: current price ± (ATR × 2.5) anchored to LiveData.es_price
- **Pivot levels**: previous week's AtrSnapshot close_price high/low/close → R1/S1

## Important constraints
- `WebhookEvent` table includes synthetic test rows — never aggregate from it for live calculations
- Use `LiveData` table for current values (es_price, vwap_daily, etc.)
- Use `AtrSnapshot` table for real indicator history (only created by real /webhook/es calls)
- `PlanWeek` rows are all archived — filtered with `archived == False` (returns nothing)
- Frontend served as static build from FastAPI — run `npm run build` after frontend changes
- After frontend build, uvicorn serves updated files immediately (no restart needed)

## Running locally (development)
```bash
# Terminal 1 — backend
cd /Users/abrahamauguste/AATradingJournal
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend dev server
cd /Users/abrahamauguste/AATradingJournal/frontend
npm run dev   # runs on localhost:5173 with /api proxy to :8000
```

## Deploying frontend changes to production
```bash
cd /Users/abrahamauguste/AATradingJournal/frontend
npm run build
# FastAPI serves the new dist/ immediately — no restart needed
```

## Cloudflare tunnel
- Named tunnel: `trading-journal` (id: d718c691-c8e7-4eaa-bfb0-703d210343b4)
- Config: `~/.cloudflared/config.yml`
- Auto-starts via macOS launchd (installed with `sudo cloudflared service install`)
- Manual start if needed: `/opt/homebrew/bin/cloudflared tunnel run trading-journal`
