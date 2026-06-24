# GET /api/v1/macro/analogs/{combo_id}

## Summary

Historical analog fire dates for a named combo with realized SPX forward returns at 1m, 3m, 6m, 9m, 12m horizons and summary statistics.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/analogs/{combo_id}`
- **operationId:** `get_combo_analog_table`
- **Status:** implemented (v1.3.0)
- **Path param:** `combo_id` — one of `A`–`G` (case-insensitive)
- **Typical response:** 200, 400, 404

## Maps to

`api/services/macro_service.get_analog_table(combo_id)` → `runic.db` (combo_fires, forward_returns)

## Response shape

```json
{
  "combo": "C",
  "name": "Stagflation / Energy Shock",
  "direction": "BEARISH",
  "analog_details": [
    {
      "date": "2008-06-16",
      "status": "RESOLVED",
      "combo": "C",
      "spx_1m_pct": -8.1,
      "spx_3m_pct": -28.6,
      "spx_6m_pct": -41.0,
      "spx_9m_pct": null,
      "spx_12m_pct": null,
      "regime": {"geo_overlay": "NEUTRAL"}
    },
    {
      "date": "2022-06-09",
      "status": "RESOLVED",
      "combo": "C",
      "spx_1m_pct": -8.4,
      "spx_3m_pct": -16.0,
      "spx_6m_pct": -12.0,
      "spx_9m_pct": null,
      "spx_12m_pct": null,
      "regime": {}
    }
  ],
  "instance_count": 2,
  "hit_rate_stats": {
    "show_hit_rate": true,
    "primary_horizon": "spx_3m",
    "primary_label": "3M",
    "hit_rate_primary": 0.83,
    "avg_return_primary": -22.3,
    "n_obs_primary": 4
  },
  "summary_returns": {
    "median_1m": -8.25,
    "median_3m": -22.3,
    "median_6m": -26.5,
    "median_12m": null
  }
}
```

## Example

```bash
# Combo C analogs
curl -s http://51.20.53.218:8506/api/v1/macro/analogs/C | jq '.summary_returns'

# Combo F analogs
curl -s http://51.20.53.218:8506/api/v1/macro/analogs/F | jq '.analog_details[0]'
```

## Notes

- Returns up to 10 most recent fire dates from the DB, ordered by date descending.
- `summary_returns` contains simple median across available return values per horizon.
- `spx_9m_pct` and `spx_12m_pct` may be `null` for fires within the last 9–12 months (forward window not yet elapsed).
- The HTML mockup's "Analog Tables" tab renders `combo_details` as research-style return tables.
- `regime` object (from `macro_regime_json` in DB) includes `geo_overlay` for regime-conditioned analysis.
