# MindWealth Alpha Terminal — Frontend Data Contract

This document describes **what the backend can produce** for your **Vue / Nuxt** frontend. It is derived from the live Streamlit app (`MindWealth_UI`) parsers and services. Use it to wire `useFetch` / `$fetch` once a thin API layer exists (FastAPI or Nuxt server routes wrapping the same Python functions).

**Source of truth (Python):** `~/Documents/MindWealth/MindWealth_UI`  
**Frontend (Nuxt):** `MindWealthUi`  
**Data files:** `trade_store/US/*.csv`, `trade_store/stock_data/`, `chatbot/data/`, `monitored_trades.json`

---

## 1. Architecture note

| Today | Target for Nuxt |
|--------|------------------|
| Streamlit reads CSVs directly | REST or Nitro routes return JSON |
| No HTTP API | Same shapes as below |
| Claude/OpenAI only from chatbot page | `POST /api/chat` proxies `ChatbotEngine` |

Every payload below is **JSON-serializable**. `Raw_Data` fields are optional on the API (omit in production responses unless debugging).

---

## 2. Global metadata (all pages)

Include on every response or via `GET /api/meta`.

```json
{
  "data_updated_at": {
    "date": "2026-05-12",
    "time": "09:21:00",
    "datetime": "2026-05-12T09:21:00+05:30",
    "timezone": "IST"
  },
  "market_label": "US Market",
  "source_files": {
    "outstanding_signal": "trade_store/US/2026-05-12_outstanding_signal.csv",
    "combined_performance_report": "trade_store/US/2026-05-12_combined_performance_report.csv"
  }
}
```

**Python source:** `get_data_fetch_datetime()` → `trade_store/US/data_fetch_datetime.json`

---

## 3. Suggested REST map (Nuxt routes)

| Method | Route | Python source | Nuxt page |
|--------|-------|---------------|-----------|
| `GET` | `/api/meta` | `get_data_fetch_datetime`, file paths | Top bar “last updated” |
| `GET` | `/api/dashboard` | `dashboard_metrics()`, `load_performance_report()` | `/dashboard` |
| `GET` | `/api/signals/outstanding` | `load_outstanding_signals()`, `signals_summary()` | `/signals` |
| `GET` | `/api/signals/new` | `load_new_signals()`, `signals_summary()` | `/signals` (new tab) |
| `GET` | `/api/signals/counts` | `signal_counts()` | Sidebar badges |
| `GET` | `/api/performance` | `load_performance_report()` | Conviction, dashboard chart |
| `GET` | `/api/breadth` | `load_breadth()`, `breadth_sentiment_score()` | `/macro` |
| `GET` | `/api/sentiment` | `load_sentiment_signals()`, `sentiment_spread_composite()` | `/sentiment` |
| `GET` | `/api/overwatch` | `overwatch_degradations()`, `dashboard_metrics()` | `/overwatch` |
| `GET` | `/api/shortlist` | `claude_signals_report.csv` / `.txt` | Claude shortlisted |
| `GET` | `/api/monitored-trades` | `load_monitored_trades()` | Monitored trades |
| `POST` | `/api/chat` | `ChatbotEngine.smart_query()` | `ClaudePanel` |
| `GET` | `/api/chat/sessions` | `SessionManager.list_all_sessions()` | Chat history |

Query params (where applicable): `function`, `symbol`, `interval`, `signal_type`, `min_win_rate`, `from_date`, `to_date`.

---

## 4. Dashboard — `GET /api/dashboard`

**Python:** `dashboard_metrics()` + performance series from `load_performance_report()`

### 4.1 Response shape

