# GET /api/v1/macro/data/freshness

## Summary

Per-variable data source freshness — last data date, lag vs report, expected next source dates, CFTC status.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/data/freshness`
- **operationId:** `get_data_freshness`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_source_freshness()` → reads `runic_output.json`

## Response shape

```json
{
  "date": "2026-06-18",
  "source_freshness": {"last_audit": "2026-06-18"},
  "cftc_status": "PENDING_3DAY_LAG",
  "pending_cpi_release": false,
  "variables_dashboard": [
    {
      "variable": "NFCI",
      "source_date": "2026-06-13",
      "lag_days": 5,
      "expected_source_date": "2026-06-20",
      "source_note": null,
      "tier": "RARE"
    },
    {
      "variable": "CFTC",
      "source_date": "2026-06-10",
      "lag_days": 3,
      "expected_source_date": "2026-06-17",
      "source_note": "CFTC.gov TFF · Lev Money net · data as of 2026-06-10, 3d lag vs report, expected Tue 2026-06-17",
      "tier": "PENDING"
    }
  ]
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/data/freshness | \
  jq '.variables_dashboard[] | select(.lag_days != null) | {var:.variable, lag:.lag_days}'
```

## Notes

- `cftc_status` values: `PENDING_CFTC_CONFIRM`, `PENDING_3DAY_LAG`, `CONFIRMED`, `STALE`.
- `pending_cpi_release` is `true` when a CPI release is scheduled this week but actual is not yet in DB.
- `lag_days` is the data lag vs when the report is published (e.g. CFTC reports Tuesday positions but publishes Friday = 3-day lag).
