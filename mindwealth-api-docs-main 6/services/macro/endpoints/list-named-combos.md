# GET /api/v1/macro/combos

## Summary

All 7 named combos A–G with current status, leg counts, hit rates, and duration.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/combos`
- **operationId:** `list_named_combos`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_all_combos()` → `runic_output.json` + static combo metadata

## Combo status values

| status | Meaning |
|---|---|
| `ACTIVE` | All required legs confirmed, generating signal |
| `CONFIRMED` | 2-of-3 confirmed (Combo E specific) |
| `WATCH` | 1 or 2 legs met, not yet firing |
| `INACTIVE` | No legs currently firing |
| `RESOLVED` | Previously active, now complete |

## Response shape

```json
{
  "date": "2026-06-18",
  "active_count": 3,
  "watch_count": 1,
  "combos": [
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
      "hit_rate_primary": 0.83,
      "avg_return_primary": -22.0,
      "combo_status_row": {"combo": "C", "status": "ACTIVE", "duration": "wk 11 MEDIUM"}
    }
  ]
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/combos | \
  jq '.combos[] | select(.is_active) | {combo:.combo, name:.name, wks:.duration_weeks}'
```

## Notes

- Combos are always returned in order A, B, C, D, E, F, G.
- `combo_status_row` is the same row object used in the nightly briefing table — may be `null` if not in the current briefing payload.
- `hit_rate_primary` and `avg_return_primary` are derived from historical backfill data; may be `null` for combos with insufficient history.
