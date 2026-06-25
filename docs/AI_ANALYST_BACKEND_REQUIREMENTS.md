# AI Analyst — Backend Requirements (Full Dependency)

**Audience:** Backend / quant / data engineering (Ahil, Divyanshu, API maintainers)  
**Frontend reference:** `components/AnalystPanelInner.vue`, `composables/useClaudePanel.ts`, `composables/useOverwatch.ts`, `types/api.ts` (`OverwatchPanelAlert`, `ChatRequest`, `ChatResponse`)  
**BFF reference:** `server/api/chat.post.ts`, `server/api/overwatch.get.ts`, `server/utils/overwatch-panel.ts`, `server/utils/mindwealth-data.ts`  
**API baseline:** OpenAPI v1.6 (`mindwealth-api-docs-main 6/`)  
**Date:** June 2026  
**Status:** Chat is mostly live; alerts, system health, and morning brief are BFF-derived

---

## 1. Executive summary

The **AI Analyst** panel (floating chat + Overwatch alerts) has four tabs:

| Tab | Purpose | Backend today |
|-----|---------|---------------|
| **CHAT** | On-demand Q&A (signals, macro, web) | ✅ Live via chatbot async jobs |
| **ALERTS** | Auto-triggered degradation + macro signals | ⚠️ Partial — BFF stitches + enriches |
| **SIGNALS / MACRO** | Filtered alert views | Same as ALERTS |
| **SYSTEM** (admin) | Pipeline + integration health | ❌ Mostly placeholder in BFF |

**Highest-impact deliverable:** one **Analyst Alerts** endpoint returning ready-to-render `panel_alerts[]` (degradation copy, recommendations, real FWD trend, macro narratives).  
**Second deliverable:** **System Health** endpoint with real pipeline / integration checks.  
**Third deliverable:** **Analyst Brief** endpoint for dashboard snippet + optional pinned panel message.

Until these exist, the Nuxt BFF computes degradation rules, alert copy, synthetic sparklines, system-check placeholders, and dashboard `analyst_snippet` template strings in `server/utils/overwatch-panel.ts` and `mindwealth-data.ts`.

---

## 2. What already exists (wired today)

### 2.1 Chat (live — thin frontend)

Nuxt `POST /api/chat` → upstream chatbot job flow:

| Upstream path | Used for |
|---------------|----------|
| `POST /api/v1/chatbot/sessions` | Create session when none provided |
| `GET /api/v1/chatbot/config` | Job timeout (`deep_research_total_timeout_seconds`) |
| `POST /api/v1/chatbot/sessions/{id}/messages` | Enqueue message → `job_id` |
| `GET /api/v1/chatbot/jobs/{job_id}` | Poll until `completed` / `failed` |
| `GET /api/v1/chatbot/sessions/{id}/history?display=true` | Restore thread on panel open |
| `GET /api/v1/chatbot/sessions?limit=50` | Session list (**API live; UI not wired**) |

Preset routes (exist upstream; UI does not call them directly today):

| Preset | Upstream |
|--------|----------|
| Analyze Asset | `POST /api/v1/chatbot/analyze-asset` |
| Signal Insights | `POST /api/v1/chatbot/signal-insights` |
| Breadth Analysis | `POST /api/v1/chatbot/breadth-analysis` |
| Freeform | `POST /api/v1/chatbot/sessions/{id}/messages` |

Discovery endpoints available but unused by Analyst UI:

- `GET /api/v1/chatbot/signal-types`
- `GET /api/v1/chatbot/functions`
- `GET /api/v1/chatbot/tickers`

### 2.2 Alerts source data (partial — BFF transforms)

| Upstream path | BFF use today |
|---------------|---------------|
| `GET /api/v1/analytics/performance` | Raw CSV rows → degradation filter (`win < backtest - 10`) |
| `GET /api/v1/macro/runic/nightly` | Dominant combo → macro panel alert |
| `GET /api/v1/signals/shortlist` | WR aggregate fallback in overwatch KPIs |
| `GET /api/v1/macro/narrative` | **Not used by Analyst** (exists; nightly brief narrative) |
| `GET /api/v1/analytics/sentiment/layers` | **Not used by Analyst** (SSI composite exists) |
| `GET /api/v1/health` | **Not used by Analyst** (conviction store only) |

