# GET /api/v1/portfolio/sizer

## Summary

Returns the full regime-aware portfolio allocation payload: equity deployment ceiling, cluster budgets, per-position sizing with BQ tiers and flags, P&L enrichment, constraint checks, and active combo context.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/portfolio/sizer`
- **operationId:** `getPortfolioSizer`
- **Status:** implemented (v1.5.1)
- **Typical status:** 200

## Maps to

`portfolio_service.get_portfolio_sizer()` — reads VT CSVs + conviction overlays + `runic_output.json` + `ssi.db`

## Request

### Query parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `scenario` | string | `normal` | Sizing scenario: `normal` \| `stress` \| `lowvol` |

## Response

200:

```json
{
  "date": "2026-06-23",
  "as_of": "2026-06-23T13:04:00+00:00",
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
    "spx_trend_meta": {"source": "yfinance", "symbol": "^GSPC", "spx_price": 7407.12, "spx_ma200": 6912.28, "above_ma200": true},
    "hy_credit_mult": 0.9,
    "final_ceiling_pct": 72.0,
    "formula_text": "80% regime max × 1.00 VIX × 1.00 trend × 0.90 HY credit × 1.00 SSI",
    "portfolio_notional": 100000000,
    "idle_cash_yield_pct": 3.5,
    "note": "HY credit at 318bp = mild stress, 10% haircut applied.",
    "steps": [...]
  },
  "summary": {
    "deployed_usd": 72000000,
    "deployed_pct": 72.0,
    "cash_usd": 28000000,
    "cash_pct": 28.0,
    "idle_income_usd": 980000,
    "open_position_count": 24
  },
  "clusters": [
    {
      "id": "global_risk_on",
      "label": "Global risk-on",
      "budget_usd": 18000000,
      "budget_pct": 18.0,
      "deployed_usd": 14040000,
      "deployed_pct": 14.04,
      "max_pct": 18.0,
      "positions": [
        {
          "ticker": "SPY",
          "name": "SPDR S&P 500 ETF Trust",
          "investment_type": "Global risk-on",
          "cluster_id": "global_risk_on",
          "function": "FractalTrack",
          "interval": "Monthly",
          "direction": "Long",
          "entry_date": "2026-06-17",
          "entry_price": 540.0,
          "today_price": 545.0,
          "shares": 12500.0,
          "market_value_usd": 6812500.0,
          "pnl_usd": 62500.0,
          "pnl_pct": 0.93,
          "bq_score": 7.0,
          "size_tier": "TACTICAL 75%",
          "allocation_usd": 6750000,
          "allocation_pct": 6.75,
          "flags": [],
          "blocked": false,
          "blocked_reason": null,
          "win_rate": 92.31
        }
      ]
    }
  ],
  "pnl_rows": [...],
  "constraints": [
    { "level": "ok", "title": "Cluster caps", "body": "All clusters within budget." },
    { "level": "warn", "title": "Combo C active", "body": "New long entries reduced by 20 pct pts this week." }
  ],
  "active_combos": [
    { "id": "C", "label": "COMBO C wk 11", "detail": "BEARISH 83% · new entries −20 pct pts" }
  ],
  "macro_override": {
    "active": true,
    "reasons": ["Valuation extreme: CAPE 42×"]
  },
  "risk": {
    "available": true,
    "message": "Use GET /api/v1/portfolio/risk for full correlation matrix."
  }
}
```

### Error responses

| Code | When |
|------|------|
| 400 | Invalid scenario value |
| 404 | VT CSV or runic output missing |
| 422 | Pydantic query validation error |
| 502 | Upstream computation failure |

## Example

```bash
curl -s http://localhost:8606/api/v1/portfolio/sizer | jq '.ceiling.final_ceiling_pct, .summary.deployed_usd, (.clusters | length)'

# With scenario:
curl -s "http://localhost:8606/api/v1/portfolio/sizer?scenario=stress" | jq .ceiling.final_ceiling_pct

# Prod:
curl -s "http://51.20.53.218:8606/api/v1/portfolio/sizer" | jq .
```

## Notes

- `portfolio_notional` is hardcoded to $100M in `portfolio_service.PORTFOLIO_NOTIONAL`.
- `scenarios_available: true` — NORMAL / STRESS / LOW VOL each return distinct ceilings and cluster budgets.
- STRESS budget scale ×0.80; LOW VOL ×1.05 (Ahil to confirm per-cluster values before frontend wires scenario switcher).
- Combo C active → new long entries sized −20 pct pts (existing positions unaffected if already in book).
- Yield-trap tickers: `blocked: true`, `allocation_usd: 0`.
- `pnl_rows` mirrors `clusters[].positions` flattened — same objects, both present for frontend flexibility.
- `name` field (company name) is `null` until a ticker → name mapping is added.
- **INC-02**: VIX percentile currently uses 1yr window from runic; Ahil to switch to 3yr in sizer.
- **INC-06**: `win_rate` populated from `Backtested Win Rate [%]` column in VT CSV.
