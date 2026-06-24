# GET /api/v1/macro/combo-c/cancel

## Summary

Combo C cancel condition monitor — 0/4 Friday progress, WTI + CPI leg status, Monte Carlo probability model, upcoming CPI/PPI releases.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/macro/combo-c/cancel`
- **operationId:** `get_combo_c_cancel_tracker`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 404

## Maps to

`api/services/macro_service.get_combo_c_cancel_tracker()` → `runic_output.json` + `runic.db` (combo_c_cancel, pending_releases)

## Cancel logic

Combo C cancels when **4 consecutive Friday assessments** both pass:
1. **WTI leg:** WTI 4-week Δ < +5% at Friday NYMEX close
2. **CPI leg:** Most recent CPI print shows actual ≤ consensus ("not hot")

Counter resets to 0 on any Friday failure.

## Response shape

```json
{
  "date": "2026-06-18",
  "combo_c_active": true,
  "cancel_status": {
    "fridays_complete": 0,
    "fridays_required": 4,
    "cancelled": false,
    "cancel_date": null,
    "last_check_date": "2026-05-30"
  },
  "current_wti": {
    "value": -17.2,
    "tier": "WATCH",
    "cancel_gate_pct": 5.0,
    "leg_passes": true
  },
  "current_cpi": {
    "tier": "NORMAL",
    "latest_print": {
      "release_date": "2026-06-11",
      "actual": 0.2,
      "consensus": 0.3,
      "surprise_pp": -0.1,
      "not_hot": true
    },
    "not_hot": true,
    "leg_passes": true
  },
  "probability_model": {
    "model_cancel_prob": 0.18,
    "model_wti_leg_prob": 0.62,
    "model_cpi_leg_prob": 0.52
  },
  "friday_log": [],
  "upcoming_releases": [
    {"release_date": "2026-07-10", "release_type": "CPI", "consensus": 0.3}
  ],
  "ppi_cooling": true,
  "if_cancelled": {
    "f_becomes_dominant": true,
    "e_warning_persists": true,
    "note": "If C cancels → F becomes dominant (wk 8/26). D+F tension remains."
  }
}
```

## Example

```bash
curl -s http://51.20.53.218:8506/api/v1/macro/combo-c/cancel | \
  jq '{fridays:.cancel_status.fridays_complete, prob:.probability_model.model_cancel_prob}'
```

## Notes

- `cancel_gate_pct` is always `5.0` — buffer above zero, not empirically derived.
- `friday_log` comes from the `combo_c_cancel_log` table; returns last 8 rows.
- `probability_model` values are from the Monte Carlo cancel probability engine (`combo_cancel_probability.py`).
- The `+5%` gate is a judgment call (not backtest-derived). The `model_wti_leg_prob` estimates the probability that WTI stays below this gate for 4 consecutive Fridays.
