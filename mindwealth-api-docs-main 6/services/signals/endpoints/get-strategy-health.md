# GET /signals/strategy-health

**operationId:** `get_strategy_health`  
**Added:** v1.2.0 (Supplementary §6)  
**Tags:** signals

---

## Purpose

Return forward-test aggregate stats per strategy/interval, with Gate A2b classification (Supplementary §6). Used by the Strategy Health tab.

---

## Request

```
GET /api/v1/signals/strategy-health
GET /api/v1/signals/strategy-health?report_date=2026-06-22
```

---

## Response

```json
{
  "report_date": "2026-06-22",
  "source_file": "/path/to/2026-06-22_all_signal.csv",
  "strategy_health": [
    {
      "strategy": "TRENDPULSE",
      "interval": "Daily",
      "fwd_wr": 80.18,
      "bt_wr": 88.5,
      "delta_vs_bt": -8.32,
      "trades": 757,
      "gate_a2b": "PASS",
      "status": "healthy"
    }
  ]
}
```

### Gate A2b labels

| `fwd_wr` | `gate_a2b` |
|----------|-----------|
| ≥ 63 | `PASS` |
| 60–62 | `PASS (cusp)` |
| < 60 | `FAIL` |

---

## Example

```bash
curl -s http://localhost:8506/api/v1/signals/strategy-health | jq '.strategy_health[] | {strategy, fwd_wr, gate_a2b}'
```
