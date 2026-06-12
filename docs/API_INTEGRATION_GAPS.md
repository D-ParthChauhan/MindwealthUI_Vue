# API Integration Gaps

**Upstream:** `http://51.20.53.218:8506` (`/api/v1/*`) · OpenAPI **v1.2.0** (`mindwealth-api-docs-main 2/`)  
**Integration layer:** Nuxt Nitro `/api/*` → `server/utils/mindwealth-data.ts`  
**UI:** unchanged — pages still call local `/api/*` only.

This document lists what was **missing** on the frontend or backend to complete API integration, and what remains open after the v1.2.0 pass.

---

## 1. Backend gaps (API exists but shape ≠ UI contract)

| Area | Backend endpoint | Gap |
|------|------------------|-----|
| **Runic analog tables** | `GET /macro/runic/nightly` (`analog_details`) | API returns sparse forward SPX windows (date + % columns only). UI expects rich historical rows (context, WTI at fire, max DD, verdict). Nitro falls back to mock when API rows are too thin. |
| **Combo C cancel tracker** | `combo_c_cancel` in nightly JSON | API exposes cancel state + WTI potential week; UI expects full Friday row grid (WTI leg, CPI/PPI legs, 4-week dot history). Mapper provides a **partial** live payload. |
| **Runic variables table** | `GET /macro/runic/variables/current` | API returns numeric `variables_dashboard` (12 vars). UI table expects HTML-rich columns (source, compute, rare/extreme gates, combo tags). Mapper fills placeholders for missing columns. |
| **Portfolio sizer** | `GET /virtual-trading/long` + `/short` | API returns flat CSV rows; UI expects regime budget sliders, cluster bar, and dollar sizing on a **$500k notional**. Nitro derives clusters/heuristics — not a 1:1 match to Streamlit sizer output. |
| **Conviction portfolio MTM** | `GET /conviction/overlays/{date}/score-sheet` | No live mark-to-market on portfolio cards; UI shows `—` for MTM. |
| **Shortlist CSV rows** | `GET /signals/shortlist` | Markdown `.txt` is live; `records` array often empty — UI shortlist table may have no structured rows. |

---

## 2. Backend endpoints not wired to the UI

These are in OpenAPI v1.2.0 but have **no** Nitro route or no UI surface.

### Conviction (ops / admin)

| Endpoint | Reason |
|----------|--------|
| `POST /conviction/tickers/{ticker}/recalculate` | Pipeline action — no admin UI |
| `PATCH /conviction/tickers/{ticker}/daily` | Manual daily update |
| `PATCH /conviction/tickers/{ticker}/overrides` | Override editor not in terminal |
| `POST /conviction/signals/evaluate` | Single-signal evaluate |
| `GET /conviction/universe` | Universe picker not exposed |
| `GET /conviction/coverage/pe-history` | PE coverage panel not in UI |
| `POST /conviction/pipeline/daily` | Batch pipeline trigger |

### Chatbot (session management / debug)

| Endpoint | Reason |
|----------|--------|
| `GET/PATCH/DELETE /chatbot/sessions/{id}` | Session CRUD not in Claude panel |
| `POST /chatbot/sessions/{id}/finalize` | Not exposed |
| `GET /chatbot/sessions/{id}/history` | History via job result only |
| `GET /chatbot/jobs` | Job list UI not built |
| `GET /chatbot/signal-types`, `POST .../preview` | Static frontend filter chips |
| `GET /chatbot/tickers`, `/functions` | Asset picker uses signal data |
| `GET /chatbot/memory/stats`, `POST .../flag` | Ops/debug only |

### Signals reports (alternate path)

| Endpoint | Reason |
|----------|--------|
| `GET /signals/reports`, `.../{name}/latest`, `.../{date}` | UI still uses `conviction/signals/overlay-file` for CSV parity |

### Monitored trades (write)

| Endpoint | Reason |
|----------|--------|
| `POST/PATCH/DELETE /monitored-trades/{id}` | Read-only list in terminal — no add/edit UI |

### Analytics (unused alternate)

| Endpoint | Reason |
|----------|--------|
| `GET /analytics/performance` | Overlaps overlay-file; not switched yet |
| `GET /analytics/sentiment` | Superseded by `/analytics/sentiment/layers` for SSI UI |

### Macro (subset unused)

| Endpoint | Reason |
|----------|--------|
| `GET /macro/combo/active` | Subset of nightly — merged into nightly mapper |
| `GET /macro/sentiment/positioning` | Merged via `/analytics/sentiment/layers` |

---

## 3. Frontend gaps (no UI change requested)

| Feature | Gap |
|---------|-----|
| **Chat session list** | `GET /api/chat/sessions` is live; Claude panel does not render session history. |
| **Portfolio sliders** | `maxDeploy` / `maxPerCluster` are client-only; not persisted or sent to API. |
| **Runic overview copy** | Large narrative blocks in `RunicOverviewPanel` are static HTML; only KPI computed fields use API. |
| **Overwatch system checks** | India CSV / Claude / Tavily / Sheets rows are still hardcoded in `overwatch-panel.ts`. |
| **Regime strip** | Dashboard regime bar uses breadth rows, not dedicated macro regime API. |
| **Auth UI** | No settings surface for `NUXT_API_KEY`; header sent server-side only. |

---

## 4. Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `NUXT_API_BASE_URL` | `http://51.20.53.218:8506` | Host without `/api/v1` |
| `NUXT_API_KEY` | empty | Optional `X-API-Key` when backend enforces `API_KEY` |

---

## 5. Recommended backend follow-ups (highest impact)

1. **Runic analog export** — structured combo C/F historical tables matching Streamlit analog panel.
2. **Combo C Friday tracker** — dedicated endpoint with full `friday_rows` + `cancel_fridays` arrays.
3. **Portfolio sizer** — single endpoint returning `PortfolioResponse`-shaped JSON (regime, clusters, sized positions).
4. **Conviction MTM** — price + MTM on score-sheet or ticker detail for portfolio cards.
5. **Shortlist** — populate `records` in `GET /signals/shortlist` when CSV exists.