### 2.3 Frontend-only (acceptable to keep client-side)

| Item | Location | Notes |
|------|----------|-------|
| Markdown → HTML | `utils/analyst-markdown.ts` | Presentation |
| Tab filter / badge text | `useOverwatch.ts` | UX state |
| Alert seen / dismissed / auto-open | `useOverwatch.ts` | Client dedup |
| 60s poll timer | `useOverwatch.ts` | Optional → push later |
| Session ID in `localStorage` | `useClaudePanel.ts` | Convenience |
| Status badge colors | `AnalystSignalAlertCard.vue` | Display from `above_floor`, `gap` |

---

## 3. What the BFF computes today (must move to backend)

### 3.1 Degradation detection (`signal-parsers.ts`)

```
Filter: Function === "Forward Testing"
Alert when: fwd_wr < backtest_wr - 10  (percentage points)
gap = fwd_wr - backtest_wr
```

### 3.2 Panel alert enrichment (`overwatch-panel.ts`)

| Logic | Rule | Backend should own |
|-------|------|------------------|
| `FLOOR_PCT` | 60% absolute FWD floor | `above_floor: fwd_wr >= 60` |
| Pattern text | `win < 60` → absolute floor message; `gap <= -15` → combo issue; else asset-specific | `signal.pattern` |
| Recommendation | Rule-based strings per pattern | `recommendation` |
| `fwd_trend` | **Synthetic** 4-point interpolation from current gap | **Real weekly FWD history** |
| Alert `id` | `deg-{strategy}-{signal_type}-{interval}` | Stable server-generated id |
| Alert `html` | Pre-rendered summary string | `html` or structured fields only |
| Runic alert | Slice of nightly `narrative` (220 chars) | Full analyst-authored macro alert |
| Mock runic fallback | `mockRunicPanelAlert()` when nightly missing | Remove — return empty or real SSI+macro alert |

### 3.3 System checks (`buildSystemChecks()`)

| Check | Today |
|-------|-------|
| US CSV pipeline | Age from `meta.data_updated_at` only |
| India CSV pipeline | Hardcoded `UNAVAILABLE_FETCH` |
| Claude API | Hardcoded placeholder |
| Tavily | Hardcoded placeholder |
| Google Sheets sync | Date heuristic only |

### 3.4 Dashboard AI brief (`loadDashboard()`)

Template string — **not** Claude output:

```
"{topTicker} leads active book on {function} ({wr} backtest WR). {long} long / {short} short outstanding."
```

Should use `GET /macro/narrative` or dedicated brief endpoint.

### 3.5 Chat preset routing (`sendChatMessage()`)

BFF infers preset from body fields; UI only sends `message` + `session_id`. Backend config should expose presets for UI to pass explicitly.

---

## 4. Gap overview — endpoints needed

| Priority | Endpoint | Replaces BFF logic | Blocks |
|----------|----------|-------------------|--------|
| **P0** | `GET /api/v1/analytics/analyst/alerts` | `degradationToPanelAlert`, runic merge, mock fallback | ALERTS / SIGNALS / MACRO tabs |
| **P0** | `GET /api/v1/analytics/analyst/fwd-trend` | Synthetic `fwd_trend` sparklines | Degradation trend bars |
| **P1** | `GET /api/v1/system/health` (extend) | `buildSystemChecks()` placeholders | SYSTEM tab (admin) |
| **P1** | `GET /api/v1/analytics/analyst/brief` | Dashboard `analyst_snippet` template | Dashboard AI brief card |
| **P2** | Extend `GET /api/v1/chatbot/config` | Hardcoded `ANALYST_SUGGESTED_PROMPTS`, empty-state schedules | Chat UX polish |
| **P2** | Wire existing `GET /chatbot/sessions` + `DELETE /sessions/{id}` | — | Session picker UI (no new route) |
| **P3** | `GET /api/v1/analytics/analyst/alerts/stream` (optional) | Client poll + dedup | Real-time push |

