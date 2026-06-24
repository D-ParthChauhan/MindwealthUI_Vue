# Macro / Runic API

**Status:** implemented (v1.3.0)

**Router:** `api/routers/macro.py`

**Service:** `api/services/macro_service.py`

**Source:** `macro_intelligence/output/runic_output.json`, `runic.db`, `positioning.json`

**Domain docs:** [`docs/MACRO_INTELLIGENCE_MASTER.md`](../../../MACRO_INTELLIGENCE_MASTER.md)

## Endpoints

### Legacy (v1.2.0)

| Method | Path | operationId | Doc |
|--------|------|-------------|-----|
| GET | `/macro/runic/nightly` | `get_runic_nightly` | [get-runic-nightly.md](endpoints/get-runic-nightly.md) |
| GET | `/macro/runic/variables/current` | `get_runic_variables_current` | [get-runic-variables.md](endpoints/get-runic-variables.md) |
| GET | `/macro/combo/active` | `get_active_combos` | [get-active-combos.md](endpoints/get-active-combos.md) |
| GET | `/macro/sentiment/positioning` | `get_ssi_positioning` | [get-positioning.md](endpoints/get-positioning.md) |

### New (v1.3.0)

| Method | Path | operationId | Doc |
|--------|------|-------------|-----|
| GET | `/macro/status` | `get_macro_status_bar` | [get-status-bar.md](endpoints/get-status-bar.md) |
| GET | `/macro/overview/kpis` | `get_macro_overview_kpis` | [get-overview-kpis.md](endpoints/get-overview-kpis.md) |
| GET | `/macro/regime` | `get_macro_regime` | [get-regime.md](endpoints/get-regime.md) |
| GET | `/macro/variables/heatmap` | `get_variables_heatmap` | [get-variables-heatmap.md](endpoints/get-variables-heatmap.md) |
| GET | `/macro/combos` | `list_named_combos` | [list-named-combos.md](endpoints/list-named-combos.md) |
| GET | `/macro/combos/{combo_id}` | `get_named_combo_detail` | [get-combo-detail.md](endpoints/get-combo-detail.md) |
| GET | `/macro/combo-c/cancel` | `get_combo_c_cancel_tracker` | [get-combo-c-cancel.md](endpoints/get-combo-c-cancel.md) |
| GET | `/macro/combo-f/window` | `get_combo_f_window` | [get-combo-f-window.md](endpoints/get-combo-f-window.md) |
| GET | `/macro/analogs/{combo_id}` | `get_combo_analog_table` | [get-analog-table.md](endpoints/get-analog-table.md) |
| GET | `/macro/narrative` | `get_nightly_narrative` | [get-narrative.md](endpoints/get-narrative.md) |
| GET | `/macro/persistence` | `get_persistence_signals` | [get-persistence.md](endpoints/get-persistence.md) |
| GET | `/macro/data/freshness` | `get_data_freshness` | [get-data-freshness.md](endpoints/get-data-freshness.md) |
| POST | `/macro/run-nightly` | `trigger_nightly_run` | [post-run-nightly.md](endpoints/post-run-nightly.md) |

All paths are prefixed with `/api/v1`.

## Frontend Tab Mapping

| Frontend Tab | Primary Endpoint(s) |
|---|---|
| Top status bar | `GET /macro/status` |
| Overview — KPI cards | `GET /macro/overview/kpis` |
| Overview — Regime card | `GET /macro/regime` |
| Overview — Active/Watch combos | `GET /macro/combo/active` |
| 12 Variables — Heatmap | `GET /macro/variables/heatmap` |
| 7 Named Combos | `GET /macro/combos` |
| Named Combo detail | `GET /macro/combos/{combo_id}` |
| Combo Tracker — C cancel | `GET /macro/combo-c/cancel` |
| Combo Tracker — F window | `GET /macro/combo-f/window` |
| Analog Tables | `GET /macro/analogs/{combo_id}` |
| Nightly Brief | `GET /macro/narrative` |
| Full payload | `GET /macro/runic/nightly` |

## Errors

| Status | Cause |
|--------|-------|
| 400 | Invalid combo_id (must be A–G) |
| 404 | Runic or positioning output file not found on disk |
| 502 | Upstream data pull or nightly run failed |

## Related

- SSI + sentiment view: [get-sentiment-layers.md](../analytics/endpoints/get-sentiment-layers.md)
- Full nightly payload: [get-runic-nightly.md](endpoints/get-runic-nightly.md)
