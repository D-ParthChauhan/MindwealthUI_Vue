# Portfolio Page — Backend Requirements

**Audience:** Backend / quant / data engineering (Ahil, Divyanshu, API maintainers)  
**Frontend reference:** `pages/portfolio.vue`, `types/api.ts` (`PortfolioResponse`), `mindwealth_portfolio_v4.html` (layout only — not data)  
**API baseline:** OpenAPI v1.4 (`mindwealth-api-docs-main 4/`)  
**Date:** June 2026  
**Status:** Frontend v4 layout shipped; blocked on sizer + risk APIs for full functionality

---

## 1. Executive summary

The Alpha Terminal **Portfolio** page has three sub-views:

| Sub-view | Purpose |
|----------|---------|
| **Sized Allocations** | Regime-aware recommended position sizes by investment type (cluster) |
| **Live P&L** | Open virtual-trading positions with prices, MTM, BQ, flags |
| **Portfolio Risk** | Cluster correlation matrix, breach list, user-entered holdings analysis |

The frontend is built and consumes **`GET /api/portfolio`** (Nuxt BFF). Today that route **stitches** several existing APIs but **cannot** reproduce Streamlit `portfolio_sizer.py` output. Any field the sizer owns is shown as **“Could not compute”** — the UI does not invent dollars, notional, cluster budgets, or scenario math.

**Highest-impact deliverable:** one **Portfolio Sizer** endpoint that returns the full allocation payload.  
**Second deliverable:** **Portfolio Risk** endpoint(s) for correlation + user holdings.

---

## 2. What already exists (wired today)

These upstream endpoints are called by `server/utils/mindwealth-data.ts` → `loadPortfolio()`:

| Upstream path | Used for |
|---------------|----------|
| `GET /api/v1/virtual-trading/long` | Open long positions (CSV rows) |
| `GET /api/v1/virtual-trading/short` | Open short positions (CSV rows) |
| `GET /api/v1/macro/regime` | Val regime, geo overlay, dominant combo, system recommendation |
| `GET /api/v1/macro/ssi/multiplier` | SSI multiplier, layer2 status |
| `GET /api/v1/macro/runic/variables/current` | VIX level + percentile |
| `GET /api/v1/macro/overview/kpis` | Combo C/F duration, CAPE / Combo E |
| Conviction loader (score-sheet + tickers) | BQ score, size tier, FD±, yield trap per ticker |
| Outstanding signals overlay | MULTI-SIG flag (2+ functions on same ticker) |

### Virtual trading CSV fields available today

From `virtual_trading_long.csv` / `virtual_trading_short.csv`:

| Column | Used in UI |
|--------|------------|
| `Symbol` | Ticker |
| `Function` | Signal function |
| `Interval` | Monthly / Weekly / Daily (normalized in UI) |
| `Signal` | Direction |
| `Status` | Open filter |
| `Entry Date` | — |
| `Entry Price` | Live P&L — Entry $ |
| `Today price` | Live P&L — Current $ |
| `Realised/Unrealised Profit` | P&L % (parsed from string) |
| `Backtested Win Rate [%]` | Not shown (spec INC-06: add to sizer output) |
| `Holding Period` | Not shown |
| `Exit Date` / `Exit Price` | Closed positions filtered out |

### Endpoints that exist but are **not** sufficient for Portfolio

| Endpoint | Why insufficient |
|----------|------------------|
| `GET /api/v1/virtual-trading/portfolio` | Returns only `{ long, short, combined_open }` counts — no sizing |
| `GET /api/v1/analytics/portfolio-ytd` | YTD aggregate for Overwatch — not position-level P&L |

---

## 3. Gap overview (what the UI still needs)

### 3.1 Critical — Portfolio Sizer API (new)

**Source of truth should be:** `portfolio_sizer.py` (same logic as Streamlit), not client-side heuristics.

The frontend contract is `PortfolioResponse` in `types/api.ts`. Fields that must come from the sizer:

#### `ceiling` — equity deployment ceiling

