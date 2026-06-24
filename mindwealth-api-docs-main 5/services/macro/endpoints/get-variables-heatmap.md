# GET /api/v1/macro/variables/heatmap

## Summary

Enriched 12-variable heatmap — tiers, current values, source metadata, RARE/EXTREME thresholds, and combo links.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/variables/heatmap`
- **operationId:** `get_variables_heatmap`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_variables_heatmap()` → reads `runic_output.json` + static metadata

## Variable order

`NFCI → HY → WALCL → CNH → WTI → VIX → VXTS → CFTC → CURVE → CPI → GSR → CAPE`

## Tier values

| Tier | Meaning |
|---|---|
| `NORMAL` | Within expected range |
| `RARE` | At 85th+ or 15th- percentile |
| `EXTREME` | At 95th+ or 5th- percentile (pulsing in UI) |
| `PENDING` | Data not yet available (dashed border in UI) |
| `WATCH` | Special condition (e.g. WTI in cancel zone) |

## Response shape

```json
{
  "date": "2026-06-18",
  "variables": [
    {
      "num": 7,
      "variable": "VXTS",
      "current": 1.25,
      "tier": "EXTREME",
      "pctile_3yr": null,
      "direction": null,
      "source": "Yahoo: ^VIX3M ÷ ^VIX",
      "compute": "Ratio daily, no pctile needed",
      "rare_gate": "<0.95 (backw.) or >1.10 (contango)",
      "extreme_gate": "<0.85 or >1.20",
      "combos": ["D", "G"]
    },
    {
      "num": 12,
      "variable": "CAPE",
      "current": 42.04,
      "tier": "EXTREME",
      "pctile_3yr": 99.0,
      "source": "multpl.com scrape / FRED CAPE",
      "compute": "Absolute level, monthly",
      "rare_gate": ">28× or <16×",
      "extreme_gate": ">32× or <12×",
      "combos": ["E"]
    }
  ],
  "pending_variables": ["CFTC", "GSR"]
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/variables/heatmap | \
  jq '.variables[] | select(.tier == "EXTREME") | {var:.variable, val:.current}'
```

## Notes

- `pending_variables` is the list of variable IDs with `PENDING` or null tier — useful for rendering dashed borders.
- `rare_gate` and `extreme_gate` are human-readable strings from the static metadata map, not parsed numbers.
- `pctile_3yr` may be `null` for ratio-computed variables (VXTS) and pending ones (CFTC, GSR).