---

## 5. New endpoint specifications

### 5.1 `GET /api/v1/analytics/analyst/alerts` — **P0**

**Purpose:** Single source of truth for AI Analyst Overwatch tabs. Returns display-ready alerts; frontend only filters by `type`.

**Maps to (suggested):** `overwatch_degradations()` + runic/SSI alert builder in Python (`terminal_data` / new `analyst_service`).

#### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `include_macro` | boolean | `true` | Include runic / SSI macro alerts |
| `include_degradation` | boolean | `true` | Include FWD degradation alerts |
| `floor_pct` | number | `60` | Absolute FWD floor (configurable) |
| `gap_threshold_pp` | number | `10` | BT vs FWD gap to trigger degradation |
| `since` | ISO datetime | — | Only alerts created after (for incremental poll) |

#### Response `200 OK`

```json
{
  "meta": {
    "data_updated_at": {
      "datetime": "2026-06-25T09:21:00+05:30",
      "timezone": "IST"
    },
    "floor_pct": 60,
    "gap_threshold_pp": 10,
    "next_signal_check": "2026-06-30T08:00:00+12:00",
    "next_macro_scan": "2026-06-26T08:00:00+12:00"
  },
  "count": 2,
  "panel_alerts": [
    {
      "id": "deg-deltadrift-short-daily",
      "type": "degradation",
      "label": "AI ANALYST · AUTO-TRIGGERED · DEGRADATION ALERT",
      "html": "DeltaDrift short gap: BT 88% vs FWD 71.3%. Below 60% floor.<br>Combo issue: DeltaDrift/Short — gap vs backtest exceeds 15pp.",
      "recommendation": "pause new entries on this combo, monitor weekly FWD trend",
      "fwd_trend": [74.2, 73.1, 72.0, 71.3],
      "created_at": "2026-06-25T09:00:00Z",
      "signal": {
        "strategy": "DeltaDrift",
        "interval": "Daily",
        "signal_type": "Short",
        "fwd_wr": 71.3,
        "backtest_wr": 88.0,
        "gap": -16.7,
        "pattern": "Combo issue: DeltaDrift/Short — gap vs backtest exceeds 15pp",
        "above_floor": true
      }
    },
    {
      "id": "runic-dominant-c",
      "type": "runic",
      "label": "AI ANALYST · RUNIC SIGNAL · MACRO INTELLIGENCE",
      "html": "Dominant <span class=\"wa\">Combo C</span>: Combo C active (week 11, MEDIUM). Tactical tight money...",
      "footer": "BRAVE/FEARFUL · TACTICAL TIGHT MONEY / STRATEGIC EASY MONEY · LIVE API",
      "created_at": "2026-06-25T06:00:00Z",
      "macro": {
        "combo": "C",
        "reason": "Combo C active (week 11, MEDIUM). 83% 3M hit rate.",
        "narrative": "Tactical tight money with strategic easy money backdrop...",
        "brave_fearful": "TACTICAL_TIGHT_MONEY",
        "variant": "dominant"
      }
    }
  ]
}
```

#### Field contract (matches `OverwatchPanelAlert` in `types/api.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `panel_alerts[].id` | string | yes | Stable across polls until alert clears |
| `type` | `"degradation"` \| `"runic"` \| `"system"` | yes | Frontend tabs filter on this |
| `label` | string | yes | Card header |
| `html` | string | yes | Summary body (may include `<span class="wa">`) |
| `recommendation` | string | no | Shown in signal cards |
| `fwd_trend` | number[4] | no | **Real** weekly FWD % readings, oldest → newest |
| `footer` | string | no | Macro card footer tags |
| `created_at` | ISO datetime | yes | For ordering / `since` filter |
| `signal` | object | if `type=degradation` | See `OverwatchPanelSignalDetail` |
| `macro` | object | if `type=runic` | See `OverwatchPanelMacroDetail` |

#### Business rules (authoritative on backend)