| Field | Description | Today |
|-------|-------------|-------|
| `vix` | Current VIX | ✅ `/macro/runic/variables/current` |
| `vix_pct` | VIX percentile (3yr window per INC-02) | Partial — variable dashboard |
| `vix_regime` | LOW_VOL / NORMAL / STRESS from VIX percentile | ❌ Not exposed as portfolio ceiling input |
| `val_regime` | EXTREME / HIGH / FAIR / CHEAP | ✅ `/macro/regime` |
| `geo_overlay` | NEUTRAL / REGIONAL_WAR / … | ✅ `/macro/regime` |
| `regime_max_pct` | Base max deploy % for active VIX regime (e.g. 80 NORMAL) | ❌ |
| `ssi_multiplier` | SSI haircut multiplier | ✅ `/macro/ssi/multiplier` |
| `vix_level_mult` | VIX band multiplier (e.g. 1.00) | ❌ |
| `spx_trend_mult` | SPX vs 200d multiplier | ❌ |
| `hy_credit_mult` | HY credit spread multiplier (e.g. 0.90) | ❌ |
| `final_ceiling_pct` | `regime_max × vix × trend × credit × ssi` (capped) | ❌ |
| `formula_text` | Human-readable formula trail for regime strip | ❌ |
| `note` | Explainer for sidebar calc box | Partial — `system_recommendation` |
| `portfolio_notional` | Total book size (spec: **$100,000,000**) | ❌ |
| `idle_cash_yield_pct` | Cash yield for idle-income line (e.g. 3.5%) | ❌ |
| `steps[]` | Sidebar calc box rows | Partial |

**Regime strip (global):** single gold **Equity ceiling %** (not duplicated), formula trail beside it, combo C/F amber strip, optional **MACRO OVERRIDE** pill when CAPE extreme + geo risk (informational — does not auto-change ceiling).

#### `scenarios` — NORMAL / STRESS / LOW VOL

Spec requires one-click scenario switch updating ceiling, cash, cluster dollars, summary panel.

| Scenario | Example ceiling | Example formula (from product spec) |
|----------|-----------------|-------------------------------------|
| NORMAL | 72% | 80% regime max × 1.00 × 1.00 × 0.90 credit |
| STRESS | 58% | 65% regime max × 1.00 × 1.00 × 0.90 credit |
| LOW VOL | 80% | 85% regime max × 1.00 × 1.00 × 0.95 credit |

Backend must expose:

- `scenarios_available: true`
- Per-scenario: `final_ceiling_pct`, `deployed_usd`, `cash_usd`, `idle_income_usd`, and **scaled cluster/position allocations**

Until then, frontend sets `scenarios_available: false` and disables STRESS / LOW VOL buttons.

#### `clusters[]` — investment types (not a flat “open book”)

Each cluster (e.g. Global risk-on, Semiconductors, Financials, Commodities, Canada defensive, …):

| Field | Description |
|-------|-------------|
| `id` | Stable slug, e.g. `global_risk_on` |
| `label` | Display name, e.g. `Global risk-on` |
| `budget_usd` | Max $ for this investment type this week |
| `budget_pct` | % of portfolio notional |
| `deployed_usd` | Sum of active position allocations |
| `deployed_pct` | % of portfolio deployed in this type |
| `max_pct` | Same as budget_pct or regime-adjusted cap |
| `positions[]` | Sized rows (below) |

**CLUSTER_BUDGETS** for STRESS and LOW VOL: Ahil to confirm values before frontend can wire scenarios (per product brief).

#### `positions` / allocation rows (within each cluster)

| Field | Source today | Needed from sizer |
|-------|--------------|-------------------|
| `ticker` | VT CSV | ✅ |
| `name` | — | Company / ETF name |
| `investment_type` | — | Cluster label |
| `function` | VT CSV | ✅ |
| `interval` | VT CSV | ✅ |
| `direction` | VT CSV | ✅ |
| `bq_score` | Conviction merge | Prefer sizer output for consistency |
| `size_tier` | Derived from conviction verdict | Prefer sizer: MAX / TACTICAL / REDUCED / BLOCKED |
| `allocation_usd` | — | **Sized dollar amount** |
| `allocation_pct` | — | **% of portfolio notional** |
| `flags[]` | MULTI-SIG, FD+, FD−, YIELD TRAP, DRAWDOWN | Sizer should emit authoritative flags |
| `blocked` | Client rules | Sizer should emit `blocked` + reason |

**Sizing rules (for validation / tooltips):**

| BQ | Tier | Share of cluster budget |
|----|------|-------------------------|
| ≥ +8 | MAX | 100% |
| +5 to +7 | TACTICAL | 75% |
| +2 to +4 | REDUCED | 40% |
| < +2 | BLOCKED | 0% |

**Adjustments:**

