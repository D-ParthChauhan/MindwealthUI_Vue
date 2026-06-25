# Urgent Items — Backend vs Frontend Split

**Audience:** Parth (frontend / integration)  
**Source:** Urgent items list (June 2026) — sorted into what to receive from backend vs what to change in the frontend  
**Date:** June 2026  
**Status:** Planning / integration checklist — no implementation in this doc

---

## How to read this

| Symbol | Meaning |
|--------|---------|
| **Backend** | Ahil / Divyanshu deliver API, data, or computed outputs |
| **You (frontend)** | Wire endpoints, fix labels, add UI once data exists |
| **Blocked** | You cannot ship until backend lands |

---

## 1. Combo D & E — tighten thresholds

**Backend (Divyanshu/Ahil)**
- Tighten D/E combo detection thresholds in the nightly pipeline
- Re-run backtests; report: new thresholds, fire count (~20–40), bear hit rate per horizon
- Test D alone, E alone, D+E; overlay yield-curve regime (STEEPENING vs NORMAL)
- Updated combo status in `GET /macro/runic/nightly` and combo cards payload

**You (frontend)**
- Mostly **auto-updates** via existing Runic combos panel (`RunicCombosPanel.vue`) — active/watch status, legs, hit rates
- Optional: if backend adds regime-split hit rates or instance counts, add fields to combo cards (no new page)
- Sidebar nav in `terminal-configs.ts` (Combo D watch, Combo E active) updates when nightly JSON changes

**Blocked until:** tightened thresholds deployed and nightly re-run

---

## 2. Win rate gap — 77.3% vs 61% vs 72%

**Backend (Ahil — analysis + API)**
- Document the **gated portfolio combo list** (function × interval × direction)
- Explain methodology: old all-or-nothing gating → 77.3%; new wider gating → 61%; KEEP-list culling → ~72%
- Run KEEP vs current set: FWD WR, CAGR, Sharpe (long / short / combined)
- Expose authoritative aggregates — not hardcoded

**You (frontend)**
- **Remove the 77.3% hack** — today `utils/performance-aggregates.ts` forces `AVG_FORWARD_WR_OVERRIDE = 77.3`; dashboard BFF uses it
- Wire real `avg_win_rate` from `GET /analytics/performance` (or new gated-portfolio endpoint)
- Landing page (`useLandingStats.ts`) and dashboard KPI card update automatically once API returns correct number
- If backend exposes a **gated combo manifest** (19 KEEP combos), you could add a tooltip or Overwatch note — not required for Michele

**Key insight:** The 61% vs 72% gap is a **backend definition problem**, not a UI bug. You are currently showing 77.3% because of a frontend override, which masks the real number.

---

## 3. 30-asset forward + backtested portfolio (Michele priority)

**Backend (Ahil — urgent)**
- Stable **30-asset** gated portfolio from `portfolio_sizer.py`
- `GET /api/v1/portfolio/sizer` (or equivalent) with:
  - 30 positions (ticker, function, interval, direction, allocation $, BQ, flags)
  - Backtest + forward-tested metrics at portfolio level
  - Sharpe profile once stable

**You (frontend)**
- Portfolio page **already built** (`pages/portfolio.vue` + three sub-views)
- Today shows **"Could not compute"** for sizing fields — wire sizer response per `docs/PORTFOLIO_BACKEND_REQUIREMENTS.md`
- No new page; fill in: Sized Allocations, Live P&L columns, summary panel
- Divyanshu exposes endpoint → you proxy in BFF → bind props

**Blocked until:** sizer API returns real `clusters[]`, `positions[]`, `summary`, `ceiling`

---

## 4. CAGR & Sharpe chart (target Sharpe ≥ 2.5)

**Backend (Ahil)**
- Daily instantaneous returns at 27–30 asset level
- Computed: CAGR, Sharpe (long / short / combined)
- **Matplotlib chart** as PNG/SVG or time-series JSON for frontend charting

**You (frontend)**
- **New homepage chart** (user said "front page") — consume either:
  - `chart_url` / base64 image from API, or
  - `equity_curve[]` + `metrics` and render with existing chart component
- Update landing stats (`platform.vue` already has Sharpe slot via `useLandingStats`)
- Do **not** compute Sharpe client-side — display backend numbers only

**Depends on:** Item 3 portfolio stable at 30 assets

---

## 5. Regime Sharpe uplift demo (Michele meeting)

**Backend (Ahil)**
- Equal-weight benchmark: SPY, TLT, GLD, HYG (daily)
- Run twice: plain vs regime-scaled multipliers (5 dimensions)
- Return: Sharpe with/without regime, optionally equity curves