```json
{
  "meta": { "data_updated_at": { "datetime": "2026-05-12T09:21:00+05:30" } },
  "kpis": {
    "avg_win_rate": 89.9,
    "avg_win_rate_display": "89.9%",
    "win_rate_mom": 2.1,
    "win_rate_mom_display": "+2.1% MoM",
    "outstanding_count": 63,
    "new_today": 7,
    "sentiment_score": "+0.4",
    "sentiment_label": "neutral — no trigger",
    "overwatch_count": 1,
    "overwatch_message": "DeltaDrift short degradation",
    "sigma": "-1.2σ"
  },
  "top_signals": [
    {
      "ticker": "AAPL",
      "function": "Fractal Track",
      "interval": "Monthly",
      "function_interval": "Fractal Track — Monthly",
      "direction": "Long",
      "win_rate": 100,
      "win_rate_display": "100.0%",
      "sentiment": "bullish"
    }
  ],
  "functions_sidebar": [
    {
      "name": "Fractal Track",
      "subtitle": "100% WR",
      "status": "green"
    }
  ],
  "degraded_strategy": "DeltaDrift",
  "analyst_snippet": "Fractal Track signals on JPM and BAC show strong confirmation...",
  "win_rate_chart": {
    "series": [
      {
        "name": "Long WR",
        "strategy": "FRACTAL_TRACK",
        "points": [{ "x": "FRACTAL TRACK", "y": 100 }]
      },
      {
        "name": "Short WR",
        "strategy": "DELTADRIFT",
        "points": [{ "x": "DELTADRIFT", "y": 71.3 }]
      },
      {
        "name": "Backtested WR",
        "strategy": "FRACTAL_TRACK",
        "points": [{ "x": "FRACTAL TRACK", "y": 88 }]
      }
    ]
  },
  "regime": {
    "items": [
      { "label": "Trending", "pct": 38 },
      { "label": "Breakout", "pct": 24 }
    ]
  }
}
```

### 4.2 Field reference (`dashboard_metrics()`)

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `avg_win_rate` | number | yes | Mean `Win_Percentage` from performance report |
| `win_rate_mom` | number | yes | Avg live WR − avg backtest WR |
| `outstanding_count` | integer | no | Row count of outstanding signals |
| `new_today` | integer | no | Row count of new signals |
| `sentiment_score` | string | no | e.g. `"+0.4"` from breadth |
| `sentiment_label` | string | no | e.g. `"neutral — no trigger"` |
| `overwatch_count` | integer | no | Count of degradation alerts |
| `overwatch_msg` | string | no | Human-readable top alert |
| `sigma` | string | no | From latest `*_sigma.csv`, e.g. `"-1.2σ"` |
| `top_signals` | array | no | Top 5 by `Win_Rate` |
| `functions` | array | no | Strategy health for sidebar |
| `degraded_strategy` | string | yes | First alert strategy name |

**`top_signals[].sentiment`:** `"bullish"` \| `"neutral"` \| `"cautious"` (from spread thresholds ±0.3).

**`functions[].status`:** `"green"` \| `"red"` (live WR vs backtest).

---

## 5. Signals — `GET /api/signals/outstanding` | `/new`

**Python:** `load_outstanding_signals()` / `load_new_signals()`, `enrich_signal_df()`, `signals_summary()`, `count_claude_shortlisted()`

### 5.1 List response

```json
{
  "meta": { "data_updated_at": { "datetime": "..." } },
  "summary": {
    "long": 45,
    "short": 18,
    "long_pct": 91.2,
    "short_note": "review DeltaDrift",
    "new_long": 5,
    "new_short": 2,
    "shortlisted": 7
  },
  "signals": [
    {
      "symbol": "AAPL",
      "function": "FRACTAL TRACK",
      "interval": "Monthly",
      "signal_type": "Long",
      "signal_date": "2026-05-10",
      "signal_price": 193.89,
      "win_rate": 100,
      "num_trades": 85,
      "forward_wr": 98.5,
      "spread": 0.42,
      "sentiment_display": "+0.4 bullish",
      "status": "active",
      "strategy_cagr": 24.3,
      "strategy_sharpe": 1.4,
      "confirmation_status": "Monthly, Confirmed",
      "exit_status": "N/A",
      "current_mtm": "..."
    }
  ],
  "function_counts": [
    { "name": "FRACTAL TRACK", "count": 28 },
    { "name": "TRENDPULSE", "count": 19 }
  ]
}
```

### 5.2 Signal object (parsed row)

Produced by `parse_detailed_signal_csv()` + `enrich_signal_df()`.

| Field | Type | Notes |
|-------|------|-------|
| `symbol` | string | Ticker |
| `function` | string | Strategy name (see §12) |
| `interval` | string | `Daily` \| `Weekly` \| `Monthly` \| … |
| `signal_type` | string | `Long` \| `Short` |
| `signal_date` | string | `YYYY-MM-DD` |
| `signal_price` | number | Entry price |
| `win_rate` | number | Backtest win % |
| `num_trades` | integer | History tested count |
| `forward_wr` | number \| null | Parsed from raw CSV forward-test column |
| `spread` | number \| null | Sentiment spread |
| `strategy_cagr` | number | % |
| `strategy_sharpe` | number | |
| `best_return` | number | % max win trade |
| `worst_return` | number | % |
| `avg_return` | number | % |
| `confirmation_status` | string | Raw interval + confirmation text |
| `exit_status` | string | Exit signal if any |
| `current_mtm` | string | Mark-to-market text |

