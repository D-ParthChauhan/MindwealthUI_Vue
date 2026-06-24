# GET /api/v1/portfolio/risk

## Summary

Returns the cluster-level correlation matrix, breach list (ρ > 0.75 watch / ρ > 0.85 action), and cluster weight bars (deployed % vs max %) for the Portfolio Risk sub-view.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/portfolio/risk`
- **operationId:** `getPortfolioRisk`
- **Status:** implemented (v1.5.1)
- **Typical status:** 200

## Maps to

`portfolio_service.get_portfolio_risk()` — rolling cluster correlations (ETF proxies) + live cluster weights from sizer

## Request

### Query parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `scenario` | string | `normal` | Sizer scenario for cluster weights: `normal` \| `stress` \| `lowvol` |

## Response

200:

```json
{
  "date": "2026-06-23",
  "scenario": "normal",
  "labels": ["global_risk_on", "semiconductors", "financials", "commodities", "canada_def", "us_tech", "india", "bonds"],
  "matrix": [
    [1.0, 0.75, 0.59, 0.29, 0.70, 0.94, 0.53, 0.19],
    [0.75, 1.0, 0.19, 0.31, 0.48, 0.86, 0.37, 0.11],
    ...
  ],
  "correlation_meta": {
    "source": "cache",
    "as_of": "2026-06-23T...",
    "proxies": {"global_risk_on": "SPY", "semiconductors": "SOXX", ...},
    "window_days": 251
  },
  "breaches": [
    {
      "pair": ["global_risk_on", "semiconductors"],
      "pair_labels": ["Global risk-on", "Semiconductors"],
      "rho": 0.87,
      "level": "action",
      "combined_weight_pct": 30.0,
      "combined_weight_usd": 30000000,
      "cap_pct": 20.0,
      "recommendation": "Reduce Semiconductors by ~$10,000,000 or trim Global risk-on."
    }
  ],
  "breach_threshold_watch": 0.75,
  "breach_threshold_action": 0.85,
  "cluster_weights": [
    { "cluster_id": "global_risk_on", "label": "Global risk-on", "deployed_pct": 14.04, "max_pct": 18.0 },
    ...
  ]
}
```

### Error responses

| Code | When |
|------|------|
| 502 | Risk computation failure |

## Example

```bash
curl -s http://localhost:8606/api/v1/portfolio/risk | jq '{breaches: (.breaches | length), matrix_size: (.labels | length)}'
# Prod:
curl -s http://51.20.53.218:8606/api/v1/portfolio/risk | jq .breaches
```

## Notes

- Matrix is 8×8 (investment types, excludes `other` cluster). Diagonal is always 1.00.
- `level: "watch"` = ρ > 0.75; `level: "action"` = ρ > 0.85.
- `recommendation` is non-null only when `combined_weight_pct` exceeds `cap_pct` (20%).
- Correlation values computed from 1y daily returns of cluster ETF proxies (SPY, SOXX, XLF, GLD, EWC, QQQ, INDA, TLT). Cached 7 days in `portfolio_cluster_correlations.json`.
- `cluster_weights` sourced live from `getPortfolioSizer(scenario=...)`.
