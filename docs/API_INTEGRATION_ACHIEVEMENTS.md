# API Integration Achievements

**Integration date:** 2026-06-10  
**Upstream:** MindWealth API **v1.2.0** at `http://51.20.53.218:8506` (`/api/v1/*`)  
**Docs source:** `mindwealth-api-docs-main 2/`  
**Scope:** Nitro BFF only — **no Vue/UI changes**.

---

## Summary

The Alpha Terminal now consumes the **v1.2.0 service architecture** (Signals, Monitored Trades, Virtual Trading, Analytics, Macro) in addition to the earlier Conviction overlay + Chatbot integration. Mock fallbacks remain only when the API is unreachable or the response is too sparse for the existing UI contract.

---

## New in this pass (beyond prior v1.1 integration)

| Nitro route | New upstream API | What changed |
|-------------|------------------|--------------|
| `GET /api/portfolio` | `GET /virtual-trading/long`, `/short`, `GET /analytics/sentiment/layers`, `GET /macro/runic/variables/current` | Live open positions → sized portfolio view (derived clusters, regime from VIX + SSI) |
| `GET /api/monitored-trades` | `GET /monitored-trades` | Live `monitored_trades.json` records (8 trades verified) |
| `GET /api/sentiment` | `GET /analytics/sentiment/layers` | Full SSI layer 1/2/3 breakdown + composite + signal rows |
| `GET /api/runic/nightly` | `GET /macro/runic/nightly` | Dominant combo, active/watch combos, narrative, WTI/CFTC |
| `GET /api/variables/current` | `GET /macro/runic/variables/current` | 12-variable dashboard + heatmap |
| `GET /api/combo/cancel_tracker` | Derived from nightly `combo_c_cancel` | Partial live cancel monitor |
| `GET /api/combo/analog` | Derived from nightly `analog_details` | Live when rows exist; mock fallback for rich history |
| `GET /api/shortlist` | `GET /signals/shortlist` | Full Claude markdown report (~27k chars live) |
| `GET /api/dashboard` | `GET /analytics/sigma` | Sigma KPI from latest `sigma.csv` |
| `GET /api/overwatch` | `GET /analytics/portfolio-ytd` + nightly | `forced_portfolio_ytd` live; runic panel alert from dominant signal |
| `GET /api/signals/counts` | `GET /signals/shortlist` | `shortlisted` count from API when available |

---

## Infrastructure added

| File | Role |
|------|------|
| `server/utils/runic-mappers.ts` | Maps macro API JSON → `RunicNightlyResponse`, `RunicVariablesResponse`, cancel tracker, analog |
| `server/utils/sentiment-mapper.ts` | Maps `analytics/sentiment/layers` → `SentimentResponse.layers` |
| `server/utils/mindwealth-data.ts` | Extended loaders: portfolio, monitored trades, runic, sigma, YTD, shortlist |

---

## Endpoints integrated (full list)

| Nitro route | Primary upstream |
|-------------|------------------|
| `GET /api/meta` | `/health` + overlay `source_file` |
| `GET /api/dashboard` | Composed + `/analytics/sigma` |
| `GET /api/signals/outstanding` | `POST /conviction/signals/overlay-file` |
| `GET /api/signals/new` | overlay `new_signal.csv` |
| `GET /api/signals/counts` | overlay + `/signals/shortlist` |
| `GET /api/performance` | overlay `combined_performance_report.csv` |
| `GET /api/breadth` | overlay `breadth.csv` |
| `GET /api/sentiment` | `/analytics/sentiment/layers` (fallback: overlay) |
| `GET /api/overwatch` | performance CSV + `/analytics/portfolio-ytd` + runic nightly |
| `GET /api/shortlist` | `/signals/shortlist` |
| `GET /api/conviction` | `/conviction/overlays/*`, tickers, alerts |
| `GET /api/portfolio` | `/virtual-trading/*`, sentiment layers, runic variables |
| `GET /api/monitored-trades` | `/monitored-trades` |
| `GET /api/runic/nightly` | `/macro/runic/nightly` |
| `GET /api/variables/current` | `/macro/runic/variables/current` |
| `GET /api/combo/cancel_tracker` | nightly subset |
| `GET /api/combo/analog` | nightly `analog_details` |
| `POST /api/chat` | chatbot sessions → messages → job poll |
| `GET /api/chat/sessions` | `/chatbot/sessions` |

---

## Verified live samples (2026-06-09 store)

| Check | Result |
|-------|--------|
| Health | `version: 1.2.0` |
| Monitored trades | 8 records |
| Virtual trading long | 489 rows, open positions available |
| Portfolio YTD | `forced_portfolio_ytd: 787.40` |
| Shortlist markdown | ~27,427 characters |
| Sigma | `-3.95σ` from latest row |
| Runic nightly | `dominant_signal: F`, date `2026-06-09` |
| Sentiment layers | SSI level 0.27, layer2 CONFIRMED, 7 signal rows |

---

## How to run

```bash
export NUXT_API_BASE_URL=http://51.20.53.218:8506
# export NUXT_API_KEY=...   # if API_KEY enforced on server
npm run dev
```

Mock fallbacks activate automatically when `NUXT_API_BASE_URL` is empty or upstream returns null.
