# API Changelog

## v1.3.0 (2026-06-18)

### Added — Macro Intelligence full frontend coverage

13 new endpoints for the Runic Macro Intelligence frontend view (`MindWealth_Macro_Runic_Latest.html`):

| Endpoint | operationId | Purpose |
|---|---|---|
| `GET /macro/status` | `get_macro_status_bar` | Header status strip (dominant signal, brave/fearful, CFTC) |
| `GET /macro/overview/kpis` | `get_macro_overview_kpis` | 5 KPI cards (dominant, C duration, F window, CAPE, WTI) |
| `GET /macro/regime` | `get_macro_regime` | 5-dimension regime + narrative + system recommendation |
| `GET /macro/variables/heatmap` | `get_variables_heatmap` | 12-variable heatmap with tiers, thresholds, combo links |
| `GET /macro/combos` | `list_named_combos` | All 7 named combos A–G with status and hit rates |
| `GET /macro/combos/{combo_id}` | `get_named_combo_detail` | Single combo full detail + analog returns |
| `GET /macro/combo-c/cancel` | `get_combo_c_cancel_tracker` | Cancel monitor: 0/4 Fridays, WTI/CPI legs, Monte Carlo prob |
| `GET /macro/combo-f/window` | `get_combo_f_window` | 26-week window tracker: fire date, MTM, progress bar |
| `GET /macro/analogs/{combo_id}` | `get_combo_analog_table` | Historical fire dates + SPX returns (1m/3m/6m/9m/12m) |
| `GET /macro/narrative` | `get_nightly_narrative` | Nightly brief: narrative + system rec + regime snapshot |
| `GET /macro/persistence` | `get_persistence_signals` | Persistence signals + generic combo watch list |
| `GET /macro/data/freshness` | `get_data_freshness` | Per-variable source freshness audit |
| `POST /macro/run-nightly` | `trigger_nightly_run` | Trigger nightly run (use_claude=false by default) |

### Added — `api/services/macro_service.py`

New dedicated macro service layer with:
- `get_status_bar()`, `get_overview_kpis()`, `get_regime()`, `get_variables_heatmap()`
- `get_all_combos()`, `get_combo_detail(combo_id)`, `get_combo_c_cancel_tracker()`, `get_combo_f_window()`
- `get_analog_table(combo_id)`, `get_narrative()`, `get_persistence_signals()`, `get_source_freshness()`
- `trigger_nightly_run(as_of, use_claude)`
- Static metadata maps for 7 named combos and 12 variables (thresholds, combo links, sources)
- DB helpers: `_db_combo_c_cancel()`, `_db_friday_cancel_log()`, `_db_analog_details()`, `_db_latest_cpi_print()`, `_db_upcoming_releases()`

### Added — Tests

- `tests/test_api_macro.py`: 22 unit/integration tests covering all new endpoints (22/22 pass)
- Live curl suite: 22/23 pass (run-nightly excluded from automated suite due to sync data pull duration)

### Documentation

- `docs/mindwealth-api-docs/services/macro/README.md`: full endpoint table + frontend tab mapping
- 13 new endpoint pages in `services/macro/endpoints/`
- Macro total: **17 endpoints** (4 legacy + 13 new)

---

## v1.2.0 (2026-06-06)

### Added

- **Signals** router: `/signals/reports`, `/reports/{name}/latest`, `/reports/{name}/{date}`, `/signals/shortlist`
- **Monitored trades** router: `GET/POST/DELETE /monitored-trades`
- **Virtual trading** router: `/virtual-trading/long`, `/short`, `/portfolio`
- **Analytics** router: `/analytics/sigma`, `/sentiment`, `/sentiment/layers`, `/performance`, `/portfolio-ytd`
- **Macro / Runic** router: `/macro/runic/nightly`, `/runic/variables/current`, `/combo/active`, `/sentiment/positioning`
- Shared report loader: `api/services/reports_service.py`
- Integration tests: `tests/test_api_integration.py`

### Fixed

- Empty `claude_signals_report.csv` (1-byte file): overlay returns `shortlist` fallback; shortlist endpoint reads `.txt` markdown
- Conviction score-sheet: includes MTM / today price / holding period columns when present in overlay data
- Empty CSV load no longer raises parse errors (`load_signal_file`)

### Documentation

- Service docs with per-endpoint pages: signals, monitored-trades, virtual-trading, analytics, macro
- OpenAPI snapshot updated (`docs/api/openapi/mindwealth-v1.json`) — 55 operations

## v1.1.2 (2026-06-05)

### Changed

- API docs base URL updated to hosted server `http://51.20.53.218:8506` (Swagger, ReDoc, OpenAPI, and endpoint examples)

## v1.1.1 (2026-05-26)

### Added

- systemd service `mindwealth-api.service` on port **8506** (`scripts/setup-mindwealth-api-systemd.sh`)
- API docs base URL updated to `http://localhost:8506` (local dev default)

## v1.1.0 (2026-05-26)

### Changed (Conviction Engine v6)

- Scoring aligned with v6 Internal spec: `valuation_tax_breakdown`, 5-vote `fd_votes`, `fd_sizing_adj`, `debt_purpose`, yield trap at market threshold uses `>=`.
- Optional Claude agent dimensions on full recalc when `CONVICTION_RUN_AGENT_DIMS=1` and `ANTHROPIC_API_KEY` is set.

### Added

- Chatbot router under `/api/v1/chatbot`
- Session CRUD, history, finalize (memory extract)
- Async jobs: `POST .../messages` (202), `GET .../jobs/{id}` with `flow_steps`
- Preset launches: `/analyze-asset`, `/signal-insights`, `/breadth-analysis`
- Discovery: config, signal-types, tickers, functions, memory stats
- Flag exchange for debugging
- Documentation: `docs/api/services/chatbot/` + `async-jobs.md`
- Tests: `tests/test_api_chatbot.py`

## v1.0.0 (2026-05-26)

### Added

- FastAPI application (`api/main.py`)
- Health endpoint `GET /api/v1/health`
- Conviction Engine routes under `/api/v1/conviction`
- Structured documentation in `docs/api/`
- OpenAPI snapshot export script `scripts/export_openapi.py`
- API tests in `tests/test_api_conviction.py`

### Planned at v1.0.0 (since implemented in v1.1+ / v1.2.0)

- Chatbot (v1.1.0), Signals, Monitored Trades, Virtual Trading, Analytics, Macro (v1.2.0)