**You (frontend)**
- New comparison block — good homes: **landing/platform page**, **macro overview**, or **portfolio risk view**
- Simple side-by-side: "Without regime" vs "With regime" Sharpe (+ optional mini chart)
- Pure display; no client-side backtest

**Blocked until:** comparison endpoint or static JSON from Ahil's run

---

## 6. Short signals on rates & commodities

**Backend (Ahil)**
- Working short rules for `^TNX`, `HYG`, `LQD`, `GLD`, `SLV`, `EUR=X`
- Case study doc: any signal on `^TNX` / `SHY` / `TLT` around June 16–18 Warsh FOMC
- Signals appear in `outstanding_signal.csv` / `new_signal.csv`

**You (frontend)**
- Signals tables **auto-show** new shorts when CSV rows exist — no new signal type UI
- Optional: macro brief panel case-study callout if backend adds `event_case_studies[]` to nightly JSON
- Rates/FX shorts may need ticker normalization in display (already handled by signal parsers)

---

## 7. Pre/post scheduled-event regime intelligence

### 7a. Pre-catalyst fragility score

**Backend**
- Count macro variables in 60th–79th percentile pre-event
- Add to nightly JSON: `fragility_score: "HIGH"`, message, event calendar (FOMC + NFP dates from Investing.com feed extension)

**You (frontend)**
- Display on **Runic Overview** and/or **Brief** panel — new chip/banner when `fragility_score === "HIGH"`
- Event calendar: only if backend exposes dates in API; otherwise narrative-only in brief

### 7b. Post-event regime reclassification (greenfield)

**Backend — full build**
- Within 48h of macro event: re-run combos, detect 2+ threshold crossings
- New nightly fields: `regime_transition: true`, `transition_type` (CREDIBILITY_RESTORED, FISCAL_DOMINANCE_FEAR, BEAR_FLATTEN, BULL_STEEPEN, LIQUIDITY_SHOCK)
- Yield data from Yahoo around event dates

**You (frontend)**
- New **transition card** on macro page (Overview or Brief) when `regime_transition === true`
- Pill/badge for transition type + short explanation (backend should send `transition_summary` text)
- No detection logic in frontend

---

## 8. Fed cycle matrix — formalize

**Backend (confirm for Divyanshu)**
- Is 3×3 simplification (tightening/easing/pausing × 3 curve states) in code or conceptual?
- Are regime-adjusted hit rates grouped by 7 raw `fed_cycle` states or 3 buckets?
- Claude classifier `temperature: 0` for deterministic replay?

**You (frontend)**
- If 3×3 is product-facing: optional **matrix heatmap** on macro regime section (today shows raw pills: FED CYCLE, YIELD CURVE from `GET /macro/regime`)
- If backend only changes grouping internally, **no UI change**
- Display whatever `fed_cycle` / `curve_regime` strings API returns (already in `RunicBriefPanel`, regime strip)

---

## 9. Combo B regime-adjusted hit rate — validate

**Backend (Ahil)**
- Run the SQL against historical DB; share output or flag "CANNOT USE — DATA INSUFFICIENT"
- If valid: regime-split hit rates in combo metadata

**You (frontend)**
- Combo B card already shows `hit_rate_3m` badge if API sends it
- If backend adds per-regime breakdown (e.g. `hit_rates_by_fed_cycle`), add expandable section on combo card — **only after validated data**

---

## 10. CFTC Treasury futures (TY)

**Backend**
- New pull: US 10Y Treasury futures net Leveraged Money, 3yr percentile (same methodology as ES)
- Feeds fragility score + post-event reclassification

**You (frontend)**
- New row in **12-Variable table** (or sub-row under CFTC) when variable added to heatmap API
- Combo leg labels may update automatically (D uses CFTC)
- No new page

---

## 11. Cross-function exit flagging

**Backend (Ahil advises, Divyanshu implements)**
- Per-position: `cross_function_exit: { triggered: true, exit_price, triggering_function }`
- **Conflict list**: assets with open long + any-function exit signal
- MTM per asset in Portfolio Management report payload
- Same flags in Exit Report CSV/API

**You (frontend)**
- **Signals → Exit Report** (or equivalent report view): new column "Cross-Function Exit"
- **Portfolio → Live P&L**: conflict list section — visually prominent (match Claude conflict styling in analyst panel)
- Highlight rows where `cross_function_exit` or `conflict: true`
- Coordinate with Ahil on exact field names before building

---

## 12. Claude API — knowledge cutoff

**Backend (advise + fix)**

| Area | Required fix |
|------|----------------|
| Nightly briefing | Inject current regime + recent events in JSON payload to Claude — not model memory |
| Geopolitical overlay | Confirm scraper feeds prompt; not stale background knowledge |
| Tavily in chatbot | Confirm live web search for post-Aug 2025 events |

