# Dashboard Page — Backend Requirements

**Frontend reference:** `pages/dashboard.vue`, `constants/terminal-configs.ts`, `constants/regime-strip.ts`, `components/WinRateChart.vue`, `components/FunctionDetailPopup.vue`, `types/api.ts`  
**BFF reference:** `server/api/dashboard.get.ts`, `server/utils/mindwealth-data.ts` (`loadDashboard`), `utils/win-rate-chart.ts`, `utils/signals.ts`  
**API baseline:** `mindwealth-api-docs-main 3/` (v1.2) + v1.3 additions in docs 5/6 (`/signals/counts`)  
**Date:** June 2026  
**Status:** No `GET /dashboard` in MindWealth API. UI calls Nuxt BFF `/api/dashboard`, which aggregates 8 upstream calls and computes most display values locally.

---

## 0. Short answer — what is calculated where?

Three layers sit between the user and MindWealth API:

| Layer | What it is | Dashboard role |
|-------|------------|----------------|
| **MindWealth API** | Python backend (`/api/v1/...`) | Returns raw CSV rows + partial aggregates |
| **Nuxt BFF** | `server/api/dashboard.get.ts` → `loadDashboard()` | Fetches upstream, **computes ~60% of dashboard values** |
| **Browser (Vue)** | `pages/dashboard.vue` + terminal layout | **Computes ~20%** (colors, row mapping, regime strip, nav merge) + renders SVG |

**Nothing on the dashboard page body is returned ready-to-render from a single MindWealth API endpoint today.**

---

## 0.1 UI element inventory (everything visible on `/dashboard`)

Use this table when sharing requirements with the backend team.