### 5.3 UI derivations (compute in frontend)

```ts
// status column
function signalStatus(s: Signal): 'active' | 'degraded' {
  if (s.forward_wr != null && s.win_rate && s.forward_wr < s.win_rate - 10)
    return 'degraded'
  return 'active'
}

// sentiment pill text
function sentimentDisplay(spread: number | null): string {
  if (spread == null) return 'neutral'
  if (spread >= 0.3) return `+${spread.toFixed(1)} bullish`
  if (spread <= -0.3) return `${spread.toFixed(1)} caution`
  return `${spread >= 0 ? '+' : ''}${spread.toFixed(1)} neutral`
}
```

### 5.4 Summary object (`signals_summary()`)

| Field | Type |
|-------|------|
| `long` | integer |
| `short` | integer |
| `long_pct` | number (mean WR of longs) |
| `short_note` | string (first degraded short function) |
| `new_long` | integer |
| `new_short` | integer |

---

## 6. Signal counts — `GET /api/signals/counts`

**Python:** `signal_counts()`

```json
{
  "outstanding": 63,
  "new": 7,
  "shortlisted": 7,
  "pages": {
    "Outstanding Signals": "trade_store/US/..._outstanding_signal.csv",
    "Combined Performance Report": "trade_store/US/..._combined_performance_report.csv"
  }
}
```

Use for sidebar badges (`Outstanding · 63`, `New · 7`, etc.).

---

## 7. Performance / Conviction — `GET /api/performance`

**Python:** `load_performance_report()` → `parse_combined_performance_report()`

### 7.1 Row shape

```json
{
  "rows": [
    {
      "function": "FRACTAL TRACK",
      "strategy": "FRACTAL_TRACK",
      "interval": "Monthly",
      "signal_type": "Long",
      "total_trades": 85,
      "win_percentage": 100,
      "max_holding_days": 120,
      "min_holding_days": 5,
      "avg_holding_days": 45,
      "best_profit": 32.5,
      "worst_profit": -8.2,
      "avg_profit": 12.1,
      "avg_backtested_win_rate": 88,
      "avg_backtested_holding_days": 40
    }
  ],
  "aggregates": {
    "avg_win_rate": 89.9,
    "total_trades": 3821,
    "avg_sharpe": 1.08
  }
}
```

### 7.2 Degradation alerts — `GET /api/overwatch`

**Python:** `overwatch_degradations(perf_df)`

```json
{
  "alerts": [
    {
      "strategy": "DeltaDrift",
      "interval": "Daily",
      "signal_type": "Short",
      "win": 71.3,
      "backtest": 88,
      "gap": -16.7
    }
  ],
  "count": 1,
  "message": "DeltaDrift short degradation"
}
```

**Rule:** alert when `win < backtest - 10` (percentage points).

---

## 8. Breadth / Macro (SBI) — `GET /api/breadth`

**Python:** `load_breadth()`, `breadth_sentiment_score()`

### 8.1 Rows (`parse_breadth()`)

```json
{
  "rows": [
    {
      "function": "Combined",
      "bullish_asset_percentage": 62.5,
      "bullish_signal_percentage": 58.0
    }
  ],
  "sentiment": {
    "score": "+0.4",
    "label": "neutral — no trigger"
  }
}
```

**Score logic:** from Combined row `Today Long Signal Percentile From Top (Last 6 Month)` → normalized score; label `bullish — watch longs` / `bearish — caution` if \|score\| ≥ 0.3.

---

## 9. Super Sentiment — `GET /api/sentiment`

**Python:** `load_sentiment_signals()`, `sentiment_spread_composite()`

Same **signal row shape** as §5.2, plus:

```json
{
  "composite": {
    "score": "+0.4",
    "label": "neutral — no trigger"
  },
  "signals": [ /* Signal[] */ ]
}
```

If sentiment CSV missing, falls back to breadth score (§8).

---

## 10. Claude shortlist — `GET /api/shortlist`

**Files:** `trade_store/US/claude_signals_report.csv`, `.txt`

```json
{
  "count": 7,
  "report_text": "Full markdown or plain text report...",
  "rows": [
    { "column_0": "..." }
  ]
}
```

Dashboard `analyst_snippet`: first cell of CSV, max ~500 chars.

---

## 11. Monitored trades — `GET /api/monitored-trades`