**You (frontend)**
- **Nightly brief** (`RunicBriefPanel`): already renders API narrative — no change if backend injects context
- **Chatbot context (Item 13)**: frontend sends `session_id` on each message but does **not** send `pageContext` to backend (`useClaudePanel.ts` only sets local state). Multi-turn breakage is likely **backend not loading session history into the model prompt** — flag to Divyanshu
- Optional: pass `page_context` in `ChatRequest` if backend adds support
- No frontend fix for Tavily — backend config

---

## 13. Display fixes — Macro Runic page

| Issue | Root cause | Who fixes |
|-------|-----------|-----------|
| CFTC "Expected Tue 2026-06-16" (past date) | Backend sends stale `expected_source_date` in `GET /macro/data/freshness`; frontend concatenates in `utils/macro-variables.ts` | **Backend** fixes next-Friday calculation; **you** format as "Data as of X · Next release expected Y" and hide past expected dates |
| All freshness tags wrong | Same freshness API | Backend primary; you validate display logic |
| "SBI Composite" vs "SSI" | `pages/signals.vue` line ~203: breadth report KPI says **"SBI COMPOSITE"**; sentiment page correctly says **"SSI COMPOSITE SCORE"** | **You** — rename breadth labels if product intent is SSI everywhere, or keep SBI for breadth report only (clarify with team: SBI = Signal Breadth Indicator, SSI = Super Sentiment Index — they are different products) |
| Chatbot not retaining context | Session ID persisted; history loaded on panel open; follow-ups use same session | **Backend** — ensure job handler includes prior messages in Claude call; **you** — verify `session_id` not cleared on navigation; consider passing conversation history count in debug |

**Your concrete frontend tasks for #13:**
1. Fix CFTC/freshness display formatting in `macro-variables.ts` + variable table notes
2. Audit and fix SBI/SSI label inconsistency (signals breadth vs sentiment)
3. Chat: test multi-turn with backend; if history API returns messages but model ignores them, backend fix

---

## 14. Runic feedback Google Doc

Not frontend — Ahil/doc completion.

---

## 15. 291 auto-discovered combos + economic rationale

**Backend**
- Selection process for combos >80% hit rate; economic rationale text per combo

**You (frontend)**
- Today: fixed combo cards A–G from nightly. **Future:** if backend exposes `discovered_combos[]`, new tab or section on Runic Combos panel
- Not actionable until backend ships list + rationale fields

---

## Your priority stack (what to wire first)

For Michele / tomorrow, in order:

1. **Portfolio sizer (Item 3)** — unblocks portfolio page + Sharpe story
2. **Regime Sharpe comparison (Item 5)** — single slide/chart for Michele
3. **Gated portfolio metrics (Items 2 + 4)** — real WR + Sharpe on dashboard/landing (drop 77.3% override)
4. **Display fixes (Item 13)** — quick wins you can do without backend
5. **Fragility + transition UI (Item 7)** — once nightly JSON has fields
6. **Cross-function exits (Item 11)** — once report API has columns

---

## Endpoints to ask Divyanshu for (consolidated)

| Endpoint / data | Feeds |
|-----------------|-------|
| `GET /api/v1/portfolio/sizer` | Portfolio page, 30-asset book |
| `GET /api/v1/analytics/gated-portfolio` (or extend performance) | Real avg FWD WR, combo manifest, CAGR, Sharpe |
| `GET /api/v1/analytics/regime-benchmark` | Item 5 Sharpe comparison |
| `GET /api/v1/analytics/portfolio-equity-curve` + chart asset | Homepage Sharpe chart |
| Extended `GET /macro/runic/nightly` | `fragility_score`, `regime_transition`, tightened D/E |
| Fixed `GET /macro/data/freshness` | CFTC dates |
| Enriched signal/portfolio reports | Cross-function exit columns, conflict list |
| CFTC TY variable in variables/heatmap | Item 10 |
| Chatbot session history in model prompt | Multi-turn chat |

---

## What you should **not** build yet

- Combo threshold tuning or backtest math
- Regime transition detection rules
- Sharpe/CAGR calculation
- Gated portfolio culling logic
- Claude prompt injection
- CFTC TY data pull

Those are all backend/quant. Your job starts when the endpoints and fields exist.

---

## Related docs

| Doc | Scope |
|-----|-------|
| `docs/DASHBOARD_BACKEND_REQUIREMENTS.md` | Dashboard KPIs, 77.3% override, win rate chart |
| `docs/PORTFOLIO_BACKEND_REQUIREMENTS.md` | Portfolio sizer contract, Live P&L gaps |
| `docs/SIGNALS_BACKEND_REQUIREMENTS.md` | Signal reports, breadth, cross-function exits |
| `docs/AI_ANALYST_BACKEND_REQUIREMENTS.md` | Chat, nightly brief, context injection |