1. **Degradation:** include when `fwd_wr < backtest_wr - gap_threshold_pp` (default 10pp).
2. **`above_floor`:** `fwd_wr >= floor_pct` (default 60).
3. **Pattern tiers:**
   - `fwd_wr < floor_pct` → absolute floor degradation
   - `gap <= -15` → combo / strategy gap issue
   - else → asset-specific review
4. **Runic alerts:** build from `/macro/runic/nightly` + `/macro/narrative`; optionally enrich with SSI from `/analytics/sentiment/layers` and Tavily context when configured.
5. **No mock data** when sources missing — return `panel_alerts: []` with `meta` explaining staleness.

#### Example

```bash
curl -s "$BASE/api/v1/analytics/analyst/alerts" | jq '{count, types: [.panel_alerts[].type]}'
```

---

### 5.2 `GET /api/v1/analytics/analyst/fwd-trend` — **P0**

**Purpose:** Historical weekly FWD win-rate series for degradation sparklines. Eliminates synthetic interpolation in BFF.

**Alternative:** embed `fwd_trend` directly in each degradation alert (§5.1) — preferred if it avoids N+1 calls.

#### Query parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `strategy` | string | yes | e.g. `DeltaDrift` |
| `signal_type` | string | yes | `Long` \| `Short` |
| `interval` | string | yes | `Daily` \| `Weekly` \| `Monthly` |
| `weeks` | integer | no | Default `4` |

#### Response `200 OK`

```json
{
  "strategy": "DeltaDrift",
  "signal_type": "Short",
  "interval": "Daily",
  "floor_pct": 60,
  "points": [
    { "week_ending": "2026-06-02", "fwd_wr": 74.2 },
    { "week_ending": "2026-06-09", "fwd_wr": 73.1 },
    { "week_ending": "2026-06-16", "fwd_wr": 72.0 },
    { "week_ending": "2026-06-23", "fwd_wr": 71.3 }
  ]
}
```

**Source (suggested):** rolling forward-testing snapshots from trade store or performance report history — same data Streamlit Overwatch uses if available.

---

### 5.3 `GET /api/v1/system/health` — **P1** (extend existing)

**Purpose:** Replace hardcoded Analyst SYSTEM tab checks. Extend current `GET /api/v1/health` or add sibling route.

**Current `GET /health` only returns:** API version + conviction store writability.

#### Proposed response `200 OK`

```json
{
  "status": "ok",
  "version": "1.6.0",
  "checked_at": "2026-06-25T10:00:00Z",
  "checks": [
    {
      "name": "US CSV pipeline",
      "status": "ok",
      "detail": "42m ago",
      "last_success_at": "2026-06-25T09:18:00+05:30"
    },
    {
      "name": "India CSV pipeline",
      "status": "warn",
      "detail": "3h ago — delayed",
      "last_success_at": "2026-06-25T07:00:00+05:30"
    },
    {
      "name": "Claude API",
      "status": "ok",
      "detail": "reachable · 240ms",
      "last_success_at": "2026-06-25T09:55:00Z"
    },
    {
      "name": "Tavily",
      "status": "ok",
      "detail": "reachable",
      "last_success_at": "2026-06-25T09:50:00Z"
    },
    {
      "name": "Google Sheets sync",
      "status": "ok",
      "detail": "2026-06-25",
      "last_success_at": "2026-06-25T06:00:00+05:30"
    },
    {
      "name": "Chatbot job queue",
      "status": "ok",
      "detail": "0 pending · 2 running",
      "last_success_at": "2026-06-25T10:00:00Z"
    }
  ]
}
```

| `status` | Meaning |
|----------|---------|
| `ok` | Healthy |
| `warn` | Degraded / stale |
| `fail` | Down or blocking |

Maps directly to `OverwatchSystemCheck[]` in frontend.

---

### 5.4 `GET /api/v1/analytics/analyst/brief` — **P1**

**Purpose:** Real morning brief for dashboard `analyst_snippet` and optional pinned Analyst panel message.