- FD+ → +10 percentage points on top of tier allocation  
- FD− → −15 percentage points  
- MULTI-SIG → ×1.10 ranking boost within cluster (not a separate bonus line)  
- Combo C active → new long entries −20 pct pts (existing positions unchanged)  
- Yield trap → hard zero  

#### `summary` — right panel + waterfall

| Field | Description |
|-------|-------------|
| `deployed_usd` | Total equities deployed |
| `deployed_pct` | % of notional |
| `cash_usd` | Notional − deployed |
| `cash_pct` | Cash % |
| `idle_income_usd` | `cash_usd × idle_cash_yield_pct` |
| `open_position_count` | Count of open sized positions |

#### `constraints[]` — constraint checks card

Backend should emit structured checks, e.g.:

- Cluster caps within budget (ok / warn / bad)  
- Combo C entry haircut active (warn)  
- Cash floor vs minimum (ok / warn)  
- Drawdown / auto-exit positions (warn)  
- Macro override flagged (warn)  

Today the BFF builds a minimal subset from available data.

---

### 3.2 Critical — Portfolio Risk API (new)

Frontend stub: `GET /api/portfolio/risk` → **501** until upstream exists.

Proposed upstream: **`GET /api/v1/portfolio/risk`** (and optionally **`POST /api/v1/portfolio/risk/analyze`**).

#### Correlation matrix (investment-type level, 8×8)

- Rows/columns = investment types (Global, Semis, Fin, Cmdty, CA Def, Tech L, India, Bonds, …)  
- Cell = average correlation between types (not full N×N stock matrix)  
- Diagonal = **1.00** always  
- Color thresholds: watch ρ > 0.75, breach action ρ > 0.85  

Response shape (illustrative):

```json
{
  "labels": ["global_risk_on", "semiconductors", "financials", "commodities", "canada_def", "us_tech", "india", "bonds"],
  "matrix": [
    [1.0, 0.87, 0.61, 0.22, 0.38, 0.83, 0.41, -0.31],
    [0.87, 1.0, 0.48, 0.19, 0.27, 0.79, 0.35, -0.22]
  ],
  "breaches": [
    {
      "pair": ["global_risk_on", "semiconductors"],
      "rho": 0.87,
      "combined_weight_pct": 30,
      "combined_weight_usd": 30000000,
      "cap_pct": 20,
      "recommendation": "Reduce semiconductors cluster by ~$10M or trim global risk-on."
    }
  ]
}
```

#### Cluster weight vs ceiling

Can be part of sizer response (`clusters[]`) or risk response — bars need `deployed_pct` vs `max_pct` per type.

#### User holdings entry (“Enter my portfolio”)

| Capability | Notes |
|------------|-------|
| Ticker search / typeahead | `GET /chatbot/tickers` exists but not wired; dedicated search preferred |
| Holdings list (symbol, qty, live price, notional) | User-specific; not in VT book |
| `POST /portfolio/risk/analyze` | Accept holdings + optional cash; return correlation vs model book, concentration, suggested actions |

---

### 3.3 High — Live P&L column gaps

Partially fillable from VT CSV + conviction; sizer should own authoritative values.

| Column | VT today | Needed |
|--------|----------|--------|
| Investment type | ❌ | From sizer cluster assignment |
| Entry $ | ✅ `Entry Price` | ✅ |
| Current $ | ✅ `Today price` | ✅ |
| Shares | ❌ | Quantity held (or computed: `allocation_usd / entry_price`) |
| Market value | ❌ | `shares × current_price` or explicit field |
| P&L $ | ❌ | Dollar MTM, not only `%` string |
| P&L % | ✅ parsed from `Realised/Unrealised Profit` | ✅ |
| BQ | Conviction merge | Prefer sizer |
| Size tier | Conviction verdict | Prefer sizer |
| Flags | Client merge | Prefer sizer |
| Win rate | ❌ | **INC-06** — Ahil to add to sizer output |

---

### 3.4 Medium — Regime / macro enrichments

Already partially available; portfolio page would consume if exposed on sizer or regime payload:

| Item | Endpoint / note |
|------|-----------------|
| VIX percentile **3yr window** | **INC-02** — Ahil: move from 1yr to 3yr in `portfolio_sizer.py` |
| Full ceiling decomposition | Not on `/macro/regime` today |
| Combo C entry haircut % | Active combo detail — affects sizing, not just narrative |
| Idle cash yield source | Config or market data feed — not hardcoded in API |

