# GET /api/v1/macro/overview/kpis

## Summary

Five KPI cards for the Overview tab: dominant signal, Combo C duration, Combo F window, CAPE/Combo E status, WTI 4-week delta.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/overview/kpis`
- **operationId:** `get_macro_overview_kpis`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_overview_kpis()` → reads `runic_output.json`

## Response shape

```json
{
  "date": "2026-06-18",
  "dominant_signal": {
    "combo": "C",
    "brave_fearful_display": "TACTICAL TIGHT MONEY / STRATEGIC EASY MONEY",
    "hit_rate": 0.83,
    "avg_return": -22.0
  },
  "combo_c_duration": {
    "combo": "C",
    "duration_weeks": 11,
    "duration_bucket": "MEDIUM",
    "active": true
  },
  "combo_f_window": {
    "combo": "F",
    "weeks_elapsed": 8,
    "active": true,
    "mtm_pct": 21.8
  },
  "cape": {
    "variable": "CAPE",
    "current": 42.04,
    "tier": "EXTREME",
    "combo_e_status": "CONFIRMED"
  },
  "wti_4wk": {
    "variable": "WTI",
    "current": -17.2,
    "tier": "WATCH",
    "cancel_week": 0
  }
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/overview/kpis | jq '.cape.current'
```

## Notes

Directly maps to the 5 `.kc` cards in the OVERVIEW panel. Each card object is self-contained with the minimal fields needed to render it.