**Maps to (suggested):** Claude nightly run output + outstanding signal summary — may wrap existing `/macro/narrative` with signal book context.

#### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `max_chars` | integer | `500` | Truncate for dashboard card |
| `format` | string | `markdown` | `markdown` \| `plain` |

#### Response `200 OK`

```json
{
  "meta": {
    "data_updated_at": { "datetime": "2026-06-25T09:21:00+05:30" },
    "generated_at": "2026-06-25T06:00:00Z",
    "source": "nightly_claude"
  },
  "snippet": "Fractal Track signals on JPM and BAC show strong confirmation. 63 long / 18 short outstanding. Combo C active — hold core, no new longs.",
  "full_text": "...(longer markdown for panel pin)...",
  "highlights": {
    "outstanding_long": 63,
    "outstanding_short": 18,
    "top_ticker": "JPM",
    "top_function": "Fractal Track",
    "dominant_combo": "C",
    "ssi_score": "+0.42",
    "degradation_count": 1
  }
}
```

**Fallback chain (backend):**

1. Pre-generated nightly analyst brief (Claude)
2. `/macro/narrative` narrative + signal counts
3. Deterministic summary (no LLM) — last resort

Frontend maps `snippet` → `DashboardResponse.analyst_snippet`.

---

### 5.5 Extend `GET /api/v1/chatbot/config` — **P2**

**Purpose:** Drive Analyst chat UX from backend instead of hardcoded frontend constants.

#### Additional fields (proposed)

```json
{
  "features": { "...": "..." },
  "limits": { "deep_research_total_timeout_seconds": 120 },
  "analyst": {
    "suggested_prompts": [
      "Summarize today's outstanding signals",
      "What's the current macro regime?",
      "Which functions are degrading?",
      "Review AAPL open positions"
    ],
    "presets": [
      {
        "id": "freeform",
        "label": "Freeform",
        "default_signal_types": []
      },
      {
        "id": "signal_insights",
        "label": "Signal Insights",
        "default_signal_types": ["entry"]
      },
      {
        "id": "analyze_asset",
        "label": "Analyze Asset",
        "default_signal_types": ["entry", "exit"]
      },
      {
        "id": "breadth_analysis",
        "label": "Breadth Analysis",
        "default_signal_types": ["breadth"]
      }
    ],
    "schedules": {
      "signal_check_label": "Next check · Weekly · Mon 08:00 NZDT",
      "macro_scan_label": "Next scan · Daily · 08:00 NZDT"
    },
    "page_context_enabled": true
  }
}
```

When `page_context_enabled` is true, frontend should send current page label in chat message metadata (future `context_page` field on enqueue body).

---

### 5.6 Existing endpoints — wire only (no new backend work)

| Endpoint | UI work needed |
|----------|----------------|
| `GET /api/v1/chatbot/sessions` | Session picker in Analyst panel |
| `DELETE /api/v1/chatbot/sessions/{id}` | Delete old sessions |
| `PATCH /api/v1/chatbot/sessions/{id}` | Rename session title |
| `GET /api/v1/chatbot/signal-types` | Advanced filter drawer (future) |
| `GET /api/v1/macro/narrative` | Fallback for brief until §5.4 ships |

---

### 5.7 `GET /api/v1/analytics/analyst/alerts/stream` — **P3** (optional)

**Purpose:** Server-push new alerts; replace 60s poll + client `seenAlertIds` dedup.

**Options:** SSE or WebSocket.

#### SSE event shape

```
event: alert
data: {"action":"created","alert":{...OverwatchPanelAlert...}}

event: alert
data: {"action":"cleared","id":"deg-deltadrift-short-daily"}
```

Not required for v1 full dependency if §5.1 supports `since` query param for efficient polling.

---

## 6. Nuxt BFF migration (after backend ships)

