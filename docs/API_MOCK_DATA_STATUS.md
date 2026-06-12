# Mock Data Status — What Is Still Mock vs Live

**As of:** 2026-06-10 · API v1.2.0 integration pass  
**Rule:** UI unchanged; Nitro routes try live API first, then fall back to mocks in `server/utils/mock-data.ts`, `runic-mock-data.ts`, or `conviction-mock-data.ts`.

---

## Live when backend is reachable

These routes return **real API data** under normal EC2 operation:

| Page / feature | Route | Data source |
|----------------|-------|-------------|
| Dashboard KPIs | `/api/dashboard` | Trade-store overlays + sigma + composed metrics |
| Signals (outstanding / new) | `/api/signals/*` | `overlay-file` CSVs |
| Performance | `/api/performance` | `combined_performance_report.csv` |
| Breadth | `/api/breadth` | `breadth.csv` |
| Sentiment SSI | `/api/sentiment` | `analytics/sentiment/layers` |
| Overwatch degradations | `/api/overwatch` | Forward-testing rows + portfolio YTD |
| Shortlist report text | `/api/shortlist` | `signals/shortlist` markdown |
| Conviction engine | `/api/conviction` | Overlays, tickers, daily alerts |
| Portfolio positions | `/api/portfolio` | Virtual trading open book (derived sizing) |
| Monitored trades | `/api/monitored-trades` | `monitored_trades.json` |
| Macro — nightly | `/api/runic/nightly` | `macro/runic/nightly` |
| Macro — variables | `/api/variables/current` | `macro/runic/variables/current` |
| AI chat | `/api/chat` | Chatbot async job flow |
| Chat sessions API | `/api/chat/sessions` | `/chatbot/sessions` |
| Meta / last updated | `/api/meta` | Health + overlay paths |

---

## Partially live (API + derived / thin data)

| Area | What is live | What is still mock-shaped or incomplete |
|------|--------------|----------------------------------------|
| **Runic analog panel** | Forward `analog_details` rows from nightly | Rich historical C/F tables (context, WTI, verdicts) → **mock fallback** when API rows lack depth |
| **Runic cancel tracker** | WTI %, cancel week count, combo F window | Full Friday CPI/PPI grid, 4-week dot history → **partial mapper** |
| **Runic variables table** | 12 live values + tiers + heatmap | Source/compute/gate HTML columns → **placeholder text** |
| **Runic overview panel** | KPI cards (dominant, WTI, F week, etc.) | Static narrative paragraphs in Vue template |
| **Portfolio page** | Open positions, regime inputs from API | $500k notional, cluster colors, idle cash yield (3.5%) → **client constants** |
| **Shortlist table rows** | Markdown report body | Structured `rows` when CSV empty on server |
| **Conviction portfolio cards** | Verdict, score, rationale | MTM column shows `—` |
| **Dashboard regime strip** | Breadth function % | Not from dedicated macro regime endpoint |
| **Overwatch panel** | Degradation alerts + live runic dominant alert | `mockRunicPanelAlert` replaced when nightly loads; system checks (India CSV, Tavily, etc.) **hardcoded** |

---

## Fully mock (only when API down OR no UI/API path)

| Data | When mock appears | Should be live? |
|------|-------------------|-----------------|
| **All routes** | `NUXT_API_BASE_URL` unset or upstream error | Yes — configure env |
| **Chat reply** | Backend unreachable **and** not configured | Yes — chatbot API |
| **Chat sessions list in panel** | Sessions API fails | Yes — but UI doesn't list sessions yet |
| **Conviction page** | `loadConviction()` null | Yes — conviction overlays |
| **Runic analog C/F** | `analog_details` empty or thin | **Yes** — needs richer backend export |
| **Runic cancel tracker** | Nightly fetch fails | **Yes** — needs dedicated cancel endpoint |
| **Portfolio** | No open virtual positions | Edge case — empty book |
| **Monitored trades** | Empty `monitored_trades.json` | Edge case — valid empty state |

---

## Should NOT be mock in production

Priority list for removing remaining mock dependence:

1. **Runic analog historical tables** — backend should expose Streamlit-equivalent combo analog JSON.
2. **Combo C Friday cancel grid** — backend endpoint with full `friday_rows` / `cancel_fridays`.
3. **Portfolio sizer output** — single API returning regime + clusters + dollar allocations (not client-derived).
4. **Conviction portfolio MTM** — live prices on score-sheet rows.
5. **Overwatch system health** — real pipeline timestamps per market (US/India) instead of static checks.
6. **Shortlist structured rows** — populate `records` in `GET /signals/shortlist`.
7. **Chat session UI** — wire existing `/api/chat/sessions` into Claude panel (frontend task, no new API).

---

## Mock files (fallback only)

| File | Used by |
|------|---------|
| `server/utils/mock-data.ts` | Dashboard, signals, performance, breadth, sentiment, overwatch, shortlist, portfolio, monitored trades, meta |
| `server/utils/runic-mock-data.ts` | Macro runic nightly, variables, analog, cancel tracker |
| `server/utils/conviction-mock-data.ts` | Conviction page |
| `server/api/chat.post.ts` | Inline mock chat when API not configured |
| `server/api/chat/sessions.get.ts` | Inline mock session when list API fails |

---

## Quick audit command

With dev server running:

```bash
curl -s localhost:3000/api/dashboard | jq '.kpis.sigma'
curl -s localhost:3000/api/portfolio | jq '.positions | length'
curl -s localhost:3000/api/monitored-trades | jq '.trades | length'
curl -s localhost:3000/api/sentiment | jq '.layers.weekly.items | length'
curl -s localhost:3000/api/runic/nightly | jq '.dominant_signal'
```

Non-null / non-mock-looking values confirm live integration.