---

## 4. Proposed API: Portfolio Sizer (recommended contract)

**Method:** `GET`  
**Path:** `/api/v1/portfolio/sizer`  
**Query (optional):** `scenario=normal|stress|lowvol` (or return all scenarios in one payload)

**Maps to:** `portfolio_sizer.py` nightly / on-demand run  
**Typical status:** 200; 404 if sizer output file missing

### Example response (truncated)

```json
{
  "date": "2026-06-20",
  "as_of": "2026-06-20T08:04:00-04:00",
  "scenario": "normal",
  "scenarios_available": true,
  "ceiling": {
    "vix": 16.4,
    "vix_pct": 40,
    "vix_regime": "NORMAL",
    "val_regime": "EXTREME",
    "geo_overlay": "NEUTRAL",
    "regime_max_pct": 80,
    "ssi_multiplier": 1.0,
    "vix_level_mult": 1.0,
    "spx_trend_mult": 1.0,
    "hy_credit_mult": 0.9,
    "final_ceiling_pct": 72,
    "formula_text": "80% regime max × 1.00 VIX × 1.00 trend × 0.90 HY credit",
    "portfolio_notional": 100000000,
    "idle_cash_yield_pct": 3.5,
    "note": "HY credit at 318bp = mild stress, 10% haircut applied."
  },
  "summary": {
    "deployed_usd": 72000000,
    "deployed_pct": 72,
    "cash_usd": 28000000,
    "cash_pct": 28,
    "idle_income_usd": 980000,
    "open_position_count": 24
  },
  "clusters": [
    {
      "id": "global_risk_on",
      "label": "Global risk-on",
      "budget_usd": 18000000,
      "budget_pct": 18,
      "deployed_usd": 14040000,
      "deployed_pct": 14.04,
      "max_pct": 18,
      "positions": [
        {
          "ticker": "SPY",
          "name": "SPDR S&P 500 ETF",
          "investment_type": "Global risk-on",
          "function": "FractalTrack",
          "interval": "Monthly",
          "direction": "Long",
          "bq_score": 7,
          "size_tier": "TACTICAL 75%",
          "allocation_usd": 6750000,
          "allocation_pct": 6.75,
          "flags": [],
          "blocked": false
        }
      ]
    }
  ],
  "pnl_rows": [],
  "constraints": [
    { "level": "ok", "title": "Cluster caps", "body": "All clusters within budget." },
    { "level": "warn", "title": "Combo C active", "body": "New long entries reduced by 20 pct pts this week." }
  ],
  "active_combos": [
    { "id": "C", "label": "COMBO C wk 11", "detail": "Bearish 83% · new entries −20 pct pts" },
    { "id": "F", "label": "COMBO F wk 8", "detail": "Recovery window · bullish 78%" }
  ],
  "macro_override": {
    "active": true,
    "reasons": ["Valuation extreme: CAPE 42×", "Geopolitical: REGIONAL WAR"]
  },
  "risk": {
    "available": false,
    "message": "Use GET /api/v1/portfolio/risk for correlation matrix."
  }
}
```

`pnl_rows` can mirror allocation rows with price/P&L columns populated, or remain a separate array with the same tickers.

### Frontend integration path

Once `/portfolio/sizer` exists:

1. Add `loadPortfolioSizer()` in `mindwealth-data.ts`  
2. Prefer sizer response over BFF merge; keep VT + conviction as fallback only if sizer missing  
3. Set `scenarios_available: true` when scenario payloads included  
4. Remove client-side `clusterForSymbol()` / even-split logic (already removed)

---

## 5. Proposed API: Portfolio Risk

### `GET /api/v1/portfolio/risk`

Returns cluster correlation matrix + breaches + cluster weight bars (see §3.2).

### `GET /api/v1/portfolio/risk/search?q=NVDA`

Optional ticker autocomplete for holdings entry.

### `POST /api/v1/portfolio/risk/analyze`

**Body:**

```json
{
  "holdings": [
    { "symbol": "SPY", "quantity": 120 },
    { "symbol": "QQQ", "quantity": 85 }
  ],
  "cash_usd": 38293
}
```

**Response:** concentration vs model book, correlation breaches involving user holdings, suggested trims (same structure as “Actions required” in UI).

---

## 6. Priority and ownership

