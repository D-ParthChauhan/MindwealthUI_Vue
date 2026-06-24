# GET /api/v1/signals/reports/{report_name}/latest

## Summary

Latest dated CSV for a report slug as JSON records. Optional enrichment injects surface / quality fields (`composite_score`, `window_remaining_pct`, `tier`, etc.).

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/signals/reports/{report_name}/latest`
- **operationId:** `get_latest_signal_report`
- **Status:** implemented (v1.7.1)
- **Typical status:** 200, 404

## Maps to

`reports_service.load_report_records(report_name, enrich=...)`

## Request

Path: `report_name` — slug or base filename (e.g. `new-signals`, `all-signal`, `sigma`)

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enrich` | boolean | `true` for most slugs; **`false` for `all-signal`** | Inject supplementary surface fields into each `records[]` row |
| `limit` | integer | none | Max records returned (applied after enrichment). Min 1. |

### `enrich` defaults by slug

| Slug | Default `enrich` | Notes |
|------|------------------|-------|
| `outstanding-signals`, `new-signals` | `true` | MasterSpec columns present in CSV |
| `all-signal` | `false` | Large dataset (~400+ rows). Pass `?enrich=true` for `composite_score` — API computes from raw backtest fields when CSV columns missing |

## Response

200:

```json
{
  "report_name": "outstanding-signals",
  "source_file": "/path/to/file.csv",
  "report_date": "2026-06-22",
  "format": "csv",
  "row_count": 86,
  "returned_count": 5,
  "records": [
    {
      "symbol": "XLE",
      "composite_score": 61.6,
      "window_remaining_pct": 100.0,
      "tier": "tA",
      "er_annualized": 37.8
    }
  ]
}
```

`returned_count` is present when `?limit=N` is used.

Claude shortlist with empty CSV returns `format: "markdown"` and `content` instead of records.

## Examples

```bash
# Outstanding (enriched by default)
curl -s http://localhost:8506/api/v1/signals/reports/outstanding-signals/latest \
  | jq '.records[0] | {symbol, composite_score, tier}'

# All-signal — must opt in to enrichment for composite_score
curl -s "http://localhost:8506/api/v1/signals/reports/all-signal/latest?enrich=true&limit=10" \
  | jq '[.records[] | {symbol, composite_score, tier}]'
```

## Notes

See [Signals overview](../README.md) for slug table.
