# API Changelog

## v1.7.1 (2026-06-24)

### Fixed — `all-signal` composite_score null with `enrich=true`

- **Root cause:** `all_signal.csv` was written before nightly `get_common_column()` MasterSpec enrichment, so rows lacked `Signal Quality Composite Score` and related columns.
- **API fix:** `signal_enrichment_service` now falls back to MindWealth `enrich_signal_dict()` when MasterSpec columns are absent — computes `composite_score`, `er`, `tier`, etc. from raw backtest fields.
- **Pipeline fix:** `send_email.py` runs `get_common_column()` before `send_all_signal_mail()` so future nightly CSVs include MasterSpec columns.
- **Usage:** `GET /signals/reports/all-signal/latest?enrich=true` (default is `enrich=false` for performance).

**Tests:** 18/18 pass in `tests/test_api_signals_surface.py`

---

## v1.7.0 (2026-06-24)

### Fixed — Long-term fixes from LIMITATIONS.md

#### Core fixes (`MindWealth/`)

- **Limitation #2** — `extract_days_from_formatted_string` moved to new `helper_functions/day_parser.py` (no UI deps). `util.py` thin-wraps it. `claude_lateness_metrics.py` imports from `day_parser`. MindWealth core can now be imported in the API venv without dash/plotly.
- **Limitation #3** — `parse_bt_avg_lose_return_pct` now treats `str(val).lower() == "nan"` as `None`, preventing `er` / `er_annualized` NaN propagation.
- **Limitation #1** — `helper_functions/enrich_pipeline.py` added. Nightly pipeline (`send_email.py`) now calls `enrich_dataframe()` before writing outstanding, new, and all-signal CSVs, persisting `window_remaining_pct`, `tier`, `exit_fired`, `alpha_interpretation`, `er_annualized`, `signal_alpha_annualized` to trade_store.

#### API fixes (`MindWealth_UI/`)

- **Limitation #9** — `GET /signals/reports/all-signal/latest` defaults `enrich=false`. Callers can opt in via `?enrich=true`. Reduces per-request latency for large datasets.
- **Limitation #9** — `?limit=N` query param added to `/reports/{name}/latest` and `/reports/{name}/{date}` to cap records returned.
- **Limitation #4** — Conviction overlay now walks back 30 days (was 7) before returning null, improving data availability for reports near a holiday gap.

**Tests:** 17/17 pass in `tests/test_api_signals_surface.py`

---

## v1.6.0 (2026-06-24)

### Added — Signals page surface / quality enrichment

Closes `SIGNALS_BACKEND_REQUIREMENTS.md` §5 (enriched per-signal fields) and §6 (summary counts).

| New endpoint | operationId | Purpose |
|--------------|-------------|---------|
| `GET /signals/surface` | `get_signal_surface` | Enriched per-signal records for bubble chart + ranked cards |
| `GET /signals/summary` | `get_signal_summary` | KPI counts (total, long, short, tier_counts, function_counts) |
| `GET /signals/counts` | `get_signal_counts` | Sidebar badge counts (outstanding, new, shortlist) |

**Enriched fields added to existing report endpoints** (outstanding-signals, new-signals, all-signal):

`window_remaining_pct`, `tier`, `exit_fired`, `alpha_interpretation`, `er_annualized`, `signal_alpha_annualized`, `mtm_pct`, `days_elapsed`, `avg_hold_days`, `direction`, `symbol`, `rr_static`, `fwd_wr`, `cagr_diff`, `conviction_score`, `conviction_bq_score`, `conviction_fs_class`

Enrichment is on by default (`enrich=true`). Pass `enrich=false` to get raw CSV records.

**Shortlist `records[]` populated** from `<surface_json>` block embedded in `claude_signals_report.txt` — 64 structured rows vs 0 previously.

**All math Python-computed** — no mock data. `signal_enrichment_service.py` is self-contained (no dash/plotly dependency).

**Tests:** 14/14 pass in `tests/test_api_signals_surface.py`

**Limitations doc:** `MindWealth/instruction_docs_2/signals_master_spec/frontend_and_api_details/LIMITATIONS.md`

---

## v1.5.1 (2026-06-23)

### Fixed — Portfolio API data gaps

Closes limitations documented in `PORTFOLIO_API_LIMITATIONS.md` (v1):

