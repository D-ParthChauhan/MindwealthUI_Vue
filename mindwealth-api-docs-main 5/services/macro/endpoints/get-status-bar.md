# GET /api/v1/macro/status

## Summary

Header status-bar data — dominant signal, brave/fearful posture, active/watch combo IDs, CFTC state, and Combo C cancel progress.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/status`
- **operationId:** `get_macro_status_bar`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_status_bar()` → reads `runic_output.json`

## Response shape

```json
{
  "date": "2026-06-18",
  "dominant_signal": "C",
  "brave_fearful": "TACTICAL_TIGHT_MONEY_STRATEGIC_EASY_MONEY",
  "brave_fearful_display": "TACTICAL TIGHT MONEY / STRATEGIC EASY MONEY",
  "active_combos": ["C", "E", "F"],
  "watch_combos": ["D"],
  "cftc_status": "PENDING_3DAY_LAG",
  "vix_bypass": false,
  "combo_c_cancel_week": 0,
  "combo_c_cancelled": false,
  "pending_cpi_release": false
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/status | jq '{dominant:.dominant_signal, posture:.brave_fearful_display}'
```

## Notes

Intended for the top status strip (the `.rs` bar in the HTML mockup). Returns only the minimal set of fields needed to render the strip without loading the full nightly payload.
