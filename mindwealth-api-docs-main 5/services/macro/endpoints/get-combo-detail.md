# GET /api/v1/macro/combos/{combo_id}

## Summary

Full detail for one named combo (A–G): live status, confirmed legs, hit rate stats, historical analog fire dates with SPX forward returns.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/combos/{combo_id}`
- **operationId:** `get_named_combo_detail`
- **Status:** implemented (v1.3.0)
- **Path param:** `combo_id` — one of `A`, `B`, `C`, `D`, `E`, `F`, `G` (case-insensitive)
- **Typical response:** 200, 400, 404

## Maps to

`api/services/macro_service.get_combo_detail(combo_id)` → `runic_output.json` + `runic.db` (forward_returns, combo_fires)

## Response shape

```json
{
  "combo": "C",
  "name": "Stagflation / Energy Shock",
  "direction": "BEARISH",
  "horizon": "1–6m",
  "legs_required": 3,
  "total_legs": 3,
  "variables": ["WTI", "CPI", "WALCL"],
  "description": "WTI >+10% rolling 28-day AND CPI not hot AND WALCL flat...",
  "status": "ACTIVE",
  "is_active": true,
  "is_watch": false,
  "duration_weeks": 11,
  "duration_bucket": "MEDIUM",
  "confirmed_legs": ["WTI", "CPI", "WALCL"],
  "episode_start": "2026-03-10",
  "hit_rate_stats": {
    "show_hit_rate": true,
    "primary_horizon": "spx_3m",
    "primary_label": "3M",
    "hit_rate_primary": 0.83,
    "avg_return_primary": -22.3,
    "n_obs_primary": 4
  },
  "hit_rate_primary": 0.83,
  "avg_return_primary": -22.3,
  "primary_label": "3M",
  "analog_dates": ["2008-06-16", "2022-06-09"],
  "analog_details": [
    {
      "date": "2008-06-16",
      "status": "RESOLVED",
      "spx_1m_pct": -8.1,
      "spx_3m_pct": -28.6,
      "spx_6m_pct": -41.0,
      "spx_9m_pct": null,
      "spx_12m_pct": null,
      "regime": {"geo_overlay": "NEUTRAL"}
    }
  ]
}
```

## Error

```json
{"detail": "Invalid combo ID: Z"}
```
→ HTTP 400 when combo_id is not A–G.

## Example

```bash
# Get Combo C detail
curl -s http://51.20.53.218:8506/api/v1/macro/combos/C | jq '{status:.status, weeks:.duration_weeks, hit_rate:.hit_rate_primary}'

# Get Combo F detail
curl -s http://51.20.53.218:8506/api/v1/macro/combos/F | jq '{active:.is_active, episode_start:.episode_start}'
```

## Notes

- `analog_details` comes from the `combo_fires` + `forward_returns` SQLite tables. Returns up to 6 most recent fire dates.
- If the DB has no records, falls back to `analog_details` from `runic_output.json`.
- `hit_rate_stats` is from `combo_metadata.combo_hit_rate_stats()` — uses internal config for primary/secondary horizons.
