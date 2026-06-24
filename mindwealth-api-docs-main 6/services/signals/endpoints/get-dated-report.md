# GET /api/v1/signals/reports/{report_name}/{report_date}

## Summary

Specific dated trade-store report as JSON records. Supports the same `enrich` and `limit` query params as the latest endpoint.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/signals/reports/{report_name}/{report_date}`
- **operationId:** `get_dated_signal_report`
- **Status:** implemented (v1.7.1)
- **Typical status:** 200, 404

## Maps to

`reports_service.load_report_records(report_name, report_date=report_date, enrich=...)`

## Request

| Param | Location | Format |
|-------|----------|--------|
| `report_name` | path | slug or base filename |
| `report_date` | path | `YYYY-MM-DD` |
| `enrich` | query | boolean — defaults `false` for `all-signal`, `true` otherwise |
| `limit` | query | integer ≥ 1 — cap `records[]` length |

## Response

Same shape as [get-latest-report.md](get-latest-report.md).

## Example

```bash
curl -s "http://localhost:8506/api/v1/signals/reports/all-signal/2026-06-22?enrich=true&limit=5" \
  | jq '[.records[] | {symbol, composite_score}]'
```
