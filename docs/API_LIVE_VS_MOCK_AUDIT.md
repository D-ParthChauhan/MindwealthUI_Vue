# API Live vs Mock — Page-Wise Audit

**Prepared:** 2026-06-17  
**Scope:** All pages in MindWealth Alpha Terminal UI  
**Backend:** MindWealth API v1.2 (`NUXT_API_BASE_URL`, default `http://51.20.53.218:8506`)

---

## Architecture

Every terminal page calls a **Nuxt BFF route** (`/api/*`). Each route invokes a `load*()` function in `server/utils/mindwealth-data.ts`, which calls the MindWealth API. If the backend is unreachable or returns null, the route falls back to mock data.

```
Browser page  →  GET /api/*  →  load*()  →  mindwealthFetch()  →  API v1.2
                                    ↓ (on failure)
                              mock-data.ts / runic-mock-data.ts / conviction-mock-data.ts
```

### Mock fallback files

| File | Routes affected |
|------|-----------------|
| `server/utils/mock-data.ts` | Dashboard, signals, performance, breadth, sentiment, overwatch, shortlist, portfolio, monitored-trades, meta |
| `server/utils/runic-mock-data.ts` | Runic nightly, variables, analog, cancel tracker |
| `server/utils/conviction-mock-data.ts` | Conviction |
| `server/api/chat.post.ts` | Inline mock chat when backend not configured |
| `server/api/chat/sessions.get.ts` | Inline mock session when list API fails |

### Environment

| Variable | Purpose |
|----------|---------|
| `NUXT_API_BASE_URL` | Backend host (without `/api/v1`) |
| `NUXT_API_KEY` | Optional `X-API-Key` header |

Mocks activate automatically when `NUXT_API_BASE_URL` is empty or upstream calls return null.

---

## Executive summary

| Page | Primary route(s) | Live when backend up? | Main gaps |
|------|------------------|----------------------|-----------|
| `/` (index) | None | **No** | All marketing stats static |
| `/platform` | None | **No** | Same |
| `/dashboard` | `/api/dashboard` | **Yes** | Hidden overwatch KPI; template analyst snippet |
| `/signals` | `/api/signals/*`, `/api/shortlist` | **Yes** | Many sidebar nav items non-functional |
| `/macro` | `/api/runic/*`, `/api/combo/*` | **Mostly** | Combos tab + overview narratives hardcoded |
| `/sentiment` | `/api/sentiment` | **Yes** | Layer 4 nav unused; all layers always shown |
| `/conviction` | `/api/conviction` | **Yes** | Portfolio MTM shows `—` |
| `/portfolio` | `/api/portfolio` | **Yes** (positions) | $500k notional, sizing client-derived |
| `/overwatch` | `/api/overwatch`, `/api/chat` | **Yes** | System health checks hardcoded |

**APIs with no dedicated page:** `/api/monitored-trades`, `/api/breadth` (used indirectly by dashboard/sentiment).

---

## API route reference

| Route | Backend source | Live? | Used by |
|-------|----------------|-------|---------|
| `GET /api/dashboard` | Trade-store overlays + sigma + SSI + runic nightly | Yes | Dashboard, terminal layout |
| `GET /api/signals/outstanding` | `overlay-file` → `outstanding_signal.csv` | Yes | Signals, dashboard |
| `GET /api/signals/new` | `overlay-file` → `new_signal.csv` | Yes | Signals |
| `GET /api/signals/counts` | Overlays + `/signals/shortlist` | Yes | Layout nav badges |
| `GET /api/performance` | `combined_performance_report.csv` | Yes | Dashboard chart (no page) |
| `GET /api/breadth` | `breadth.csv` | Yes | Sentiment fallback, dashboard regime |
| `GET /api/sentiment` | `/analytics/sentiment/layers` | Yes | Sentiment page, layout |
| `GET /api/overwatch` | Performance CSV + `/analytics/portfolio-ytd` | Yes | Overwatch, analyst panel poll |
| `GET /api/shortlist` | `/signals/shortlist` | Yes | Signals shortlist tab |
| `GET /api/conviction` | Overlays, tickers, daily alerts | Yes | Conviction page, layout |
| `GET /api/portfolio` | Virtual trading long/short + macro variables | Yes | Portfolio page, layout |
| `GET /api/monitored-trades` | `/monitored-trades` | Yes | **No UI page** |
| `GET /api/runic/nightly` | `/macro/runic/nightly` | Yes | Macro, layout, overwatch |
| `GET /api/variables/current` | `/macro/runic/variables/current` | Yes | Macro variables tab |
| `GET /api/combo/analog` | Nightly `analog_details` (mock if empty) | Partial | Macro analog tab |
| `GET /api/combo/cancel_tracker` | Derived from nightly | Yes | Macro tracker tab |
| `GET /api/meta` | Health + overlay paths | Yes | Meta consumers |
| `POST /api/chat` | Chatbot async job flow | Yes | Analyst panel |
| `GET /api/chat/sessions` | `/chatbot/sessions` | Yes | **Not wired to UI** |

