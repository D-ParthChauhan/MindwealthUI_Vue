# GET /signals/surface

**operationId:** `get_signal_surface`  
**Added:** v1.3.0  
**Tags:** signals

---

## Purpose

Return enriched per-signal surface fields required by the Signals page bubble chart and ranked cards. All values are Python-computed from CSV columns — no mock data.

---

## Request

```
GET /api/v1/signals/surface?report=outstanding-signals
```

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `report` | string | `outstanding-signals` | Signal list to enrich: `outstanding-signals` · `new-signals` · `all-signal` |
| `report_date` | string | latest | YYYY-MM-DD; omit for latest file |

---

## Response

```json
{
  "report": "outstanding-signals",
  "report_date": "2026-06-22",
  "source_file": "/path/to/2026-06-22_outstanding_signal.csv",
  "row_count": 86,
  "records": [
    {
      "symbol": "XLE",
      "function": "DELTADRIFT",
      "interval": "Daily",
      "direction": "Long",
      "asset_class": "equity",
      "composite_score": 61.62,
      "window_remaining_pct": 100.0,
      "tier": "tA",
      "exit_fired": false,
      "er": 3.0,
      "er_annualized": 37.8,
      "signal_alpha": 2.2063,
      "signal_alpha_annualized": 27.85,
      "mtm_pct": 0.0,
      "days_elapsed": 0,
      "avg_hold_days": 20,
      "timeliness_score": 100,
      "rr_static": 5.59,
      "fwd_wr": 75.96,
      "cagr_diff": 3.97,
      "alpha_interpretation": null,
      "conviction_score": null,
      "conviction_bq_score": null,
      "conviction_fs_class": null
    }
  ]
}
```

### Enriched fields

| Field | Type | Source |
|-------|------|--------|
| `composite_score` | float | CSV `Signal Quality Composite Score`, or computed via `enrich_signal_dict()` when missing (e.g. `all-signal` CSV) |
| `window_remaining_pct` | float | `(avg_hold_days − days_elapsed) / avg_hold_days × 100` |
| `tier` | string | `tA` · `best` · `tierc` · `exit` (Python gate logic) |
| `exit_fired` | bool | `Exit Signal Date/Price[$]` non-empty |
| `er` | float | CSV `Expected Return E[R] [%]` |
| `er_annualized` | float | `er × 252 / avg_hold_days` |
| `signal_alpha` | float | CSV `Signal Alpha Per Trade [%]` |
| `signal_alpha_annualized` | float | `signal_alpha × 252 / avg_hold_days` |
| `mtm_pct` | float | Parsed from `Current Mark to Market and Holding Period` |
| `days_elapsed` | int | `Trading Days between Signal and Today Date` |
| `avg_hold_days` | int | `Backtested Holding Period (All Trades)` avg segment |
| `alpha_interpretation` | object\|null | `{ type, label, detail }` from cagr_diff thresholds |
| `conviction_score` | float\|null | Conviction overlay (latest daily) |
| `conviction_bq_score` | float\|null | Business Quality raw score (equity only) |
| `conviction_fs_class` | string\|null | Fundamental Strength class |

---

## Errors

| Code | When |
|------|------|
| 404 | Report slug unknown or no file found |

---

## Example

```bash
curl -s http://localhost:8506/api/v1/signals/surface?report=outstanding-signals | jq '.records[0] | {symbol,tier,composite_score,window_remaining_pct}'
```
