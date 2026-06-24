# GET /macro/ssi/summary

**operationId:** `get_ssi_summary`

**Status:** Implemented (v1.4.0)

**Summary:** Latest SSI snapshot — level, percentile, multiplier, layer2 status + per-input vote breakdown.

---

## Request

```
GET /api/v1/macro/ssi/summary
```

No query parameters.

---

## Response — 200 OK

```json
{
  "date": "2026-06-19",
  "ssi_level": 0.2691,
  "ssi_percentile_5y": 21.7,
  "ssi_multiplier": 1.2,
  "layer2_status": "CONFIRMED",
  "layer2_confirmed_count": 3,
  "layer2_required": 3,
  "posture": "NEUTRAL",
  "long_signal_active": false,
  "short_signal_active": false,
  "inputs": {
    "hyg_lqd": {
      "raw": 0.733,
      "vote": true,
      "signal": "risk_on",
      "pctile": 99.0
    },
    "dbmf_beta": {
      "raw": 0.263,
      "vote": true,
      "signal": "low_beta",
      "pctile": null
    },
    "cnn_fg": {
      "raw": 37.3,
      "vote": true,
      "signal": "fear",
      "pctile": 44.0
    },
    "vix_ratio": {
      "raw": 1.16,
      "vote": false,
      "signal": "risk_off",
      "pctile": 71.2
    }
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date of the latest SSI reading (YYYY-MM-DD) |
| `ssi_level` | float | Composite sentiment score. Range ~[-1, +1]. Negative = risk-on, positive = risk-off |
| `ssi_percentile_5y` | float | Percentile rank vs. 5-year rolling window (0–100) |
| `ssi_multiplier` | float | Position sizing multiplier: `1.2` (risk-on) / `1.0` (neutral) / `0.8` (risk-off) |
| `layer2_status` | string | `CONFIRMED` if ≥3 of 4 inputs agree; `UNCONFIRMED` otherwise |
| `layer2_confirmed_count` | int | Count of inputs that voted for the current posture |
| `layer2_required` | int | Threshold required for CONFIRMED (always 3) |
| `posture` | string | `RISK_ON` (level < -0.6) / `RISK_OFF` (level > 0.85) / `NEUTRAL` |
| `long_signal_active` | bool | True when posture is RISK_ON |
| `short_signal_active` | bool | True when posture is RISK_OFF |
| `inputs.*.raw` | float | Raw value of the input indicator |
| `inputs.*.vote` | bool/null | Whether this input voted for the current posture direction |
| `inputs.*.signal` | string/null | Qualitative signal label from the input |
| `inputs.*.pctile` | float/null | Percentile of the raw input vs. history |

### SSI Inputs

| Key | Indicator | What it measures |
|-----|-----------|------------------|
| `hyg_lqd` | HYG/LQD ratio | Credit risk appetite (high ratio = risk-on) |
| `dbmf_beta` | DBMF beta | Managed-futures positioning beta |
| `cnn_fg` | CNN Fear & Greed | Retail sentiment (low = fear = risk-on) |
| `vix_ratio` | VIX spot / VIX 3M | Short-term vs. medium-term volatility (>1 = backwardation = risk-off) |

---

## Errors

| Status | Cause |
|--------|-------|
| 404 | `ssi.db` not found or table is empty |

---

## Notes

- Data is sourced from `ssi.db → ssi_daily` table, populated daily by `scripts/run_ssi_daily.py` (08:00 UTC).
- `posture` thresholds: `RISK_ON` when `ssi_level < -0.6`; `RISK_OFF` when `ssi_level > 0.85`; `NEUTRAL` otherwise.
- For position-sizing only (without input breakdown), use the lighter [`GET /macro/ssi/multiplier`](get-ssi-multiplier.md).
- For historical series, use [`GET /macro/ssi/history`](get-ssi-history.md).
