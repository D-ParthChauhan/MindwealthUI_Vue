# Signals / Reports API

**Status:** implemented (v1.3.0)

**Router:** `api/routers/signals.py`

**Source:** `trade_store/US/`, `api/services/reports_service.py`, `api/services/signal_enrichment_service.py`

**UI reference:** Signals page surface chart, ranked cards, sidebar KPI badges

## Endpoints

| Method | Path | operationId | Doc |
|--------|------|-------------|-----|
| GET | `/signals/reports` | `list_signal_reports` | [list-reports.md](endpoints/list-reports.md) |
| GET | `/signals/reports/{report_name}/latest` | `get_latest_signal_report` | [get-latest-report.md](endpoints/get-latest-report.md) |
| GET | `/signals/reports/{report_name}/{report_date}` | `get_dated_signal_report` | [get-dated-report.md](endpoints/get-dated-report.md) |
| GET | `/signals/shortlist` | `get_claude_shortlist` | [get-shortlist.md](endpoints/get-shortlist.md) |
| GET | `/signals/strategy-health` | `get_strategy_health` | [get-strategy-health.md](endpoints/get-strategy-health.md) |
| GET | `/signals/surface` | `get_signal_surface` | [get-surface.md](endpoints/get-surface.md) |
| GET | `/signals/summary` | `get_signal_summary` | [get-summary.md](endpoints/get-summary.md) |
| GET | `/signals/counts` | `get_signal_counts` | [get-counts.md](endpoints/get-counts.md) |

All paths are prefixed with `/api/v1`.

## Report name slugs

Use slug or base filename in `{report_name}`:

| Slug | CSV file |
|------|----------|
| `new-signals` | `new_signal.csv` |
| `outstanding-signals` | `outstanding_signal.csv` |
| `target-signals` | `target_signal.csv` |
| `all-signal` | `all_signal.csv` |
| `breadth` / `sbi` | `breadth.csv` |
| `sigma` | `sigma.csv` |
| `sentiment` | `sentiment.csv` |
| `combined-performance` | `combined_performance_report.csv` |
| `claude-shortlist` | `claude_signals_report.csv` |
| `f-stack` | `F-Stack-Analyzer.csv` |

## Notes

- Empty or 1-byte CSV files are handled gracefully (no 500 errors).
- Claude overlay via conviction: [overlay-signal-file.md](../conviction/endpoints/overlay-signal-file.md).
