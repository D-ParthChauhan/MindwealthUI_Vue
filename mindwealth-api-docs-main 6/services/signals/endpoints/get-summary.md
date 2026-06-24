# GET /signals/summary

**operationId:** `get_signal_summary`  
**Added:** v1.3.0  
**Tags:** signals

---

## Purpose

Sidebar KPI counts derived from enriched signal records. Provides total, long/short split, exit count, tier breakdown, and function breakdown.

---

## Request

```
GET /api/v1/signals/summary?report=outstanding-signals
```

### Query parameters

| Parameter | Type | Default |
|-----------|------|---------|
| `report` | string | `outstanding-signals` |
| `report_date` | string | latest |

---

## Response

```json
{
  "report": "outstanding-signals",
  "report_date": "2026-06-22",
  "total": 86,
  "long": 79,
  "short": 7,
  "exited": 37,
  "tier_counts": {
    "tA": 14,
    "best": 8,
    "tierc": 27,
    "exit": 37
  },
  "function_counts": {
    "TRENDPULSE": 41,
    "FRACTAL TRACK": 19,
    "DELTADRIFT": 11,
    "BASELINEDIVERGENCE": 7,
    "OSCILLATOR DELTA": 5,
    "SIGMASHELL": 3
  }
}
```

---

## Example

```bash
curl -s http://localhost:8506/api/v1/signals/summary | jq '{total, long, short, tier_counts}'
```
