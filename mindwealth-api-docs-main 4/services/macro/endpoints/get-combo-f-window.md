# GET /api/v1/macro/combo-f/window

## Summary

Combo F 26-week recovery window tracker — fire date, expiry date, weeks elapsed, MTM, progress bar data, historical averages.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/combo-f/window`
- **operationId:** `get_combo_f_window`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_combo_f_window()` → `runic_output.json` + `runic.db` (combo_fires, forward_returns)

## Response shape

```json
{
  "date": "2026-06-18",
  "active": true,
  "fire_date": "2026-03-30",
  "expiry_date": "2026-09-22",
  "weeks_elapsed": 8,
  "weeks_remaining": 18,
  "total_weeks": 26,
  "progress_pct": 30.8,
  "mtm_pct": 21.8,
  "hit_rate_primary": 0.78,
  "avg_return_6m": 9.5,
  "cancel_condition": "Combo B fires (new full capitulation). Combo D does NOT cancel F.",
  "d_f_tension": "D = reduce new longs, tighten stops. F = hold core longs.",
  "analog_details": [
    {
      "date": "2020-06-08",
      "spx_1m_pct": 6.2,
      "spx_3m_pct": 12.1,
      "spx_6m_pct": 18.3,
      "spx_12m_pct": 36.2
    }
  ]
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/combo-f/window | \
  jq '{elapsed:.weeks_elapsed, remaining:.weeks_remaining, progress:.progress_pct, mtm:.mtm_pct}'
```

## Notes

- `progress_pct` is suitable for a progress bar (0–100).
- `mtm_pct` is mark-to-market from fire_date to now — from the active combo in the nightly payload.
- `expiry_date` is computed as `fire_date + 26 weeks` when `fire_date` is available.
- `avg_return_6m` is the historical average SPX 6m return from Combo F fire dates (from `combo_hit_rate_stats`).
- The 26-week window is derived from historical return profiles — the positive period from 50WMA reclaims historically persists ~5–6 months.
