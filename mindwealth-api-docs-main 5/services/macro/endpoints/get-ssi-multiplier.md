# GET /macro/ssi/multiplier

**operationId:** `get_ssi_multiplier`

**Status:** Implemented (v1.4.0)

**Summary:** Lightweight endpoint — current SSI multiplier, sizing signals, and long/short entry thresholds. Does not load the full SSI payload. Suitable for real-time position-sizing checks.

---

## Request

```
GET /api/v1/macro/ssi/multiplier
```

No query parameters.

---

## Response — 200 OK

```json
{
  "date": "2026-06-19",
  "ssi_multiplier": 1.2,
  "ssi_level": 0.2691,
  "layer2_status": "CONFIRMED",
  "layer2_confirmed_count": 3,
  "long_size_mult": 1.2,
  "short_size_mult": 1.0,
  "long_active": false,
  "short_active": false,
  "long_entry_threshold": -0.6,
  "short_entry_threshold": 0.85
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date of the latest SSI reading (YYYY-MM-DD) |
| `ssi_multiplier` | float | Current sizing multiplier: `1.2` / `1.0` / `0.8` |
| `ssi_level` | float | Composite SSI score that drives the multiplier |
| `layer2_status` | string | `CONFIRMED` if ≥3/4 inputs agree; `UNCONFIRMED` otherwise |
| `layer2_confirmed_count` | int | Count of confirming inputs (0–4) |
| `long_size_mult` | float | Effective long trade size multiplier from `positioning.json` signals |
| `short_size_mult` | float | Effective short trade size multiplier from `positioning.json` signals |
| `long_active` | bool | Whether the long sizing signal is currently active |
| `short_active` | bool | Whether the short sizing signal is currently active |
| `long_entry_threshold` | float | SSI level threshold below which long sizing activates (default -0.6) |
| `short_entry_threshold` | float | SSI level threshold above which short sizing activates (default 0.85) |

### Multiplier Logic

| `ssi_level` range | Multiplier | Posture |
|-------------------|------------|---------|
| < -0.60 | 1.2 | RISK_ON — size up longs |
| -0.60 to 0.85 | 1.0 | NEUTRAL — normal sizing |
| > 0.85 | 0.8 | RISK_OFF — size down / go to short |

---

## Errors

| Status | Cause |
|--------|-------|
| 404 | `ssi.db` not found or table is empty |

---

## Notes

- `long_size_mult` / `short_size_mult` are sourced from `positioning.json → signals` (written by `run_ssi_daily.py`).
- If `positioning.json` is unavailable, `long_size_mult` / `short_size_mult` fall back to `1.0` and signal flags to `false`.
- For the full input breakdown (votes, signals per indicator), use [`GET /macro/ssi/summary`](get-ssi-summary.md).
- For historical sizing trends, use [`GET /macro/ssi/history`](get-ssi-history.md).
