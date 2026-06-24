# GET /macro/ssi/history

**operationId:** `get_ssi_history`

**Status:** Implemented (v1.4.0)

**Summary:** Daily SSI time series — level, percentile, multiplier, layer2 status, and raw inputs. Up to 90 days, returned in chronological order for charting.

---

## Request

```
GET /api/v1/macro/ssi/history?days=30
```

### Query Parameters

| Name | Type | Default | Max | Description |
|------|------|---------|-----|-------------|
| `days` | int | 30 | 90 | Number of calendar days to return. Values >90 are clamped to 90. |

---

## Response — 200 OK

```json
{
  "days_requested": 30,
  "days_available": 13,
  "latest_date": "2026-06-19",
  "latest_level": 0.2691,
  "latest_multiplier": 1.2,
  "series": [
    {
      "date": "2026-06-05",
      "ssi_level": 0.31,
      "ssi_percentile_5y": 26.4,
      "ssi_multiplier": 1.0,
      "layer2_status": "UNCONFIRMED",
      "layer2_confirmed_count": 2,
      "inputs": {
        "hyg_lqd": 0.729,
        "dbmf_beta": 0.241,
        "cnn_fg": 28.1,
        "vix_ratio": 1.21
      }
    },
    {
      "date": "2026-06-19",
      "ssi_level": 0.2691,
      "ssi_percentile_5y": 21.7,
      "ssi_multiplier": 1.2,
      "layer2_status": "CONFIRMED",
      "layer2_confirmed_count": 3,
      "inputs": {
        "hyg_lqd": 0.733,
        "dbmf_beta": 0.263,
        "cnn_fg": 37.3,
        "vix_ratio": 1.16
      }
    }
  ]
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `days_requested` | int | Value of the `days` query parameter (after clamping) |
| `days_available` | int | Actual rows returned (≤ `days_requested`) |
| `latest_date` | string | Date of the most recent row |
| `latest_level` | float | SSI level on the most recent date |
| `latest_multiplier` | float | Multiplier on the most recent date |
| `series` | array | Daily rows in chronological order (oldest first) |
| `series[].date` | string | YYYY-MM-DD |
| `series[].ssi_level` | float | Composite sentiment score |
| `series[].ssi_percentile_5y` | float | 5-year percentile rank |
| `series[].ssi_multiplier` | float | Position sizing multiplier |
| `series[].layer2_status` | string | CONFIRMED / UNCONFIRMED |
| `series[].layer2_confirmed_count` | int | Count of inputs confirming current posture |
| `series[].inputs.*` | float | Raw values for the 4 input indicators |

---

## Errors

| Status | Cause |
|--------|-------|
| 404 | `ssi.db` not found or table is empty |

---

## Notes

- Series is returned in **chronological order** (oldest → newest) for direct use in time-series charts.
- `days_available` may be less than `days_requested` if the database has fewer rows (e.g. system just started).
- `inputs` in the history series contains only raw float values; for vote/signal breakdown use [`GET /macro/ssi/summary`](get-ssi-summary.md).
- The `days` parameter is clamped server-side: values < 1 become 1, values > 90 become 90.