| # | UI element | Visible value | MindWealth API endpoint (if any) | Computed in Nuxt BFF? | Computed in browser? |
|---|------------|---------------|----------------------------------|----------------------|---------------------|
| **Terminal chrome** |
| 1 | Topbar tab highlight | `DASHBOARD` active | — | — | Static config |
| 2 | Topbar status pill | `LIVE · MindWealth API v{x}` | `GET /health` (version only) | `/api/meta` builds label from health + outstanding CSV timestamp | Date formatting in `useAppMeta` |
| 3 | Regime strip headline | e.g. `COMBO C ACTIVE · WATCH D` | `GET /macro/runic/nightly` | — | `deriveRegimeLabel(nightly)` |
| 4 | Regime strip chip: REGIME | Active/watch combo list | `GET /macro/runic/nightly` | — | `formatComboRegime()` |
| 5 | Regime strip chip: SENTIMENT SCORE | e.g. `+0.42` | `GET /analytics/sentiment/layers` (primary) | Formats `ssi_level` + `ssiTriggerLabel()`; fallback: `breadth.csv` formula | Chip HTML + `sentimentStripColor()` |
| 6 | Regime strip chip: VIX | e.g. `18.4` | `GET /macro/runic/nightly` | — | `vixStripColor()` |
| 7 | Regime strip chip: VIX REGIME | e.g. `LOW · 100% DEPLOY` | `GET /macro/runic/nightly` | — | `regimeValColor()`, `deployStripColor()` |
| 8 | Regime strip right text | Deploy / date string | `GET /macro/runic/nightly` | — | `formatRegimeStripRight()` |
| 9 | SideNav: Outstanding sub | e.g. `63 active` | `GET /signals/counts` → `outstanding.total` (v1.3) | `/api/signals/counts` proxy; CSV row-count fallback | `patchNavWithCounts()` |
| 10 | SideNav: New Signals sub | e.g. `7 today` | `GET /signals/counts` → `new.total` | Same | `patchNavWithCounts()` |
| 11 | SideNav: Shortlist sub | e.g. `64` | `GET /signals/counts` → `shortlist.total` | Same | `patchNavWithCounts()` |
| 12 | SideNav: Functions (10) labels | Fractal Track, TrendPulse, … | — | — | Static list in `terminal-configs.ts` |
| 13 | SideNav: Functions subs + dots | e.g. `92.9% WR`, green/red dot | `GET /analytics/performance` (raw rows) | Top 8 rows → subtitle + health (`fwd >= bt - 10pp`) | Merges static nav with `functions_sidebar` |
| 14 | Agent bar (bottom) | e.g. `SSI +0.42`, `MACRO SIGNALS · 3`, `SIGNALS · 63` | Dashboard KPIs + `/signals/counts` + `/macro/runic/nightly` | Partial (KPIs from BFF) | `buildAgentItems('/dashboard')` |
| **Main page body** (`pages/dashboard.vue`) |
| 15 | KPI: Avg Fwd win rate value | e.g. `77.3%` | `GET /analytics/performance` → `avg_win_rate` (optional) | **Yes** — `resolveWrAggregates()` then **hard override `77.3`** | — |
| 16 | KPI: Avg Fwd win rate delta | e.g. `from analytics API` | — | **Yes** — source label only; `win_rate_mom` is placeholder `0` | — |
| 17 | KPI: Outstanding Signals value | e.g. `63` | `GET /signals/reports/outstanding-signals/latest` | **Yes** — `signals.length` (not counts API) | — |
| 18 | KPI: Outstanding delta | e.g. `7 new today` | `GET /signals/counts` → `new.total` | **Yes** — passes through | String concat in template |
| 19 | KPI: SSI value | e.g. `+0.42` | `GET /analytics/sentiment/layers` → `composite.ssi_level` | **Yes** — formats score; breadth fallback if missing | — |
| 20 | KPI: SSI delta / label | e.g. `neutral · no trigger` | Same (+ `breadth.csv` fallback) | **Yes** — `ssiTriggerLabel()` or breadth formula | — |
| 21 | KPI: Overwatch Alerts | count + message | — | **Yes** — from nightly combos + overwatch | Hidden (`showOverwatchKpi = false`) |
| 22 | Win Rate chart title | e.g. `Win Rate — Forward Testing` | `GET /analytics/performance` (raw rows) | **Yes** — `buildWinRateChart()` picks metric | — |
| 23 | Win Rate chart series | Long / Short / Backtest WR lines | `GET /analytics/performance` (raw rows) | **Yes** — averages, buckets, scale, colors | SVG paths only (`WinRateChart.vue`) |
| 24 | Top Signals: Ticker | e.g. `AAPL` | `GET /signals/reports/outstanding-signals/latest` | **Yes** — top 6 by `win_rate` desc | — |
| 25 | Top Signals: Function · Interval | e.g. `Fractal Track · Monthly` | Same | **Yes** — `signalToTopSignal()` | — |
| 26 | Top Signals: Direction badge | `LONG` / `SHORT` | Same (raw `Signal` column) | Partial — passes raw direction | **Yes** — `formatDirection()` |
| 27 | Top Signals: BT WR value | e.g. `100%` | Same | **Yes** — `win_rate_display` | — |
| 28 | Top Signals: BT WR color | green / amber / red class | — | — | **Yes** — `winRateClass()` (≥85 / ≥70) |
| 29 | Top Signals: FWD degraded bar | gold line on row | — | Partial — `sentiment: cautious` from spread/status | **Yes** — also matches `degraded_strategy` name |
| 30 | AI Analyst snippet | prose paragraph | — | **Yes** — template string, not AI | — |
| **On click (function sidebar)** |
| 31 | Function detail popup table | per-interval WR rows | `GET /analytics/performance` + `GET /signals/reports/combined-performance/latest` | Row parsing only | **Yes** — filter by function name, `fwd < bt - 10` highlight |

### Legend

- **MindWealth API** = documented upstream at `/api/v1/...`
- **Nuxt BFF** = local `GET /api/dashboard` (not in MindWealth API docs)
- **Browser** = Vue computed properties / utils

---

## 0.2 MindWealth API endpoints used today (documented)

These exist in `mindwealth-api-docs-main 3/` unless noted.