| Change | Endpoint(s) |
|--------|-------------|
| SPX vs 200d MA trend multiplier (yfinance `^GSPC`) | `GET /portfolio/sizer` — `ceiling.spx_trend_mult`, `ceiling.spx_trend_meta` |
| Company/ETF names from cache (`portfolio_ticker_names.json`); never null | `GET /portfolio/sizer`, `GET /portfolio/risk/search`, `POST /portfolio/risk/analyze` |
| Data-driven cluster correlation matrix (ETF proxies, 7-day cache) | `GET /portfolio/risk`, `POST /portfolio/risk/analyze` — `correlation_meta` |
| `scenario` query param on risk endpoint | `GET /portfolio/risk?scenario=normal\|stress\|lowvol` |
| Improved cluster assignment (business_type + asset_type + expanded ticker map) | All portfolio endpoints |
| `win_rate_label`, `backtested_win_rate_pct`, `unscored` on position rows | `GET /portfolio/sizer` |

**Cache files:** `macro_intelligence/output/portfolio_ticker_names.json`, `portfolio_cluster_correlations.json`

**Tests:** 27/27 pass in `tests/test_api_portfolio.py`

**Docs:** `PORTFOLIO_API_LIMITATIONS_v2.md` in MindWealth instruction docs

---

## v1.5.0 (2026-06-23)

### Added — Portfolio Sizer + Risk endpoints

4 new endpoints providing full Portfolio page backend coverage per `PORTFOLIO_BACKEND_REQUIREMENTS.md`:

| Endpoint | operationId | Purpose |
|----------|-------------|---------|
| `GET /portfolio/sizer` | `getPortfolioSizer` | Full regime-aware allocation payload — ceiling decomposition, cluster budgets, per-position sizing (BQ tiers, flags, P&L), constraint checks, active combos |
| `GET /portfolio/risk` | `getPortfolioRisk` | 8×8 cluster correlation matrix + breach list (ρ > 0.75 watch / > 0.85 action) + cluster weight bars |
| `POST /portfolio/risk/analyze` | `analyzeUserHoldings` | User holdings analysis vs model book — concentration warnings, correlation breaches, suggested trims |
| `GET /portfolio/risk/search` | `searchPortfolioTickers` | Ticker autocomplete from open VT book + conviction universe |

**Router:** `api/routers/portfolio.py`

**Service:** `api/services/portfolio_service.py`

**Sources:** VT CSVs + conviction overlays + `runic_output.json` + `ssi.db`

**Tests:** 25 new tests in `tests/test_api_portfolio.py` (25/25 pass)

**Scenarios:** `normal` (regime_max 80%) / `stress` (65%) / `lowvol` (85%) — all return distinct ceiling + scaled cluster allocations

**Sizing rules:** BQ ≥+8 → MAX 100% · +5–+7 → TACTICAL 75% · +2–+4 → REDUCED 40% · <+2 → BLOCKED 0%. Adjustments: FD+ +10pp, FD− −15pp, Combo C active −20pp new longs, Yield trap → 0.

**Docs:** 4 endpoint pages in `services/portfolio/endpoints/`

---

## v1.4.0 (2026-06-19)

### Added — SSI (Super Sentiment Index) dedicated endpoints

3 new endpoints backed by `ssi.db` providing full SSI access:

| Endpoint | operationId | Purpose |
|---|---|---|
| `GET /macro/ssi/summary` | `get_ssi_summary` | Latest SSI snapshot — level, percentile, multiplier, layer2 status, per-input vote breakdown |
| `GET /macro/ssi/history` | `get_ssi_history` | Daily SSI time series for charting (default 30 days, max 90, `?days=N`) |
| `GET /macro/ssi/multiplier` | `get_ssi_multiplier` | Lightweight multiplier + sizing signals for position-sizing checks |

**Service:** `api/services/macro_service.py` — added `get_ssi_summary()`, `get_ssi_history()`, `get_ssi_multiplier()`

**Data source:** `ssi.db` (`ssi_daily` table — 13 rows live) + `positioning.json` for signal thresholds

**Tests:** 10 new tests in `tests/test_api_macro.py` → `TestSSIEndpoints` class (32/32 total pass)

**Docs:** 3 new endpoint pages in `services/macro/endpoints/`

---

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
