# Signals Page — Backend Requirements

**Audience:** Backend / quant / data engineering (Divyanshu, Ahil, API maintainers)  
**Frontend reference:** `pages/signals.vue`, `types/api.ts`, `utils/signal-surface.ts`, `server/utils/mindwealth-data.ts`  
**API baseline:** OpenAPI v1.2+ (`mindwealth-api-docs-main 3/`)  
**Date:** June 2026  
**Status:** Tables + reports mostly wired; Surface / Ranked Cards blocked on enriched per-signal fields

---

## 1. Executive summary

The **Signals** page (`/signals`) has these zones:

| Zone | Sidebar / control | Display modes |
|------|-------------------|---------------|
| **Signal lists** | Outstanding · New · Claude Shortlisted · All Signal Report | Tables · Surface · Ranked Cards |
| **Reports** | SBI — Breadth · Horizontal & New High · Combined Performance | Fixed report layouts (no display-mode toggle) |

**Highest-impact deliverable:** enrich `outstanding_signal.csv`, `new_signal.csv`, and `all_signal.csv` with **pre-computed surface / quality fields** per signal (see §5). The UI reads them from each row’s `raw_fields` — it does **not** compute `composite_score`, `window_remaining_pct`, `tier`, etc. on the frontend.

**Second deliverable:** structured Claude shortlist records and accurate summary counts (§6).

**No new endpoint is strictly required** for Surface / Ranked Cards if enriched columns are added to the existing signal report CSVs. A dedicated JSON endpoint is optional but would simplify typing and versioning.

---

## 2. What already exists (wired today)

Nuxt BFF routes → upstream MindWealth API / trade-store overlays:

| Nuxt route | Upstream source | Signals page use |
|------------|-----------------|------------------|
| `GET /api/signals/outstanding` | `outstanding_signal.csv` via overlay | Outstanding table / surface / cards |
| `GET /api/signals/new` | `new_signal.csv` | New Signals views |
| `GET /api/signals/all` | `all_signal.csv` | All Signal Report |
| `GET /api/shortlist` | `GET /api/v1/signals/shortlist` | Shortlist count + symbol filter |
| `GET /api/signals/counts` | Overlays + shortlist | Sidebar nav badges |
| `GET /api/breadth` | `breadth.csv` | SBI — Breadth report |
| `GET /api/signals/horizontal-new-high` | `GET /api/v1/signals/reports/horizontal-new-high/latest` | Horizontal & New High report |
| `GET /api/signals/combined-performance` | `combined_performance_report.csv` | Combined Performance report |

### 2.1 Per-signal fields available today (parsed from CSV)

From `server/utils/signal-parsers.ts` → `Signal` type:

| Field | Typical CSV column |
|-------|-------------------|
| `symbol`, `signal_type`, `signal_date`, `signal_price` | `Symbol, Signal, Signal Date/Price[$]` |
| `function` | `Function` |
| `interval` | `Interval` / `Interval, Confirmation Status` |
| `win_rate`, `num_trades` | `Win Rate [%], History Tested, Number of Trades` |
| `forward_wr` | `Forward Testing Win Rate[%]/...` |
| `spread` | `Spread` |
| `strategy_cagr` | `Backtested Strategy CAGR [%]` |
| `strategy_sharpe` | `Backtested Strategy Sharpe Ratio` |
| `confirmation_status` | `Interval, Confirmation Status` |
| `exit_status` | `Exit Signal Date/Price[$]` |
| `current_mtm` | `Current Mark to Market and Holding Period` |
| `raw_fields` | Full CSV row (all columns preserved) |

**FWD degraded** is derived on the frontend when `forward_wr < win_rate - 10` (10pp gap). No separate API flag required unless backend wants authoritative status.

---

## 3. Page views — data dependencies

### 3.1 Signal list views (Outstanding / New / Shortlist / All)

| Display mode | UI component | Minimum data | Full experience |
|--------------|--------------|--------------|-----------------|
| **Tables** | Signal table + `SignalDetailPanel` | §2.1 fields | All overlay columns in drill panel |
| **Surface** | `SignalSurfaceChart` | `composite_score`, `window_remaining_pct` | §5 full field set |
| **Ranked Cards** | `SignalRankedCards` | Any signal row | `composite_score` (sort), `tier`, `alpha_interpretation` |

Filters (function multi-select, interval dropdown) are **client-side** over the fetched signal array. No filter query params are sent to the API today.