| Priority | Item | Suggested owner | Blocks |
|----------|------|-----------------|--------|
| **P0** | `GET /portfolio/sizer` full `PortfolioResponse` | Ahil (`portfolio_sizer.py`) | Sized Allocations, summary, regime ceiling $, scenarios |
| **P0** | `portfolio_notional` + cluster budgets + per-position `allocation_usd` | Ahil | All dollar displays |
| **P1** | `GET /portfolio/risk` correlation + breaches | Backend / quant | Portfolio Risk matrix |
| **P1** | `POST /portfolio/risk/analyze` + ticker search | Backend | “Enter my portfolio” panel |
| **P2** | VIX 3yr percentile in sizer (**INC-02**) | Ahil | Accurate VIX regime label |
| **P2** | Win rate on P&L rows (**INC-06**) | Ahil | Live P&L column |
| **P2** | STRESS / LOW VOL `CLUSTER_BUDGETS` | Ahil | Scenario switcher |
| **P3** | Shares, market value, P&L $ on VT CSV or sizer | Data / Ahil | Live P&L completeness |
| **P3** | Company `name` per symbol | Conviction ticker or reference data | Name column |

---

## 7. Acceptance criteria (definition of done)

### Portfolio Sizer

- [ ] `GET /api/v1/portfolio/sizer` returns 200 with all `ceiling`, `summary`, and `clusters` fields populated  
- [ ] `portfolio_notional` matches configured book size (100M in product spec)  
- [ ] `final_ceiling_pct` matches Streamlit sizer for same date/scenario  
- [ ] Sum of `allocation_usd` across non-blocked positions ≤ `deployed_usd` within rounding  
- [ ] `scenarios_available: true` and NORMAL/STRESS/LOW VOL each return distinct ceiling + scaled allocations  
- [ ] Combo C active reduces **new** entry sizes only; existing positions unchanged  
- [ ] Yield trap tickers have `blocked: true`, `allocation_usd: 0`  
- [ ] Frontend shows no “Could not compute” on Sized Allocations sub-view when sizer is live  

### Portfolio Risk

- [ ] `GET /api/v1/portfolio/risk` returns N×N matrix with diagonal 1.0  
- [ ] Breaches list includes only pairs with ρ > 0.85 (or configurable threshold)  
- [ ] `POST /portfolio/risk/analyze` accepts holdings and returns actionable recommendations  

### Live P&L

- [ ] Every open VT position has entry, current, P&L %, and either shares+market value or explicit MV  
- [ ] Investment type column matches sizer cluster `label`  

---

## 8. Explicit non-goals (backend team)

- **Forced Portfolio** tab — removed from v4 spec; do not rebuild unless product re-requests  
- Frontend will **not** hardcode $500k, $100M, 3.5% yield, or even-split sizing  
- Overwatch panel auto-open on drawdown — separate spec  
- Conviction page changes — terminology only; separate from this doc  

---

## 9. Verification commands

```bash
# Current BFF (merged, partial)
curl -s http://localhost:3000/api/portfolio | jq '{
  data_source,
  ceiling: .ceiling | {final_ceiling_pct, portfolio_notional, idle_cash_yield_pct},
  clusters: (.clusters | length),
  first_cluster_positions: .clusters[0].positions | length,
  pnl_rows: (.pnl_rows | length)
}'

# Risk stub (expect 501 until implemented)
curl -s http://localhost:3000/api/portfolio/risk | jq .

# Upstream VT book
curl -s "$BASE/virtual-trading/long" | jq '{row_count, open: [.records[] | select(.Status=="Open")] | length, keys: .records[0] | keys}'

# After sizer ships
curl -s "$BASE/portfolio/sizer" | jq '.ceiling.final_ceiling_pct, .summary.deployed_usd, (.clusters | length)'
```

---

## 10. Contact / references

| Artifact | Location |
|----------|----------|
| Frontend types | `types/api.ts` → `PortfolioResponse` |
| BFF mapper | `server/utils/portfolio-mappers.ts` |
| BFF loader | `server/utils/mindwealth-data.ts` → `loadPortfolio()` |
| Product layout spec | `mindwealth_portfolio_v4.html` (mock data — layout only) |
| Product brief | `Parth_Portfolio_Spec_v1.docx` |
| OpenAPI | `mindwealth-api-docs-main 4/openapi/mindwealth-v1.json` |

**Questions for backend:** Reply with OpenAPI PR + sample JSON for `/portfolio/sizer` and `/portfolio/risk`; frontend will wire without further contract changes if shapes match §4–5.
