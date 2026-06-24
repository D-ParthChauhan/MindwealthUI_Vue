# Portfolio API

**Status:** implemented (v1.5.1)

**Router:** `api/routers/portfolio.py`

**Service:** `api/services/portfolio_service.py`

**Sources:**
- `trade_store/US/virtual_trading_long.csv` / `virtual_trading_short.csv` — open positions
- `conviction_store/overlays/virtual_trading_*_conviction.csv` — BQ scores, flags
- `macro_intelligence/output/runic_output.json` — regime, VIX, HY, active combos
- `macro_intelligence/output/portfolio_ticker_names.json` — symbol → company name cache
- `macro_intelligence/output/portfolio_cluster_correlations.json` — rolling cluster ρ matrix
- `ssi.db` (via `macro_service.get_ssi_multiplier`) — SSI multiplier

## Endpoints

| Method | Path | operationId | Doc |
|--------|------|-------------|-----|
| GET | `/portfolio/sizer` | `getPortfolioSizer` | [get-sizer.md](endpoints/get-sizer.md) |
| GET | `/portfolio/risk` | `getPortfolioRisk` | [get-risk.md](endpoints/get-risk.md) — optional `?scenario=` |
| POST | `/portfolio/risk/analyze` | `analyzeUserHoldings` | [post-risk-analyze.md](endpoints/post-risk-analyze.md) |
| GET | `/portfolio/risk/search` | `searchPortfolioTickers` | [get-risk-search.md](endpoints/get-risk-search.md) |

All paths are prefixed with `/api/v1`.

## Data flow

```
VT CSVs ─────────────────────────────────────────┐
Conviction overlays ──────────────────────────────┤
                                                  ▼
runic_output.json ──► portfolio_service.py ──► /portfolio/sizer
ssi.db            ──►                       ──► /portfolio/risk
                                            ──► /portfolio/risk/analyze
                                            ──► /portfolio/risk/search
```

## Sizing rules

| BQ score | Tier | Cluster budget share |
|----------|------|----------------------|
| ≥ +8 | MAX | 100% |
| +5 to +7 | TACTICAL | 75% |
| +2 to +4 | REDUCED | 40% |
| < +2 | BLOCKED | 0% |

**Adjustments:** FD+ +10 pct pts · FD− −15 pct pts · MULTI-SIG ×1.10 cluster rank · Combo C active −20 pct pts on new longs · Yield trap → hard 0

## Portfolio notional

$100,000,000 (configurable via `PORTFOLIO_NOTIONAL` constant in `portfolio_service.py`)

## Cluster definitions (NORMAL scenario)

| Cluster ID | Label | Budget % |
|------------|-------|---------|
| `global_risk_on` | Global risk-on | 18% |
| `semiconductors` | Semiconductors | 10% |
| `financials` | Financials | 12% |
| `commodities` | Commodities | 10% |
| `canada_def` | Canada defensive | 8% |
| `us_tech` | US Tech | 12% |
| `india` | India | 8% |
| `bonds` | Bonds | 5% |
| `other` | Other | 17% |

STRESS scale factor: ×0.80 · LOW_VOL: ×1.05 (Ahil to confirm per-cluster values)