| BFF file | Change |
|----------|--------|
| `server/api/overwatch.get.ts` | Pass through `GET /analytics/analyst/alerts` + `GET /system/health`; delete `buildOverwatchPanelPayload` enrichment |
| `server/utils/overwatch-panel.ts` | Remove `degradationToPanelAlert`, `inferPattern`, `mockRunicPanelAlert`, synthetic `fwd_trend` |
| `server/utils/signal-parsers.ts` | Remove `parseForwardTestingRows` from overwatch path (keep for other pages if needed) |
| `server/utils/mindwealth-data.ts` | `loadDashboard().analyst_snippet` ← `GET /analytics/analyst/brief` |
| `composables/useClaudePanel.ts` | Load prompts from `/api/chat/config` proxy; pass `preset` / filters to `postChat` |
| `composables/useOverwatch.ts` | Optional: use `since` on poll; remove client pattern/recommendation assumptions |

---

## 7. Frontend contract summary

### Types (already defined — `types/api.ts`)

- `OverwatchPanelAlert`, `OverwatchPanelSignalDetail`, `OverwatchPanelMacroDetail`
- `OverwatchSystemCheck`
- `ChatRequest`, `ChatResponse`, `ChatSessionsResponse`

### Nuxt proxy routes (after migration)

| Nuxt route | Upstream |
|------------|----------|
| `GET /api/overwatch` | `GET /analytics/analyst/alerts` + `GET /system/health` (merged) |
| `GET /api/analyst/brief` | `GET /analytics/analyst/brief` (new BFF route for dashboard) |
| `POST /api/chat` | Unchanged (chatbot jobs) |
| `GET /api/chat/history` | Unchanged |
| `GET /api/chat/sessions` | Unchanged |
| `GET /api/chat/config` | `GET /chatbot/config` (new proxy) |

---

## 8. Implementation priority

| Phase | Deliverable | Unblocks |
|-------|-------------|----------|
| **Phase 1** | `GET /analytics/analyst/alerts` with real `fwd_trend` embedded | ALERTS tabs — remove all BFF alert logic |
| **Phase 2** | `GET /system/health` extended checks | SYSTEM tab (admin) |
| **Phase 3** | `GET /analytics/analyst/brief` | Dashboard AI brief card |
| **Phase 4** | Extend `GET /chatbot/config` + wire session list UI | Chat presets, prompts, session picker |
| **Phase 5** | Optional alert stream | Real-time push |

---

## 9. Acceptance criteria

- [ ] `GET /analytics/analyst/alerts` returns `panel_alerts` matching `OverwatchPanelAlert` without BFF transformation
- [ ] `fwd_trend` values are historical — not interpolated from current gap
- [ ] Degradation rules (`10pp` gap, `60%` floor) are configurable via query or server config
- [ ] No `mockRunicPanelAlert` or synthetic data when sources are missing
- [ ] `GET /system/health` returns all six checks with real timestamps
- [ ] `GET /analytics/analyst/brief` replaces dashboard template snippet
- [ ] Chat continues to work via existing job flow (no regression)
- [ ] `GET /chatbot/sessions` listable from Analyst panel (frontend wiring)

---

## 10. Python reference map (suggested)

| JSON section | Suggested module |
|--------------|------------------|
| Panel alerts | New `analyst_service.build_panel_alerts()` |
| Degradation rows | `terminal_data.overwatch_degradations()` |
| FWD trend history | New — trade store weekly snapshots |
| Macro alerts | `macro_service.get_narrative()` + `get_runic_nightly()` |
| System health | New `health_service.check_integrations()` |
| Morning brief | Nightly Claude job + `dashboard_metrics()` summary |
| Chat | `chatbot.chatbot_engine.ChatbotEngine` (existing) |

---

## 11. Related docs

- `docs/API_LIVE_VS_MOCK_AUDIT.md` — § Overwatch / Analyst panel
- `docs/FRONTEND_DATA_CONTRACT.md` — §13 AI Chat, §7.2 Degradation alerts
- `mindwealth-api-docs-main 6/services/chatbot/README.md`
- `mindwealth-api-docs-main 6/services/macro/endpoints/get-narrative.md`
- `mindwealth-api-docs-main 6/services/analytics/endpoints/get-performance.md`

---

*Generated for MindWealth Alpha Terminal AI Analyst full backend dependency. Update when BFF migration completes.*