**Python:** `load_monitored_trades()` from `monitored_trades.json`

```json
{
  "last_updated": "2026-05-12T14:30:00",
  "trades": [
    {
      "trade_id": "AAPL_2026-01-16_Daily_Long_FRACTAL_TRACK",
      "symbol": "AAPL",
      "function": "FRACTAL TRACK",
      "interval": "Daily",
      "signal_type": "Long",
      "signal_date": "2026-01-16",
      "signal_price": 193.89,
      "current_price": 210.5,
      "price_change_pct": 8.6,
      "holding_period_days": 116,
      "mark_to_market": 16.61,
      "status": "open"
    }
  ]
}
```

**POST** endpoints (future): add/remove trade, refresh prices via `update_monitored_trades_prices()`.

---

## 12. Trading functions (canonical names)

Used in CSV `Function` column and chatbot extraction:

| Name | UI slug |
|------|---------|
| ALTITUDE ALPHA | `altitude-alpha` |
| BAND MATRIX | `band-matrix` |
| BASELINEDIVERGENCE | `baseline-divergence` |
| FRACTAL TRACK | `fractal-track` |
| OSCILLATOR DELTA | `oscillator-delta` |
| PULSEGAUGE | `pulsegauge` |
| SIGMASHELL | `sigmashell` |
| TRENDPULSE | `trendpulse |

Additional names may appear in CSVs (e.g. **DeltaDrift**) before extractor list is updated.

**Intervals:** `Daily`, `Weekly`, `Monthly`, `Quarterly`, `Yearly`

**Directions:** `Long`, `Short` (case-insensitive in filters)

---

## 13. AI Chat — `POST /api/chat`

**Python:** `ChatbotEngine.smart_query()`

### 13.1 Request

```json
{
  "message": "Show TRENDPULSE long signals for AAPL last 30 days",
  "session_id": "uuid-or-null",
  "signal_types": ["entry", "exit"],
  "assets": ["AAPL"],
  "from_date": "2026-04-01",
  "to_date": "2026-05-12",
  "functions": ["TRENDPULSE"],
  "is_followup": false
}
```

**`signal_types` values:** `entry`, `exit`, `portfolio_target_achieved`, `breadth`, `claude_report`

### 13.2 Response

```json
{
  "session_id": "abc-123",
  "reply": "Markdown answer with proper spacing...",
  "metadata": {
    "tokens_used": { "input": 12000, "output": 800, "total": 12800 },
    "signal_types": ["entry"],
    "tickers": ["AAPL"],
    "functions": ["TRENDPULSE"],
    "rows_returned": 12,
    "batched": false,
    "error": null
  }
}
```

**Errors:** `{ "error": "message", "reply": "Error processing query: ..." }`

**Empty data:** reply may be `"No Signal in the Specified date duration choosen, Please choose different date duration."`

### 13.3 Chat sessions — `GET /api/chat/sessions`

```json
{
  "sessions": [
    {
      "session_id": "abc-123",
      "title": "AAPL TRENDPULSE analysis",
      "last_updated": "2026-05-12T10:00:00",
      "message_count": 4
    }
  ]
}
```

---

## 14. Stock OHLC (charts) — `GET /api/stock/:symbol`

**Python:** `load_stock_data_file(symbol, start_date, end_date, interval)`

```json
{
  "symbol": "AAPL",
  "interval": "Daily",
  "bars": [
    {
      "date": "2026-05-10",
      "open": 190.1,
      "high": 195.2,
      "low": 189.0,
      "close": 193.89,
      "volume": 52000000
    }
  ]
}
```

Used by trade detail charts (`create_horizontal_chart`, `create_outstanding_signal_chart`, etc.).

---

## 15. TypeScript types (copy into Nuxt)

```ts
// types/api.ts

export interface DataUpdatedAt {
  date?: string
  time?: string
  datetime?: string
  timezone?: string
}

export interface ApiMeta {
  data_updated_at?: DataUpdatedAt
  market_label?: string
}

export interface DashboardKpis {
  avg_win_rate: number | null
  avg_win_rate_display: string
  win_rate_mom: number | null
  win_rate_mom_display: string
  outstanding_count: number
  new_today: number
  sentiment_score: string
  sentiment_label: string
  overwatch_count: number
  overwatch_message: string
  sigma: string
}

export interface TopSignal {
  ticker: string
  function: string
  interval: string
  function_interval: string
  direction: string
  win_rate: number
  win_rate_display: string
  sentiment: 'bullish' | 'neutral' | 'cautious'
}

