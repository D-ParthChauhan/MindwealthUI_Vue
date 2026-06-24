# POST /api/v1/macro/run-nightly

## Summary

Trigger a full nightly Runic run — data pull, combo detection, JSON write. Synchronous: returns when job completes.

## HTTP

- **Method:** `POST`
- **Path:** `/api/v1/macro/run-nightly`
- **operationId:** `trigger_nightly_run`
- **Status:** implemented (v1.3.0)
- **Typical response:** 200, 502

## Maps to

`api/services/macro_service.trigger_nightly_run()` → `src.macro_intelligence.jobs.nightly_run.run_nightly()`

## Request body

```json
{
  "as_of": "2026-06-18",
  "use_claude": false
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `as_of` | `string \| null` | `null` (today) | Date string `YYYY-MM-DD` to run for |
| `use_claude` | `boolean` | `false` | Include Claude API calls (geo overlay + narrative generation) |

## Response shape (200)

```json
{
  "status": "completed",
  "date": "2026-06-18",
  "dominant_signal": "C",
  "active_combos": ["C", "E", "F"],
  "watch_combos": ["D"],
  "output_path": "/home/ubuntu/uiv2/git/MindWealth_UI/macro_intelligence/output/runic_output.json"
}
```

## Error (502)

```json
{"detail": "Nightly run failed: <error message>"}
```

## Example

```bash
# Quick run (no Claude — data pull + combo detection only, ~30s)
curl -s -X POST http://51.20.53.218:8506/api/v1/macro/run-nightly \
  -H "Content-Type: application/json" \
  -d '{"use_claude": false}' | jq '{status:.status, dominant:.dominant_signal}'

# Full run with Claude narrative (~2–3 min)
curl -s -X POST http://51.20.53.218:8506/api/v1/macro/run-nightly \
  -H "Content-Type: application/json" \
  -d '{"use_claude": true}'
```

## Notes

- **Synchronous** — the HTTP connection stays open until the job finishes. Use with a long curl timeout for full runs.
- `use_claude=false` (default) skips geo overlay classification and narrative generation — suitable for data refresh without LLM cost.
- `use_claude=true` requires a valid `ANTHROPIC_API_KEY` environment variable.
- The job writes to `runic_output.json` atomically (via temp file + rename) — safe to call while the server is live.
- Calling this endpoint re-runs `pull_all_series()`, so it fetches fresh data from Yahoo Finance, FRED, BLS, and CFTC.