---

## Page-by-page detail

### `/` and `/platform` — Landing / marketing

**API integration:** None.

**What is shown:** Static hero copy, feature cards, architecture blocks.

**Hardcoded (should be API-driven):**

| Item | Location | Should fetch from |
|------|----------|-------------------|
| `89.9%` avg win rate | `pages/index.vue`, `pages/platform.vue` | `/api/performance` aggregates |
| `24.3%` avg 10yr CAGR | Same | `/api/performance` |
| `1.08` Sharpe ratio | `pages/platform.vue` | `/api/performance` |
| `10` functions, `165` macro combos | `pages/index.vue` | `/api/meta` or dedicated stats |
| Feature / architecture descriptions | Both pages | Marketing copy (OK static) |

---

### `/dashboard`

**API:** `GET /api/dashboard`  
**Composable:** `useApi().fetchDashboard()`

**Live data sources:**

- `outstanding_signal.csv` — top signals, outstanding count
- `combined_performance_report.csv` — win rate chart, avg win rate
- `breadth.csv` — sentiment fallback for SSI KPI
- `/analytics/sentiment/layers` — SSI composite KPI
- `/analytics/sigma` — sigma KPI (also from nightly `nfci_sigma`)
- `/macro/runic/nightly` — macro alert count / overwatch message
- Overwatch-derived degradation strategy name

**Live on screen:** KPI cards (except hidden overwatch), win-rate chart, top active signals table, regime strip (via layout).

**Not live / hardcoded:**

| Item | Location | Notes |
|------|----------|-------|
| Overwatch Alerts KPI card | `pages/dashboard.vue` — `showOverwatchKpi = false` | API already provides `overwatch_count` / `overwatch_message` |
| AI Analyst snippet | `loadDashboard()` — template string | Not a real morning brief; should use chatbot preset or brief API |
| Win rate MoM | `loadDashboard()` — `win_rate_mom: 0`, display `"live from trade store"` | No historical MoM endpoint |
| Sharpe ratio | `loadPerformance()` — `avg_sharpe: 1.0` | Hardcoded constant |
| Sidebar “Functions (10)” | `constants/terminal-configs.ts` | Cosmetic nav; no filter/routing |
| SIGMA regime strip chip | `constants/regime-strip.ts` — `showDashboardSigmaStrip = false` | Data exists in KPI payload |

---

### `/signals`

**API:**

- `GET /api/signals/outstanding`
- `GET /api/signals/new`
- `GET /api/shortlist` (table rows = outstanding signals filtered by shortlist symbols)
- `GET /api/signals/counts` (layout nav)

**Live on screen:** Signal table, long/short/new KPIs, function counts in nav.

**Not live / hardcoded:**

| Item | Issue |
|------|-------|
| Nav: All Signal Report, SBI Breadth, Horizontal & New High, Combined Performance | IDs in sidebar; **no data switching** — only `outstanding`, `new`, `shortlist` work |
| Nav: function / interval filters | Cosmetic only |
| Shortlist KPI delta `"cross-confirmed"` | Static string in template |
| Shortlist structured rows | API returns `report_text` (markdown) but `rows: []` — table uses filtered outstanding signals, not Claude shortlist records |

---

### `/macro` — Runic Macro Combo Engine

**API:**

- `GET /api/runic/nightly`
- `GET /api/variables/current`
- `GET /api/combo/analog?combo=C|F`
- `GET /api/combo/cancel_tracker`

