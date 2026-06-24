# GET /api/v1/macro/regime

## Summary

5-dimension regime classification + Claude narrative + system recommendation.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/regime`
- **operationId:** `get_macro_regime`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_regime()` → reads `runic_output.json`

## Regime dimensions

| Dimension | Possible values |
|---|---|
| `fed_cycle` | `CUTTING_EARLY`, `CUTTING_LATE`, `HIKING`, `PAUSING` |
| `curve_regime` | `STEEPENING`, `INVERTING`, `FLAT`, `NORMAL` |
| `geo_overlay` | `NEUTRAL`, `TRADE_WAR`, `SANCTIONS`, `REGIONAL_WAR`, `PANDEMIC`, `FINANCIAL_CRISIS` |
| `val_regime` | `EXTREME`, `HIGH`, `FAIR`, `CHEAP` |
| `liquidity` | `GLOBAL_EASY`, `GLOBAL_TIGHT`, `NEUTRAL` |

## Response shape

```json
{
  "date": "2026-06-18",
  "regime": {
    "fed_cycle": "CUTTING_EARLY",
    "curve_regime": "STEEPENING",
    "geo_overlay": "REGIONAL_WAR",
    "val_regime": "EXTREME",
    "liquidity": "GLOBAL_EASY"
  },
  "brave_fearful": "TACTICAL_TIGHT_MONEY_STRATEGIC_EASY_MONEY",
  "brave_fearful_display": "TACTICAL TIGHT MONEY / STRATEGIC EASY MONEY",
  "dominant_signal": "C",
  "dominant_reason": "Combo C active (week 11, MEDIUM). 83% 3M hit rate.",
  "narrative": "Tactical tight money with strategic easy money backdrop...",
  "system_recommendation": "Hold core longs (F wk 8). No new longs (D watch).",
  "vix_bypass": false,
  "ssi_layer2_status": "CONFIRMED",
  "ssi_multiplier": 1.0,
  "regime_grid": [{"dimension": "FED_CYCLE", "value": "CUTTING_EARLY"}]
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/regime | jq '{regime:.regime, posture:.brave_fearful_display}'
```

## Notes

- `geo_overlay` is classified weekly on Sunday by Claude Sonnet API.
- `narrative` is generated nightly by Claude Sonnet (200–250 words). Empty string when `use_claude=False`.
- `system_recommendation` is Python-generated (no LLM dependency).