**Shortlist behaviour:** table rows = outstanding signals whose `symbol` appears in shortlist `rows` / report. If shortlist returns only markdown and empty `records`, the UI falls back to filtering outstanding by symbols it can infer.

### 3.2 SBI — Breadth

| UI element | API field |
|------------|-----------|
| Composite score KPI | `sentiment.score`, `sentiment.label` |
| Per-function bars / table | `rows[].function`, `bullish_signal_percentage`, `bullish_asset_percentage` |
| Functions count KPI | Count of non-`Combined` rows |

**Note:** Function count is **whatever the backend puts in `breadth.csv`** — the UI does not cap at 4 or 10. Confirm with backend which functions SBI aggregates over.

### 3.3 Horizontal & New High

| UI column | Expected record field |
|-----------|----------------------|
| Type | `Report Type` |
| Ticker | `Symbol` |
| Today price | `Today price` / `Today Price` |
| New highest | `New Highest` / `New highest` |

**Gap:** `horizontal-new-high` slug is **not documented** in `mindwealth-api-docs-main 3/services/signals/README.md`. Frontend calls it directly; please add to API docs and confirm slug stability.

### 3.4 Combined Performance

| Section | CSV `Function` filter |
|---------|----------------------|
| Forward Testing · Function Health | `Forward Testing` |
| Latest Performance Summary | `Latest Performance` |

Uses `combined_performance_report.csv`. Strategy Health–specific columns from product brief (Gate A2b, Reliability) are **not** rendered yet — add to CSV if required.

---

## 4. Missing or unused API slugs (documented but not on Signals page)

From `mindwealth-api-docs-main 3/services/signals/README.md`:

| Slug | CSV file | Signals page |
|------|----------|--------------|
| `target-signals` | `target_signal.csv` | **Not wired** |
| `sigma` | `sigma.csv` | **Not wired** (Sigma lives on dashboard KPI) |
| `sentiment` | `sentiment.csv` | Used by `/sentiment`, not Signals |
| `f-stack` | `F-Stack-Analyzer.csv` | **Not wired** |
| `claude-shortlist` | `claude_signals_report.csv` | Partial — via `/signals/shortlist` only |

Confirm whether any of these should appear as additional Signals sidebar reports.

---

## 5. Enriched per-signal fields (Surface + Ranked Cards)

**Required for Surface chart to plot bubbles.** Add to signal report CSVs (or a dedicated endpoint) as **backend-precomputed** values. Frontend alias lookup supports snake_case and common label variants.

### 5.1 Critical (Surface blocked without these)

| Field | Type | Purpose |
|-------|------|---------|
| `composite_score` | int | Y-axis — signal quality (E[R] + alpha + Sharpe composite) |
| `window_remaining_pct` | float | X-axis — `(avg_hold_days − days_elapsed) / avg_hold_days × 100` |

### 5.2 High priority (Ranked Cards + tooltips)

| Field | Type | Purpose |
|-------|------|---------|
| `tier` | string | `tA` · `best` · `tierc` · `exit` — tier badges |
| `mtm_pct` | float | Bubble size, card MTM (fallback: parse `current_mtm` string) |
| `days_elapsed` | int | Age / “new today” labels |
| `avg_hold_days` | int | Window tooltip (“Xd remaining of Yd avg”) |
| `er` | float | Expected return % |
| `signal_alpha` | float | Timing alpha vs random entry |
| `exit_fired` | bool | Exited bubble fade / card grouping (fallback: `exit_status`) |
| `alpha_interpretation` | object | `{ type, label, detail }` — warn/fail tags |

### 5.3 Medium priority (drill panel depth)

| Field | Type | Purpose |
|-------|------|---------|
| `upside_remaining_pct` | float | New-today surface variant |
| `rr_static` | float | R:R at entry |
| `rr_dynamic` | float | R:R from current price |
| `intrinsic_lag_days` | int | Detection lag note (informational) |
| `cagr_diff` | float | Diagnostic CAGR vs B&H |
| `bt_strategy_sharpe` | float | Sharpe in quality breakdown |
| `asset_class` | string | `equity`, `bond_etf`, etc. |
| `conviction_bq_score` | float \| null | BQ on ranked cards (equity only) |
| `conviction_fs_class` | string \| null | FS class on drill panel |

### 5.4 Delivery options

**Option A (preferred for minimal API change):** Add columns to existing CSVs. They flow through `recordToSignal()` → `raw_fields` automatically.