**Live tabs:**

| Tab | Source | Status |
|-----|--------|--------|
| Overview | Nightly API (KPIs partial) + **hardcoded narratives** | Partial |
| 12 Variables | Variables API | Live |
| 7 Named Combos | `RUNIC_COMBOS` constant | **Mostly hardcoded** |
| Combo Tracker | Cancel tracker mapper | Live (derived) |
| Analog Tables | Nightly `analog_details` | Live but sparse; mock fallback |
| Nightly Brief | Nightly API | Live |

**Hardcoded (should be API):**

| Area | File / constant | Should be |
|------|-----------------|-----------|
| 7 Named Combos cards | `constants/runic-macro-data.ts` → `RUNIC_COMBOS` | Per-combo legs/status from nightly |
| Combo E badge only | `RunicCombosPanel.vue` patches from API | Extend to all combos |
| Overview narrative paragraphs | `RunicOverviewPanel.vue` template | Nightly narrative + episode fields |
| Overview KPI “CAPE · Combo E” value `42.0×` | `RunicOverviewPanel.vue` | Variables API CAPE |
| Overview KPI F delta `+22% from fire date` | Same | `active_combos[].mtm_pct` |
| Brief geo overlay suffix | `RunicBriefPanel.vue` — fixed Iran conflict text | API geo classification detail |
| Cancel tracker sidebar copy | `RunicTrackerPanel.vue` — dates/status strings | Cancel tracker API fields |
| Sidebar combo labels | `terminal-configs.ts` — “Stagflation”, etc. | `dominant_reason` / combo metadata |
| `RUNIC_OVERVIEW_KPIS`, `RUNIC_HEATMAP` | `runic-macro-data.ts` | Unused dead constants |

**Analog panel note:** When `analog_details` is empty or thin, route falls back to `getMockRunicAnalog()`. Live rows may show `?` for returns and lack WTI/context columns.

---

### `/sentiment` — Super Sentiment Index

**API:** `GET /api/sentiment` → `/analytics/sentiment/layers` (primary)

**Live on screen:** Composite score, three layer cards with mapped inputs.

**Fallback chain:** layers API → `sentiment.csv` overlay → breadth-derived composite.

**Hardcoded:**

| Item | Issue |
|------|-------|
| Sidebar Layer 1–3 nav | No filtering — page always shows all layers |
| Layer 4 · Regime Multiplier nav | Listed in sidebar; **not rendered** on page |
| Regime strip long/short triggers | Hardcoded `< −0.60` / `> +0.60` in `regime-strip.ts` |

---

### `/conviction` — Conviction Engine v5

**API:** `GET /api/conviction`  
**Composable:** `useConviction()`

**Live when backend up:** `storeLive: true` in response; health breakdown, signal rows, BQ/FS/FD depth, contradictions from daily alerts.

**Backend endpoints used:**

- `/conviction/overlays/dates` + `/conviction/overlays/{date}/score-sheet`
- `/conviction/overlays/{date}/summary`
- `/conviction/tickers?limit=500&fields=summary`
- `/conviction/tickers/{ticker}` (per row)
- `/conviction/alerts/daily`

**Incomplete / hardcoded in mapper:**

| Field | Location | Should be |
|-------|----------|-----------|
| Portfolio card `mtm: '—'` | `loadConviction()` | Live price / MTM from ticker API |
| `oeyFloorLabel`, `fdSummary`, `taxNote` | `tickerToDetail()` | Conviction ticker fields |
| Sizing fallback % | `sizingFromVerdict()` | Prefer `sizing_pct` from API |
| Nav “Claude report” sub-label | `terminal-configs.ts` | Shortlist / conviction report endpoint |

Regime strip shows `conviction_store live · as of {date}` when `storeLive` is true.

---

### `/portfolio` — Portfolio Sizer

**API:** `GET /api/portfolio`

**Live from API:**

- Open positions from `/virtual-trading/long` and `/virtual-trading/short`
- VIX, val regime from `/macro/runic/variables/current`
- SSI multiplier from `/analytics/sentiment/layers`

**Client-derived / hardcoded (should be single sizer API):**

