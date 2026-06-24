# API Services Catalog

Master index of all REST services in MindWealth_UI. **API version 1.4.0** — 71 operations.

| Service | Status | Router prefix | Endpoints | Documentation |
|---------|--------|---------------|-----------|---------------|
| [Health](health/) | Implemented | `/api/v1/health` | 1 | [get-health.md](health/get-health.md) |
| [Conviction Engine](conviction/) | Implemented | `/api/v1/conviction` | 15 | [README](conviction/README.md) + [endpoints/](conviction/endpoints/) |
| [Chatbot](chatbot/) | Implemented | `/api/v1/chatbot` | 22 | [README](chatbot/README.md) + [endpoints/](chatbot/endpoints/) |
| [Signals / Reports](signals/) | Implemented | `/api/v1/signals` | 4 | [README](signals/README.md) + [endpoints/](signals/endpoints/) |
| [Monitored Trades](monitored-trades/) | Implemented | `/api/v1/monitored-trades` | 3 | [README](monitored-trades/README.md) + [endpoints/](monitored-trades/endpoints/) |
| [Virtual Trading](virtual-trading/) | Implemented | `/api/v1/virtual-trading` | 3 | [README](virtual-trading/README.md) + [endpoints/](virtual-trading/endpoints/) |
| [Analytics](analytics/) | Implemented | `/api/v1/analytics` | 5 | [README](analytics/README.md) + [endpoints/](analytics/endpoints/) |
| [Macro / Runic](macro/) | Implemented (v1.4.0) | `/api/v1/macro` | 20 | [README](macro/README.md) + [endpoints/](macro/endpoints/) |

## Quick reference by UI area

| Streamlit / Alpha Terminal page | Primary API routes |
|---------------------------------|-------------------|
| Analysis / signal reports | `/signals/reports`, `/signals/shortlist` |
| Virtual portfolio | `/virtual-trading/long`, `/short`, `/portfolio` |
| Monitored trades | `/monitored-trades` |
| Dashboard sigma | `/analytics/sigma` |
| Sentiment / SSI | `/macro/ssi/summary`, `/macro/ssi/multiplier`, `/macro/ssi/history`, `/analytics/sentiment/layers` |
| Performance | `/analytics/performance` |
| Overwatch YTD | `/analytics/portfolio-ytd` |
| Runic macro — Overview | `/macro/status`, `/macro/overview/kpis`, `/macro/regime` |
| Runic macro — Variables | `/macro/variables/heatmap` |
| Runic macro — Combos | `/macro/combos`, `/macro/combos/{id}` |
| Runic macro — Trackers | `/macro/combo-c/cancel`, `/macro/combo-f/window` |
| Runic macro — Analogs | `/macro/analogs/{id}` |
| Runic macro — Brief | `/macro/narrative`, `/macro/runic/nightly` |
| Conviction overlay | `/conviction/overlays/{date}/score-sheet` |
| Chatbot | `/chatbot/sessions`, `/chatbot/jobs` |

## Conviction & chatbot

See [conviction/README.md](conviction/README.md) and [chatbot/README.md](chatbot/README.md) for full endpoint tables.
