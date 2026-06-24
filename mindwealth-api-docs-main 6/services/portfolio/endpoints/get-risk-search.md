# GET /api/v1/portfolio/risk/search

## Summary

Ticker autocomplete for the "Enter my portfolio" holdings panel. Returns matching symbols from the open VT book, conviction universe, and conviction store — with company names.

## HTTP

- **Method:** `GET`
- **Path:** `/api/v1/portfolio/risk/search`
- **operationId:** `searchPortfolioTickers`
- **Status:** implemented (v1.5.1)
- **Typical status:** 200

`portfolio_service.search_tickers()` — scans VT book + `conviction_universe.txt` + conviction store; names from `portfolio_ticker_names.json`

## Request

### Query parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `q` | string | ✅ | Partial ticker (e.g. `NVD`, `SP`) |
| `limit` | integer | ❌ | Max results (default 20, max 100) |

## Response

200:

```json
[
  { "symbol": "NVDA", "name": "NVIDIA Corporation", "source": "vt_book" },
  { "symbol": "NVO", "name": "Novo Nordisk A/S", "source": "conviction_store" }
]
```

### Error responses

| Code | When |
|------|------|
| 400 | Empty query string |
| 422 | Missing required `q` parameter |
| 502 | Unexpected failure |

## Example

```bash
curl -s "http://localhost:8606/api/v1/portfolio/risk/search?q=NVD" | jq .
# Prod:
curl -s "http://51.20.53.218:8606/api/v1/portfolio/risk/search?q=SP&limit=10" | jq .
```

## Notes

- Case-insensitive: query is uppercased before matching.
- Results sorted: exact-prefix matches first, then alphabetical.
- `source`: `"vt_book"` | `"conviction_universe"` | `"conviction_store"`.
- `name`: never null — from name cache or ticker symbol fallback.