| MindWealth endpoint | Doc | What dashboard uses it for | Returns display-ready? |
|---------------------|-----|---------------------------|------------------------|
| `GET /api/v1/analytics/performance` | `services/analytics/endpoints/get-performance.md` | Raw `records[]`; optional `avg_win_rate`, `total_trades` | **No** — chart, sidebar health, top KPI all recomputed in BFF |
| `GET /api/v1/analytics/sentiment/layers` | `services/analytics/endpoints/get-sentiment-layers.md` | `composite.ssi_level` (number) | **No** — BFF formats score string + trigger label |
| `GET /api/v1/analytics/sigma` | `services/analytics/endpoints/get-sigma.md` | Sigma KPI (UI hidden today) | **No** — BFF parses first row |
| `GET /api/v1/signals/reports/outstanding-signals/latest` | `services/signals/endpoints/get-latest-report.md` | Full outstanding signal rows | **No** — BFF sorts top 6, derives sentiment |
| `GET /api/v1/signals/reports/breadth/latest` | `services/signals/README.md` (slug `breadth`) | SBI breadth rows | **No** — BFF computes SSI fallback score |
| `GET /api/v1/signals/counts` | `mindwealth-api-docs-main 6/.../get-counts.md` (**v1.3**) | `new.total`, nav badge counts | **Partial** — counts yes; outstanding KPI uses row length instead |
| `GET /api/v1/macro/runic/nightly` | `services/macro/endpoints/get-runic-nightly.md` | Regime strip, agent bar, overwatch fallback | **No** — browser formats chips/labels |
| `GET /api/v1/signals/shortlist` | `services/signals/endpoints/get-shortlist.md` | WR aggregate fallback in `loadPerformance` | **No** |
| `GET /health` | health service | API version for topbar | **Partial** |

**Also used by BFF but not rendered on dashboard body:** Gate A2b, `all_signal.csv`, `combined_performance_report.csv` overlays — only feed `loadPerformance()` fallbacks.

---

## 0.3 NEW endpoints required (share with backend team)

There is **no** `GET /api/v1/dashboard` in MindWealth API docs. Request one endpoint (or extend existing ones) so the UI stops computing in BFF + browser.

### Option A — Recommended: single dashboard endpoint

```
GET /api/v1/dashboard
```

Must return every field in §4.2 below, pre-computed:

| Field group | Replaces today |
|-------------|----------------|
| `kpis.*` | BFF `resolveWrAggregates`, `AVG_FORWARD_WR_OVERRIDE`, SSI formatting, counts merge |
| `top_signals[]` | BFF sort/slice + `signalToTopSignal` + browser `mapTopSignalRow` |
| `functions_sidebar[]` | BFF health rule on performance rows |
| `win_rate_chart` | BFF `buildWinRateChart` |
| `analyst_snippet` | BFF template (or wire to chatbot when ready) |
| `regime_strip` + `agent_bar` | Browser `buildRegimeStrip` / `buildAgentItems` |
| `signal_counts` | Separate `/signals/counts` fetch on dashboard route |

### Option B — Extend existing endpoints (no new route)

If a monolithic dashboard is not preferred, these **extensions** to documented endpoints would remove BFF math:

| Endpoint | Add to response |
|----------|-----------------|
| `GET /analytics/performance` | `avg_forward_wr_display`, `win_rate_mom`, `win_rate_chart` (§4.2), `functions_health[]` with `status: green\|red` |
| `GET /analytics/sentiment/layers` | `composite.score` (formatted string), `composite.label` (e.g. `neutral · no trigger`) |
| `GET /signals/reports/outstanding-signals/latest` | `top_signals[]` — top 6 pre-ranked with `direction_display`, `win_rate_tier`, `fwd_degraded` |
| `GET /signals/counts` | Already sufficient for nav badges + `new_today` |
| `GET /macro/runic/nightly` | `regime_strip` structured object (or use `GET /macro/status` v1.3) |

### Option C — Function popup (sidebar click)

```
GET /api/v1/functions/{function_slug}/performance
```

Returns rows for one function with `fwd_degraded: boolean` per row. Removes browser filter + 10pp check.

### Critical backend fixes (regardless of option)

| Issue | Today | Required |
|-------|-------|----------|
| Avg Fwd win rate | Hardcoded `77.3` override in UI BFF | Real aggregate from performance data |
| Win rate MoM | Placeholder `0`; delta text is source label | Real month-over-month delta + display string |
| Outstanding KPI vs nav | KPI uses `signals.length`; nav uses `/signals/counts` | Single authoritative count |
| SSI fallback | BFF invents score from `breadth.csv` when layers missing | Backend owns fallback or returns null |
| Analyst snippet | Template string in BFF | Real AI brief endpoint or omit |

---

## 1. Executive summary

The **Dashboard** (`/dashboard`) renders four zones:

