# POST /api/v1/portfolio/risk/analyze

## Summary

Accepts a user's personal holdings list and returns concentration warnings, correlation breaches, and suggested trims vs the model book.

## HTTP

- **Method:** `POST`
- **Path:** `/api/v1/portfolio/risk/analyze`
- **operationId:** `analyzeUserHoldings`
- **Status:** implemented (v1.5.0)
- **Typical status:** 200

## Maps to

`portfolio_service.analyze_user_holdings()` — live price lookup (VT book → yfinance fallback) + cluster assignment + concentration vs model

## Request

### Body

```json
{
  "holdings": [
    { "symbol": "SPY", "quantity": 120 },
    { "symbol": "NVDA", "quantity": 50 }
  ],
  "cash_usd": 38293
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `holdings` | array | ✅ | List of symbol + quantity pairs |
| `holdings[].symbol` | string | ✅ | Uppercase ticker |
| `holdings[].quantity` | float | ✅ | Number of shares / units held |
| `cash_usd` | float | ❌ | Cash balance to include in notional (default 0) |

## Response

200:

```json
{
  "total_notional_usd": 108293.0,
  "cash_usd": 38293.0,
  "position_count": 2,
  "positions": [
    {
      "symbol": "SPY",
      "quantity": 120,
      "live_price": 545.0,
      "notional_usd": 65400.0,
      "cluster_id": "global_risk_on",
      "cluster_label": "Global risk-on"
    }
  ],
  "cluster_weights": [
    { "cluster_id": "global_risk_on", "pct": 60.4 },
    { "cluster_id": "semiconductors", "pct": 36.0 }
  ],
  "concentration_warnings": [
    {
      "cluster_id": "global_risk_on",
      "label": "Global risk-on",
      "user_pct": 60.4,
      "model_max_pct": 18.0,
      "action": "Overweight Global risk-on at 60.4% vs model max 18%. Consider trimming."
    }
  ],
  "correlation_breaches": [
    {
      "pair": ["global_risk_on", "semiconductors"],
      "pair_labels": ["Global risk-on", "Semiconductors"],
      "rho": 0.87,
      "user_combined_pct": 96.4,
      "recommendation": "High correlation (0.87) between Global risk-on and Semiconductors. Diversify."
    }
  ]
}
```

### Error responses

| Code | When |
|------|------|
| 400 | Empty holdings list, or all prices unavailable → zero notional |
| 422 | Missing required fields |
| 502 | Unexpected computation failure |

## Example

```bash
curl -s -X POST http://localhost:8606/api/v1/portfolio/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{"holdings":[{"symbol":"SPY","quantity":100},{"symbol":"NVDA","quantity":50}],"cash_usd":5000}' \
  | jq '{total_notional_usd, concentration_warnings: (.concentration_warnings | length)}'
```

## Notes

- Live prices: first checks open VT positions (`Today price` column), then falls back to `yfinance.Ticker.fast_info.last_price`.
- Concentration warning threshold: user cluster weight > 1.5× model max budget %.
- Correlation breach shown only when both clusters in the pair have non-zero user weight.
- `cluster_id` assignment uses `_TICKER_CLUSTER_MAP` + suffix rules (`.TO`→ Canada, `.NS`→ India, etc.). Extend the map in `portfolio_service.py` as needed.