**Option B:** New endpoint, e.g. `GET /api/v1/signals/surface?report=outstanding-signals` returning enriched JSON array keyed by `symbol|function|signal_date|interval`.

**Option C:** Extend `GET /api/v1/signals/reports/{name}/latest` response schema to document enriched columns in OpenAPI.

---

## 6. Data quality gaps (existing endpoints)

| Issue | Current behaviour | Backend fix |
|-------|-------------------|-------------|
| **Shortlist `records` empty** | UI filters outstanding by symbol; Claude report text unused in table | Populate `records[]` on `GET /signals/shortlist` from `claude_signals_report.csv` |
| **`new_long` / `new_short` summary** | Frontend `buildSignalsSummary()` sets both from filtered long/short counts — not true “new today” split | Provide explicit summary fields in API or separate new-signal counts by direction |
| **Shortlist KPI delta** | Static copy `"cross-confirmed"` in template | Return shortlist metadata label from API |
| **Monthly interval filter** | UI offers Daily / Weekly / Yearly only — **Monthly** signals exist but cannot be filtered | Add `monthly` to interval filter once intervals are stable in data |
| **SBI function coverage** | Row count varies by `breadth.csv` content | Document which functions are included in SBI computation |
| **Horizontal & New High** | Undocumented slug; fails silently if report missing | Document slug; ensure daily CSV generation |
| **All Signal `function_counts`** | Only on outstanding loader today | Include `function_counts` on `all_signal` response if KPI needed |

---

## 7. Not implemented on Signals page (future / out of scope)

These appear in product briefs but are **not** in the current UI — listed so backend does not assume they exist:

| Feature | Depends on |
|---------|------------|
| Claude Optimized tab (Tier A / Best Available gates) | Claude tiering API or enriched `tier` + gate fields |
| Surface chart filter chips (No exit · Window ≥ 30%) | `exit_fired`, `window_remaining_pct` |
| Strategy Health tab (Gate A2b, Reliability columns) | Extended `combined_performance_report.csv` |
| Drill panel links → Conviction / Portfolio / Overwatch | Routes exist; deep-link params TBD |
| Display mode persistence | Frontend-only; no API |

---

## 8. Suggested backend checklist (priority order)

1. **Add `composite_score` and `window_remaining_pct`** to outstanding / new / all signal CSVs.
2. **Add `tier`, `mtm_pct`, `days_elapsed`, `avg_hold_days`, `signal_alpha`, `er`, `exit_fired`, `alpha_interpretation`** to the same files.
3. **Populate shortlist `records`** with structured rows (symbol, function, interval, direction, tier, etc.).
4. **Document `horizontal-new-high`** report slug in signals README + OpenAPI.
5. **Clarify SBI breadth** function universe and ensure `breadth.csv` includes all intended functions + `Combined` row.
6. **Provide accurate new-today summary** counts (long/short) distinct from total outstanding counts.
7. *(Optional)* Dedicated surface JSON endpoint if CSV column sprawl becomes unwieldy.

---

## 9. Verification commands

```bash
# Outstanding signals (check for enriched columns in records)
curl -s "$API_BASE/api/v1/signals/reports/outstanding-signals/latest" | jq '.records[0] | keys'

# Shortlist structured rows
curl -s "$API_BASE/api/v1/signals/shortlist" | jq '{row_count, records_len: (.records | length)}'

# Breadth function rows
curl -s "$API_BASE/api/v1/signals/reports/breadth/latest" | jq '[.records[].Function]'

# Horizontal & New High
curl -s "$API_BASE/api/v1/signals/reports/horizontal-new-high/latest" | jq '.row_count'

# Combined performance
curl -s "$API_BASE/api/v1/signals/reports/combined-performance/latest" | jq '.row_count'
```

After backend deploys enriched columns, verify in the UI:

1. Signals → Display **Surface** — bubbles appear; amber banner absent.
2. Signals → Display **Ranked Cards** — cards sort by quality; tier badges show.
3. SBI — Breadth — function count matches expected universe.

---

## 10. Frontend contacts

| Area | Owner |
|------|-------|
| Signals page UI | Parth |
| API / CSV pipeline | Divyanshu |
| Signal engine / field definitions | Ahil |
| Product / tier gates | Rohit |

**Related docs:** `docs/API_LIVE_VS_MOCK_AUDIT.md` (may be partially stale on Signals reports — reports nav is now wired), `docs/FRONTEND_DATA_CONTRACT.md` §5–§8.