| Zone | UI location | Primary data today |
|------|-------------|-------------------|
| **KPI cards** | Top row (3–4 cards) | BFF-computed from 6+ upstream calls |
| **Win Rate chart** | Left panel | BFF-built chart series from performance rows |
| **Top Active Signals** | Right table | BFF-sorted top 6 + frontend row mapping |
| **AI Analyst snippet** | Right card | BFF-generated template string (static today) |

**Terminal chrome** (regime strip, agent bar, sidebar function dots) pulls from **additional** endpoints and applies frontend formatting / fallback merging.

**Goal:** one authoritative `GET /api/v1/dashboard` (or equivalent) that returns **display-ready** payloads. The UI should only render fields — no ranking, aggregation, degradation rules, sentiment bucketing, or chart series math on the client or in the Nuxt BFF.

**Highest-impact deliverable:** pre-computed `kpis`, `top_signals` (ranked + display fields), `functions_sidebar` (with health status), and `win_rate_chart` (series + scale) in a single response.

**Second deliverable:** regime-strip chips and agent-bar labels as structured objects (not HTML strings assembled on the client).

---

## 2. Current request flow

```
Browser
  └─ GET /api/dashboard          (Nuxt BFF — loadDashboard)
  └─ GET /api/signals/counts     (sidebar nav badges)
  └─ GET /api/sentiment          (regime strip fallback)
  └─ GET /api/runic/nightly      (regime strip, agent bar)
  └─ GET /api/performance        (function popup only)
  └─ GET /api/signals/combined-performance  (function popup only)
```

### 2.1 Upstream sources consumed by `loadDashboard()` today

| BFF loader | Upstream source | Dashboard use |
|------------|-----------------|---------------|
| `loadOutstandingSignals()` | `outstanding_signal.csv` overlay | Outstanding count, top-signal pool, analyst snippet |
| `loadPerformance()` | `GET /analytics/performance` + Gate A2b + all signals + shortlist | Avg FWD win rate KPI, functions sidebar, win rate chart |
| `loadBreadth()` | `breadth.csv` overlay | SSI fallback, `regime.items` |
| `loadOverwatch()` | `GET /analytics/performance` (re-fetched) | `degraded_strategy`, overwatch KPI fallback |
| `loadSigmaKpi()` | `GET /analytics/sigma` | Sigma KPI (hidden in UI today) |
| `loadSsiKpi()` | `GET /analytics/sentiment/layers` | SSI score + label KPI |
| `loadRunicNightly()` | `GET /macro/runic/nightly` | Overwatch count/message, regime strip |
| `loadSignalCounts()` | `GET /signals/counts` (or CSV fallback) | `new_today` KPI, nav badges |

> **Note:** `loadDashboard` fans out to **8 parallel upstream calls**. Overwatch and performance both hit `/analytics/performance`. This should collapse into one backend dashboard endpoint.

---

## 3. What is computed today (not fetched ready-to-use)

### 3.1 Nuxt BFF computations (`loadDashboard` + helpers)

These run in `server/utils/mindwealth-data.ts` and `utils/win-rate-chart.ts`. **Backend should own all of this.**