| Item | Location | Value |
|------|----------|-------|
| Portfolio notional | `portfolio.vue` + `PORTFOLIO_NOTIONAL` in loader | `$500,000` |
| Cluster assignment | `clusterForSymbol()` in `mindwealth-data.ts` | Ticker-suffix heuristics |
| Dollar allocations | Even split of deploy % across positions | Not backend sizer |
| `idle_cash_yield` | `loadPortfolio()` | `3.5%` hardcoded |
| Deploy sliders | `maxDeploy`, `maxPerCluster` refs | Local only; no save API |
| Sidebar: Forced Portfolio, Live P&L, Portfolio Risk | `terminal-configs.ts` | No alternate views |

---

### `/overwatch`

**API:** `GET /api/overwatch` (page + 60s poll for analyst panel)

**Live on screen:**

- Function health cards (BT vs FWD from performance CSV)
- Degradation alerts count and message
- Forced portfolio YTD from `/analytics/portfolio-ytd`
- Panel degradation alerts (mapped from forward-testing rows)
- Runic dominant alert when nightly has `dominant_signal`

**Hardcoded:**

| Item | Location |
|------|----------|
| KPI delta labels (“trained period”, etc.) | `overwatch.vue` template |
| `system_logs` synthetic entry | `loadOverwatch()` |
| System checks (India CSV, Tavily, Claude ping, Sheets) | `server/utils/overwatch-panel.ts` → `buildSystemChecks()` |
| `fwd_trend` sparklines on alerts | Synthetic math in `degradationToPanelAlert()` |
| `mockRunicPanelAlert()` | Used when nightly missing but degradations exist |
| Sidebar Layer 2 nav (pipeline, autofix, version) | No view switching |

**Chat (embedded `AnalystPanelInner`):**

- `POST /api/chat` — live chatbot job flow
- `GET /api/chat/sessions` — live but **not displayed** in panel UI

---

## Global shell (all terminal pages)

**Fed by `useTerminalLayout()`:** dashboard, sentiment, portfolio, overwatch, nightly, conviction, signal counts.

**Regime strip:** Mostly live per page (see `constants/regime-strip.ts`).

**Non-functional sidebar nav (cosmetic / docs only):**

- Dashboard function list (FractalTrack, TrendPulse, …)
- Signals report / breadth / performance links
- Sentiment layer tabs (no scroll/filter)
- Portfolio forced / P&L / risk tabs
- Overwatch pipeline / autofix / version tabs

---

## Priority backlog — remove hardcoded / mock dependence

1. **Landing page stats** → `/api/performance` aggregates  
2. **Macro combo cards + overview narratives** → nightly combo leg/status endpoints  
3. **Portfolio sizer** ($500k, clusters, dollars, idle yield) → dedicated sizer API  
4. **Conviction portfolio MTM** → ticker / score-sheet prices  
5. **Overwatch system health** → real pipeline timestamps per market  
6. **Shortlist structured rows** → populate `records` on `GET /signals/shortlist`  
7. **Runic analog historical tables** → rich combo analog JSON (not sparse `analog_details`)  
8. **Monitored trades page** → wire `/api/monitored-trades` (API already live)  
9. **Chat session history UI** → wire `/api/chat/sessions` into Claude panel  
10. **Non-functional sidebar nav** → implement or remove until APIs exist  

---

## Quick verification (dev server)

```bash
curl -s localhost:3000/api/dashboard | jq '.kpis'
curl -s localhost:3000/api/conviction | jq '{storeLive, asOf}'
curl -s localhost:3000/api/sentiment | jq '.layers.weekly.items | length'
curl -s localhost:3000/api/runic/nightly | jq '.dominant_signal'
curl -s localhost:3000/api/portfolio | jq '.positions | length'
curl -s localhost:3000/api/monitored-trades | jq '.trades | length'
curl -s 'localhost:3000/api/combo/analog?combo=C' | jq '.rows | length'
```

Non-null, recent dates, and `storeLive: true` on conviction indicate live integration.

---

## Related docs

- `docs/API_MOCK_DATA_STATUS.md` — earlier mock vs live summary (2026-06-10)
- `docs/API_INTEGRATION_GAPS.md` — integration gap list
- `docs/API_INTEGRATION_ACHIEVEMENTS.md` — completed integration work

---

*This audit reflects UI code and a live probe against the configured backend. Re-run verification after backend or env changes.*
