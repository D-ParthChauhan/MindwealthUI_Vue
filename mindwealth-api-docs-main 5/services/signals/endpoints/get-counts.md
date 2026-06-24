# GET /signals/counts

**operationId:** `get_signal_counts`  
**Added:** v1.3.0  
**Tags:** signals

---

## Purpose

Sidebar navigation badge counts for Outstanding, New, and Shortlist sections. Includes tier breakdown for outstanding signals.

---

## Request

```
GET /api/v1/signals/counts
```

### Query parameters

| Parameter | Type | Default |
|-----------|------|---------|
| `report_date` | string | latest |

---

## Response

```json
{
  "report_date": null,
  "outstanding": {
    "total": 86,
    "long": 79,
    "short": 7,
    "exited": 37,
    "tier_counts": { "tA": 14, "best": 8, "tierc": 27, "exit": 37 }
  },
  "new": {
    "total": 6,
    "long": 5,
    "short": 1,
    "exited": 0,
    "tier_counts": { "tA": 2, "best": 2, "tierc": 2 }
  },
  "shortlist": {
    "total": 64
  }
}
```

---

## Example

```bash
curl -s http://localhost:8506/api/v1/signals/counts | jq '{outstanding: .outstanding.total, new: .new.total}'
```