| Computed field | Logic today | Move to backend as |
|----------------|-------------|-------------------|
| `kpis.avg_win_rate` | `resolveWrAggregates()` over API aggregates → performance rows → shortlist signals. **Hard override:** `AVG_FORWARD_WR_OVERRIDE = 77.3` in `utils/performance-aggregates.ts` | `kpis.avg_win_rate` + `kpis.avg_win_rate_display` |
| `kpis.win_rate_mom_display` | Source label string (`from analytics API` / `from rows` / etc.) — MoM value is placeholder `0` | `kpis.win_rate_mom` + `kpis.win_rate_mom_display` (real MoM delta) |
| `kpis.outstanding_count` | `outstanding.signals.length` | `kpis.outstanding_count` |
| `kpis.new_today` | `loadSignalCounts().new` | `kpis.new_today` |
| `kpis.sentiment_score` / `sentiment_label` | Primary: `ssi_level` from `/analytics/sentiment/layers`. Fallback: `breadthSentimentFromRows()` — `(bullish_signal_pct - 50) / 50`, thresholds ±0.3 | Pre-formatted `sentiment_score`, `sentiment_label` |
| `kpis.overwatch_count` | `active_combos.length + watch_combos.length` from nightly, else `overwatch.count` | `kpis.overwatch_count` |
| `kpis.overwatch_message` | `formatPersistenceSignals()` \|\| `dominant_reason` \|\| overwatch message | `kpis.overwatch_message` |
| `kpis.sigma` | Parsed from `/analytics/sigma` first record | `kpis.sigma` |
| `top_signals` | Sort outstanding by `win_rate` desc → slice(6) → `signalToTopSignal()` | Ranked array with all display fields (§4.2) |
| `signalToTopSignal.sentiment` | `spread >= 0.3` → bullish; `status === 'degraded'` or `spread <= -0.3` → cautious; else neutral | `sentiment` enum from backend |
| `functions_sidebar` | Top 8 performance rows; `status: green` if `win_percentage >= avg_backtested_win_rate - 10` | Array with `name`, `subtitle`, `status` |
| `degraded_strategy` | First overwatch alert strategy | `degraded_strategy` |
| `analyst_snippet` | Template: `"{ticker} leads active book on {function} ({wr} backtest WR). {long} long / {short} short outstanding."` | `analyst_snippet` (or separate AI endpoint) |
| `win_rate_chart` | `buildWinRateChart()` — see §3.3 | Full chart object (§4.3) |
| `regime.items` | `breadth.rows.slice(0, 5)` mapped to `{ label: function, pct: bullish_signal_percentage }` | `regime.items` |

#### `breadthSentimentFromRows` (SSI fallback formula)

```
score = (combined.bullish_signal_percentage - 50) / 50
label = bullish if score >= 0.3
      = bearish if score <= -0.3
      = neutral otherwise
```

#### `signalToTopSignal` sentiment thresholds

```
bullish  if spread >= 0.3
cautious if status === 'degraded' OR spread <= -0.3
neutral  otherwise
```

#### Functions sidebar health rule

```
status = green  if win_percentage >= avg_backtested_win_rate - 10
status = red    otherwise
```

### 3.2 Frontend computations (Vue / utils)

These run in the browser. **Backend should return display-ready values so the UI only binds props.**

| Location | Computation | Current logic | Backend should return |
|----------|-------------|---------------|----------------------|
| `utils/signals.ts` → `mapTopSignalRow` | Direction badge | `formatDirection()` — `signal_type` starts with `s` → SHORT, else LONG | `direction_display: "LONG" \| "SHORT"` |
| `mapTopSignalRow` | Win rate CSS class | `winRateClass(wr)` — ≥85 `hi`, ≥70 `mid`, else `lo` | `win_rate_tier: "hi" \| "mid" \| "lo"` |
| `mapTopSignalRow` | FWD degraded row highlight | `sentiment === 'cautious'` OR function name contains `degraded_strategy` | `fwd_degraded: boolean` |
| `mapTopSignalRow` | Tag text (unused in dashboard table) | Hardcoded `'+0.4 neutral'` for neutral sentiment | `tag`, `tag_class` if tags are shown |
| `components/WinRateChart.vue` | Y-axis scale fallback | Recomputes `y_min`/`y_max` if `chart.scale` missing | Always include `scale` in response |
| `WinRateChart.vue` | X-axis label sort | `getChartXLabels()` — interval order Daily→Yearly | Pre-sorted `x_labels[]` or ordered points |
| `WinRateChart.vue` | Function axis abbreviations | `abbreviateFunction()` on x labels | `x_display_labels[]` |
| `WinRateChart.vue` | SVG paths, area fill, legend | Pure rendering — **keep on frontend** | N/A |
| `constants/regime-strip.ts` | Regime strip chips | Merges dashboard KPIs + nightly + sentiment; builds HTML chip strings; color from score parsing | `regime_strip: { headline, items[], right, dot_class }` with plain text + `color_token` |
| `constants/regime-strip.ts` | Agent bar items | Concatenates SSI, macro count, outstanding from multiple sources | `agent_bar: { items[] }` |
| `constants/terminal-configs.ts` | Functions nav dots | Merges static 10-function list with `functions_sidebar` API data | `functions_nav: { id, label, subtitle, dot, status }[]` |
| `components/FunctionDetailPopup.vue` | Row filter | Client-side filter performance/combined rows by function name | `GET /functions/{name}/performance` scoped rows |
| `FunctionDetailPopup.vue` | Degraded row | `win_percentage < avg_backtested_win_rate - 10` | `fwd_degraded: boolean` per row |
| `FunctionDetailPopup.vue` | Column discovery | Dynamic keys from first row | Fixed column schema per function |