export interface FunctionSidebarItem {
  name: string
  subtitle: string
  status: 'green' | 'red'
}

export interface DashboardResponse {
  meta?: ApiMeta
  kpis: DashboardKpis
  top_signals: TopSignal[]
  functions_sidebar: FunctionSidebarItem[]
  degraded_strategy: string | null
  analyst_snippet: string
  win_rate_chart?: {
    series: Array<{
      name: string
      points: Array<{ x: string; y: number }>
    }>
  }
}

export interface Signal {
  symbol: string
  function: string
  interval: string
  signal_type: string
  signal_date: string
  signal_price: number
  win_rate: number
  num_trades: number
  forward_wr: number | null
  spread: number | null
  sentiment_display?: string
  status?: 'active' | 'degraded'
  strategy_cagr?: number
  strategy_sharpe?: number
  confirmation_status?: string
  exit_status?: string
  current_mtm?: string
}

export interface SignalsSummary {
  long: number
  short: number
  long_pct: number
  short_note: string
  new_long: number
  new_short: number
}

export interface SignalsListResponse {
  meta?: ApiMeta
  summary: SignalsSummary & { shortlisted?: number }
  signals: Signal[]
  function_counts?: Array<{ name: string; count: number }>
}

export interface PerformanceRow {
  function: string
  strategy: string
  interval: string
  signal_type: string
  total_trades: number
  win_percentage: number
  avg_backtested_win_rate: number
  best_profit: number
  worst_profit: number
  avg_profit: number
}

export interface OverwatchAlert {
  strategy: string
  interval: string
  signal_type: string
  win: number
  backtest: number
  gap: number
}

export interface ChatRequest {
  message: string
  session_id?: string | null
  signal_types?: string[]
  assets?: string[]
  from_date?: string
  to_date?: string
  functions?: string[]
  is_followup?: boolean
}

export interface ChatResponse {
  session_id: string
  reply: string
  metadata: Record<string, unknown>
}
```

---

## 16. Nuxt page → endpoint checklist

| Route | Primary endpoint(s) | Key UI blocks |
|-------|---------------------|---------------|
| `/dashboard` | `/api/dashboard` | KPI row, top signals table, win-rate chart, AI brief |
| `/signals` | `/api/signals/outstanding`, `/api/signals/new` | Summary cards, signals table, filters |
| `/macro` | `/api/breadth` | SBI rows, regime / pattern cards |
| `/sentiment` | `/api/sentiment` | SSI score, layer breakdown, signal table |
| `/conviction` | `/api/performance` + future fundamental agent | BQ / sizing (not in CSV yet) |
| `/portfolio` | Future sizer output | Allocations, regime inputs |
| `/overwatch` | `/api/overwatch`, `/api/performance` | Degradation alerts, health table |
| Claude panel | `POST /api/chat` | Markdown messages, session list |

---

## 17. Empty & error states

| Condition | HTTP | Frontend message |
|-----------|------|------------------|
| CSV missing | `200` + empty arrays | “No data available” |
| Parser error | `500` | Show `error` from API |
| Chat no rows in date range | `200` | Use exact backend string about date duration |
| No API key (chat) | `503` | “AI analyst unavailable” |

---

## 18. Implementation order (recommended)

1. **FastAPI** (or Nuxt server) wrapping `terminal_data` → `/api/dashboard`, `/api/signals/*`, `/api/meta`
2. Wire Nuxt `useFetch` on `/dashboard` and `/signals`
3. Replace `useClaudePanel` mock with `POST /api/chat`
4. Add performance, breadth, overwatch endpoints
5. Optional: WebSocket or polling for `data_fetch_datetime.json` on “Refresh”

---

## 19. Python reference map

| JSON section | Module.function |
|--------------|-----------------|
| Dashboard KPIs | `src.services.terminal_data.dashboard_metrics` |
| Signal rows | `load_outstanding_signals`, `load_new_signals`, `enrich_signal_df` |
| Performance rows | `load_performance_report` |
| Breadth / SSI score | `load_breadth`, `breadth_sentiment_score`, `sentiment_spread_composite` |
| Overwatch | `overwatch_degradations` |
| Chat | `chatbot.chatbot_engine.ChatbotEngine.smart_query` |
| Meta timestamp | `src.utils.helpers.get_data_fetch_datetime` |

---

*Generated for MindWealth Nuxt frontend integration. Update this file when parsers or `dashboard_metrics()` change.*