### 3.3 Win rate chart BFF math (`buildWinRateChart`)

Backend must return the finished chart object. Current BFF logic:

1. **Detect x-axis:** `interval` if ≤1 unique function; else `function`
2. **Long WR series:** filter `signal_type` starts with `l`; average `win_percentage` by x bucket
3. **Short WR series:** filter non-long; same averaging
4. **Backtest WR series:** average `avg_backtested_win_rate` by x bucket
5. **Scale:** `y_min`/`y_max`/`y_ticks` from min/max of all series values (5pp padding, step 5/10/20)
6. **Series styling:** color/stroke by name (Long=green, Short=red, Backtest=gold)

---

## 4. Target backend contract

### 4.1 Proposed endpoint

```
GET /api/v1/dashboard
```

Optional query: `?as_of=YYYY-MM-DD` for historical snapshot.

Response should be **self-contained** — no secondary fetches required for the dashboard page body or terminal chrome on `/dashboard`.

### 4.2 `DashboardResponse` — required fields

```typescript
interface DashboardResponse {
  meta: {
    data_updated_at: { date?: string; time?: string; timezone?: string }
    market_label?: string
    source_files?: Record<string, string>
  }

  kpis: {
    avg_win_rate: number | null
    avg_win_rate_display: string          // e.g. "77.3%"
    win_rate_mom: number | null           // real MoM delta, not placeholder 0
    win_rate_mom_display: string          // e.g. "+2.1% MoM · all functions"
    outstanding_count: number
    new_today: number
    sentiment_score: string               // e.g. "+0.42"
    sentiment_label: string               // e.g. "neutral · no trigger"
    overwatch_count: number
    overwatch_message: string
    sigma: string                         // e.g. "−1.2σ" or "—"
  }

  top_signals: Array<{
    ticker: string
    function: string
    interval: string
    function_interval: string             // pre-formatted "Function · Interval"
    direction: string                     // raw: "Long" | "Short"
    direction_display: "LONG" | "SHORT"
    win_rate: number
    win_rate_display: string              // "87.4%"
    win_rate_tier: "hi" | "mid" | "lo"
    sentiment: "bullish" | "neutral" | "cautious"
    fwd_degraded: boolean
  }>                                     // max 6, pre-ranked by backend

  functions_sidebar: Array<{
    name: string
    subtitle: string                      // e.g. "92.9% WR"
    status: "green" | "red"
  }>

  functions_nav?: Array<{                // optional: replaces static nav + merge logic
    id: string
    label: string
    subtitle?: string
    dot: "g" | "r" | "gold" | "off"
    status: "green" | "red"
  }>

  degraded_strategy: string | null

  analyst_snippet: string

  win_rate_chart: {
    properties: {
      x_axis: string
      y_axis: string
      metric: string
      row_count: number
      source_file?: string
      scope?: string
      reading_hint?: string
    }
    scale: { y_min: number; y_max: number; y_ticks: number[] }
    x_labels: string[]
    x_display_labels?: string[]           // abbreviated function names when x_axis = Function
    series: Array<{
      name: string
      color: string
      stroke_width: number
      opacity: number
      points: Array<{ x: string; y: number }>
    }>
  }

  regime: {
    items: Array<{ label: string; pct: number }>
  }

  regime_strip: {                          // display-ready terminal chrome
    dot_class: "ok" | "warn" | "alert"
    headline: string
    items: Array<{
      label: string
      value: string
      color_token: "green" | "red" | "gold" | "blue" | "amber" | "teal"
    }>
    right?: string
  }

  agent_bar: {
    items: Array<{
      dot: "on" | "wa" | "off"
      label: string
      align_right?: boolean
    }>
  }

  signal_counts: {                        // avoids separate /signals/counts on dashboard
    outstanding: number
    new: number
    shortlisted: number
  }
}
```

### 4.3 Fields the UI will stop computing once backend delivers §4.2

| Remove from frontend/BFF | Replaced by |
|--------------------------|-------------|
| `loadDashboard()` aggregation | `GET /api/v1/dashboard` |
| `buildWinRateChart()` | `win_rate_chart` in response |
| `signalToTopSignal()` + sort/slice | `top_signals` in response |
| `mapTopSignalRow()` | Bind `top_signals` directly |
| `breadthSentimentFromRows()` | `kpis.sentiment_*` |
| `resolveWrAggregates()` + `AVG_FORWARD_WR_OVERRIDE` | `kpis.avg_win_rate` from API |
| `buildRegimeStrip('/dashboard')` chip assembly | `regime_strip` |
| `buildAgentItems('/dashboard')` | `agent_bar` |
| `patchNavWithCounts` on dashboard | `signal_counts` in response |
| Functions nav merge in `useTerminalLayout` | `functions_nav` (optional) |

### 4.4 Function popup (sidebar click)

Separate scoped endpoint recommended:

```
GET /api/v1/functions/{function_slug}/performance
```

Returns rows with `fwd_degraded` pre-computed per row. UI stops filtering `/api/performance` client-side.

---

## 5. Degradation & health rules (authoritative backend)

These thresholds are duplicated across BFF and frontend today. Backend must own one definition:

| Rule | Threshold | Used for |
|------|-----------|----------|
| FWD vs backtest gap | `forward_wr < backtest_wr - 10` (10pp) | Functions sidebar red dot, function popup row highlight, overwatch alerts |
| Top signal cautious | `spread <= -0.3` OR explicit `status: degraded` | Top signals table row styling |
| SSI bullish / bearish | `ssi_level >= 0.3` / `<= -0.3` (or breadth equivalent ±0.3) | KPI label |
| SSI trigger (layers API) | `< -0.6` long trigger; `> 0.85` short trigger | `sentiment_label` suffix |
| Win rate display tier | ≥85% hi · ≥70% mid · else lo | Table cell CSS class |

---

## 6. Migration checklist

### Phase 1 — Dashboard body (single endpoint)
- [ ] `GET /api/v1/dashboard` returns `kpis`, `top_signals`, `functions_sidebar`, `win_rate_chart`, `analyst_snippet`, `degraded_strategy`, `regime`
- [ ] Remove `AVG_FORWARD_WR_OVERRIDE` hack; return real `avg_win_rate`
- [ ] Implement real `win_rate_mom` (currently hardcoded `0` in BFF)
- [ ] BFF becomes thin proxy: `mindwealthFetch('/dashboard')` → pass through
- [ ] Delete `mapTopSignalRow` usage on dashboard; bind API fields directly

### Phase 2 — Terminal chrome
- [ ] Add `regime_strip`, `agent_bar`, `signal_counts` to dashboard response
- [ ] Stop fetching `/api/sentiment`, `/api/runic/nightly`, `/api/signals/counts` on `/dashboard` route
- [ ] Replace `buildRegimeStrip` HTML chip builder with structured render

### Phase 3 — Function popup
- [ ] `GET /api/v1/functions/{slug}/performance` with pre-filtered rows + `fwd_degraded`
- [ ] Remove client-side row filter in `useFunctionPopup`

---

## 7. Acceptable frontend-only work (no backend needed)

| Concern | Reason |
|---------|--------|
| SVG chart rendering (`WinRateChart.vue`) | Pure presentation of backend series + scale |
| CSS animations on chart lines | Cosmetic |
| `showOverwatchKpi` / `showDashboardSigmaStrip` feature flags | Product toggles |
| `Teleport` / modal open-close state | UI state |
| `DirectionBadge` component | Renders `direction_display` string |
| Percent/date formatting via `apiPercent` when value is already numeric | Thin display helper — or backend can send formatted strings |

---

## 8. Quick audit summary

| Layer | % of dashboard metrics computed locally (estimate) |
|-------|-----------------------------------------------------|
| **MindWealth API** | ~20% — raw CSV rows + partial analytics (`/analytics/performance`, `/analytics/sentiment/layers`, `/signals/counts`) |
| **Nuxt BFF** | ~60% — ranking, KPI aggregation, chart series, sidebar health, analyst snippet, SSI fallback |
| **Browser (Vue)** | ~20% — row mapping, CSS tiers, regime strip HTML, nav merge, function popup filter + degradation check |

**Target state:** ~95% from `GET /api/v1/dashboard`; ~5% presentation rendering only.
