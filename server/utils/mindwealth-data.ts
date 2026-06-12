import type {
  ApiMeta,
  BreadthResponse,
  ChatRequest,
  ChatResponse,
  ChatSessionsResponse,
  DashboardResponse,
  MonitoredTradesResponse,
  OverwatchResponse,
  PerformanceResponse,
  PortfolioResponse,
  SentimentResponse,
  ShortlistResponse,
  SignalCountsResponse,
  SignalsListResponse,
} from '~/types/api'
import type {
  ConvictionContradiction,
  ConvictionHealth,
  ConvictionPortfolioCard,
  ConvictionResponse,
  ConvictionSignalDetail,
  ConvictionSignalRow,
  ConvictionVerdict,
  FsClass,
  FdDirection,
} from '~/types/conviction'
import {
  fetchHealth,
  fetchLatestOverlayDate,
  fetchOverlayFile,
  isBackendConfigured,
  mindwealthFetch,
} from './mindwealth-client'
import {
  buildSignalsSummary,
  parseForwardTestingRows,
  parsePercentValue,
  parseSymbolField,
  performanceRecordToRow,
  recordToSignal,
  recordsToSignals,
  signalToTopSignal,
} from './signal-parsers'
import { formatPersistenceSignals } from '~/utils/runic-regime'
import { buildWinRateChart } from '~/utils/win-rate-chart'
import { baseMeta } from './meta'
import { mapSentimentLayers } from './sentiment-mapper'
import {
  mapRunicAnalog,
  mapRunicCancelTracker,
  mapRunicNightly,
  mapRunicVariables,
} from './runic-mappers'

type TickerSummary = {
  ticker: string
  asset_type?: string
  business_type?: string
  bq_raw?: number
  conviction_score?: number
  fs_class?: string
  yield_trap_warning?: boolean
  fd_direction?: string
  last_daily_update?: string
}

type TickerFull = TickerSummary & {
  bq_components?: Array<{ name?: string; score?: number; source?: string }>
  fd_votes?: Array<{ label?: string; direction?: string }>
  valuation_tax?: number
  oey?: number
  pe_percentile?: number
  pe_fwd?: number
  rationale?: string
  verdict?: string
  sizing_pct?: number
}

function metaFromSource(sourceFile?: string): ApiMeta {
  const meta = baseMeta()
  if (sourceFile) {
    const name = sourceFile.split('/').pop() ?? sourceFile
    const dateMatch = name.match(/(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) {
      meta.data_updated_at = {
        date: dateMatch[1],
        time: '00:00:00',
        datetime: `${dateMatch[1]}T00:00:00Z`,
        timezone: 'UTC',
      }
      meta.source_files = {
        ...meta.source_files,
        latest_report: sourceFile,
      }
    }
  }
  return meta
}

function breadthSentimentFromRows(
  rows: Array<{ function: string; bullish_asset_percentage: number; bullish_signal_percentage: number }>,
): { score: string; label: string } {
  const combined = rows.find((r) => r.function.toLowerCase() === 'combined') ?? rows[0]
  if (!combined) return { score: '0.0', label: 'neutral · no trigger' }
  const pct = combined.bullish_signal_percentage
  const score = ((pct - 50) / 50).toFixed(1)
  const n = Number(score)
  const prefix = n >= 0 ? '+' : ''
  let label = 'neutral · no trigger'
  if (n >= 0.3) label = 'bullish · watch longs'
  else if (n <= -0.3) label = 'bearish · caution'
  return { score: `${prefix}${score}`, label }
}

function mapVerdict(raw: string | undefined, yieldTrap: boolean): ConvictionVerdict {
  if (yieldTrap) return 'YIELD TRAP'
  const v = (raw ?? '').toUpperCase()
  if (v.includes('MAX')) return 'MAX CONVICTION'
  if (v.includes('TACTICAL')) return 'TACTICAL'
  if (v.includes('REDUCED')) return 'REDUCED'
  if (v.includes('CANCEL')) return 'CANCEL'
  if (v.includes('NOT_APPLICABLE') || v.includes('N/A')) return 'N/A (ETF)'
  return 'CANCEL'
}

function normalizeFsClass(raw?: string): FsClass | null {
  if (!raw) return null
  const s = raw.toLowerCase().replace(/\s+/g, '_') as FsClass
  const allowed: FsClass[] = ['strong', 'moderate_high', 'moderate', 'moderate_low', 'weak']
  return allowed.includes(s) ? s : 'moderate'
}

function normalizeFd(raw?: string | number | null): FdDirection | null {
  if (raw == null || raw === '') return null
  const s = String(raw).toLowerCase()
  if (s.includes('pos')) return 'positive'
  if (s.includes('neg')) return 'negative'
  return 'stable'
}

function sizingFromVerdict(verdict: ConvictionVerdict, sizingPct?: number): string {
  if (verdict === 'N/A (ETF)') return '—'
  if (sizingPct != null && sizingPct > 0) return `${Math.round(sizingPct)}%`
  if (verdict === 'MAX CONVICTION') return '100%'
  if (verdict === 'TACTICAL') return '75%'
  if (verdict === 'REDUCED') return '40%'
  return '0%'
}

function parseBqComponents(raw: unknown): ConvictionSignalDetail['dimensions'] {
  if (Array.isArray(raw)) {
    return raw.map((c) => ({
      name: String((c as { name?: string }).name ?? ''),
      score: Number((c as { score?: number }).score ?? 0),
      source: String((c as { source?: string }).source ?? 'auto'),
    }))
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>).map(([name, score]) => ({
      name: name.replace(/_/g, ' '),
      score: Number(score),
      source: 'auto',
    }))
  }
  return []
}

function parseFdVotes(raw: unknown): ConvictionSignalDetail['fdVotes'] {
  if (Array.isArray(raw)) {
    return raw.map((v) => ({
      label: String((v as { label?: string }).label ?? ''),
      direction: normalizeFd((v as { direction?: string }).direction) ?? 'stable',
    }))
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([key, val]) => ({
      label: `${key.replace(/_/g, ' ')}: ${val}`,
      direction: normalizeFd(val as string) ?? 'stable',
    }))
  }
  return []
}

function tickerToDetail(t: TickerFull): ConvictionSignalDetail {
  return {
    ticker: t.ticker,
    businessType: String(t.business_type ?? ''),
    bq: Number(t.bq_raw ?? 0),
    tax: Number(t.valuation_tax ?? 0),
    conviction: Number(t.conviction_score ?? 0),
    fsClass: normalizeFsClass(t.fs_class) ?? 'moderate',
    fdDirection: normalizeFd(t.fd_direction) ?? 'stable',
    yieldTrap: Boolean(t.yield_trap_warning),
    dimensions: parseBqComponents(t.bq_components),
    oey: Number(t.oey ?? 0),
    oeyFloorLabel: '',
    pe: Number(t.pe_fwd ?? 0),
    pePercentile: Number(t.pe_percentile ?? 0),
    fdVotes: parseFdVotes(t.fd_votes),
    fdSummary: '',
    taxNote: '',
    verdictNote: String(t.rationale ?? ''),
  }
}

function scoreRecordToRow(
  rec: Record<string, unknown>,
  ticker?: TickerFull | null,
): ConvictionSignalRow {
  const sym = parseSymbolField(String(rec[SYM_COL] ?? `${rec.ticker}, Long, 2026-01-01`))
  const yieldTrap = Boolean(rec.yield_trap_warning ?? ticker?.yield_trap_warning)
  const verdict = mapVerdict(String(rec.verdict ?? ticker?.verdict), yieldTrap)
  const isEquity = String(rec.asset_type ?? ticker?.asset_type ?? 'EQUITY') === 'EQUITY'
  const id = sym.symbol.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const detail = ticker ? tickerToDetail({ ...ticker, ticker: sym.symbol }) : undefined

  return {
    id,
    ticker: sym.symbol,
    direction: sym.signalType.toLowerCase().startsWith('s') ? 'SHORT' : 'LONG',
    function: String(rec.Function ?? ''),
    signalDate: sym.signalDate,
    convictionScore: rec.conviction_score != null ? Number(rec.conviction_score) : null,
    verdict,
    sizeModifier: sizingFromVerdict(verdict, Number(rec.sizing_pct ?? 0)),
    bqScore: rec.bq_raw != null ? Number(rec.bq_raw) : null,
    fsClass: normalizeFsClass(String(rec.fs_class ?? ticker?.fs_class)),
    fdDirection: normalizeFd(String(rec.fd_direction ?? ticker?.fd_direction)),
    yieldTrap,
    isEquity,
    detail,
  }
}

const SYM_COL = 'Symbol, Signal, Signal Date/Price[$]'

export async function loadMeta(): Promise<ApiMeta | null> {
  if (!isBackendConfigured()) return null
  const health = await fetchHealth()
  const outstanding = await fetchOverlayFile('outstanding_signal.csv')
  const meta = metaFromSource(outstanding?.source_file)
  if (health?.version) {
    meta.market_label = `MindWealth API v${health.version}`
  }
  return meta
}

export async function loadOutstandingSignals(): Promise<SignalsListResponse | null> {
  const overlay = await fetchOverlayFile('outstanding_signal.csv')
  if (!overlay?.records?.length) return null
  const signals = recordsToSignals(overlay.records)
  const functionCounts = Object.entries(
    signals.reduce<Record<string, number>>((acc, s) => {
      const k = s.function.toUpperCase()
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, count]) => ({ name, count }))

  return {
    meta: metaFromSource(overlay.source_file),
    summary: buildSignalsSummary(signals),
    signals,
    function_counts: functionCounts,
  }
}

export async function loadNewSignals(): Promise<SignalsListResponse | null> {
  const overlay = await fetchOverlayFile('new_signal.csv')
  if (!overlay?.records?.length) return null
  const signals = recordsToSignals(overlay.records)
  return {
    meta: metaFromSource(overlay.source_file),
    summary: buildSignalsSummary(signals),
    signals,
  }
}

export async function loadSignalCounts(): Promise<SignalCountsResponse | null> {
  const [outstanding, newSig, perf, shortlist] = await Promise.all([
    fetchOverlayFile('outstanding_signal.csv'),
    fetchOverlayFile('new_signal.csv'),
    fetchOverlayFile('combined_performance_report.csv'),
    mindwealthFetch<{ row_count?: number; records?: unknown[] }>('/signals/shortlist'),
  ])
  if (!outstanding && !newSig) return null
  const shortlisted =
    shortlist?.row_count ??
    shortlist?.records?.length ??
    newSig?.row_count ??
    0
  return {
    outstanding: outstanding?.row_count ?? 0,
    new: newSig?.row_count ?? 0,
    shortlisted,
    pages: {
      ...(outstanding?.source_file
        ? { 'Outstanding Signals': outstanding.source_file }
        : {}),
      ...(perf?.source_file
        ? { 'Combined Performance Report': perf.source_file }
        : {}),
    },
  }
}

export async function loadPerformance(): Promise<PerformanceResponse | null> {
  const overlay = await fetchOverlayFile('combined_performance_report.csv')
  if (!overlay?.records?.length) return null
  const rows = overlay.records
    .map(performanceRecordToRow)
    .filter((r): r is NonNullable<typeof r> => r != null)
  const avgWin =
    rows.length > 0
      ? Math.round(rows.reduce((a, r) => a + r.win_percentage, 0) / rows.length * 10) / 10
      : 0
  const totalTrades = rows.reduce((a, r) => a + r.total_trades, 0)
  return {
    meta: metaFromSource(overlay.source_file),
    rows,
    aggregates: {
      avg_win_rate: avgWin,
      total_trades: totalTrades,
      avg_sharpe: 1.0,
    },
  }
}

export async function loadBreadth(): Promise<BreadthResponse | null> {
  const overlay = await fetchOverlayFile('breadth.csv')
  if (!overlay?.records?.length) return null
  const rows = overlay.records.map((rec) => {
    const fn = String(rec.Function ?? '')
    const longPct = parsePercentValue(rec['Today Long Signal Percentile From Top (Last 6 Month)'])
    const shortPct = parsePercentValue(rec['Today Short Signal Percentile From Top (Last 6 Month)'])
    return {
      function: fn,
      bullish_asset_percentage: Math.round((longPct + (100 - shortPct)) / 2 * 10) / 10,
      bullish_signal_percentage: longPct,
    }
  })
  const withCombined =
    rows.find((r) => r.function.toLowerCase() === 'combined') != null
      ? rows
      : [
          {
            function: 'Combined',
            bullish_asset_percentage:
              rows.reduce((a, r) => a + r.bullish_asset_percentage, 0) / (rows.length || 1),
            bullish_signal_percentage:
              rows.reduce((a, r) => a + r.bullish_signal_percentage, 0) / (rows.length || 1),
          },
          ...rows,
        ]
  return {
    meta: metaFromSource(overlay.source_file),
    rows: withCombined,
    sentiment: breadthSentimentFromRows(withCombined),
  }
}

export async function loadSentiment(): Promise<SentimentResponse | null> {
  const layers = await mindwealthFetch<Parameters<typeof mapSentimentLayers>[0]>(
    '/analytics/sentiment/layers',
  )
  if (layers?.layer_inputs || layers?.composite) {
    return mapSentimentLayers(layers)
  }

  const overlay = await fetchOverlayFile('sentiment.csv')
  if (!overlay?.records?.length) {
    const breadth = await loadBreadth()
    if (!breadth) return null
    return {
      meta: breadth.meta,
      composite: breadth.sentiment,
      signals: [],
    }
  }
  const signals = recordsToSignals(overlay.records)
  const spreads = signals.map((s) => s.spread).filter((v): v is number => v != null)
  const avg = spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0
  const score = (avg / 10).toFixed(1)
  const n = Number(score)
  const prefix = n >= 0 ? '+' : ''
  let label = 'neutral · no trigger'
  if (n >= 0.3) label = 'bullish · watch longs'
  else if (n <= -0.3) label = 'bearish · caution'
  return {
    meta: metaFromSource(overlay.source_file),
    composite: { score: `${prefix}${score}`, label },
    signals,
  }
}

export async function loadOverwatch(): Promise<OverwatchResponse | null> {
  const perf = await fetchOverlayFile('combined_performance_report.csv')
  if (!perf?.records?.length) return null
  const alerts = parseForwardTestingRows(perf.records)
  const perfRows = perf.records
    .map(performanceRecordToRow)
    .filter((r): r is NonNullable<typeof r> => r != null)
  const avgBt =
    perfRows.length > 0
      ? perfRows.reduce((a, r) => a + r.avg_backtested_win_rate, 0) / perfRows.length
      : 0
  const avgFwd =
    perfRows.length > 0
      ? perfRows.reduce((a, r) => a + r.win_percentage, 0) / perfRows.length
      : 0

  const functionHealth = perf.records
    .filter((r) => String(r.Function ?? '') === 'Forward Testing')
    .slice(0, 12)
    .map((r) => {
      const fwd = parsePercentValue(r['Win Percentage'])
      const bt = parsePercentValue(r['Avg Backtested Win Rate [%]'])
      const name = `${String(r.Strategy ?? '')} · ${String(r['Signal Type'] ?? '')}`
      return {
        name: name.toUpperCase(),
        status: (fwd < bt - 10 ? 'degrading' : 'healthy') as 'healthy' | 'degrading',
        bt_wr: bt,
        fwd_wr: fwd,
        trades: Number(r['Total Analysed Trades'] ?? 0),
        note:
          fwd < bt - 10
            ? `${fwd}% forward vs ${bt}% backtest — gap exceeds 10pp watchpoint.`
            : undefined,
      }
    })

  const top = alerts[0]
  const ytd = await mindwealthFetch<{
    forced_portfolio_ytd?: number
  }>('/analytics/portfolio-ytd')

  return {
    meta: metaFromSource(perf.source_file),
    alerts,
    count: alerts.length,
    message: top
      ? `${top.strategy} ${top.signal_type.toLowerCase()} degradation`
      : 'No degradation alerts',
    kpis: {
      backtest_wr: Math.round(avgBt * 10) / 10,
      forward_wr: Math.round(avgFwd * 10) / 10,
      forced_portfolio_ytd: Math.round((ytd?.forced_portfolio_ytd ?? 0) * 100) / 100,
    },
    function_health: functionHealth,
    system_logs: [
      {
        id: 'api-health',
        type: 'ok',
        text: 'MindWealth API connected — trade store CSVs loaded via conviction overlay-file.',
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        tag: 'DATA',
      },
    ],
  }
}

async function loadSigmaKpi(): Promise<string> {
  const sigma = await mindwealthFetch<{
    records?: Record<string, unknown>[]
  }>('/analytics/sigma')
  const raw = sigma?.records?.[0]?.['Sigmashell, Success Rate of Past Analysis [%]']
  if (raw == null) return '—'
  const s = String(raw)
  const m = s.match(/(-?[\d.]+)/)
  if (!m) return '—'
  const n = Number(m[1])
  return Number.isFinite(n) ? `${n}σ` : '—'
}

function ssiTriggerLabel(level: number): string {
  if (level < -0.6) return 'bullish · long trigger active'
  if (level > 0.85) return 'bearish · short trigger active'
  return 'neutral · no trigger'
}

async function loadSsiKpi(): Promise<{ score: string; label: string } | null> {
  const layers = await mindwealthFetch<{
    composite?: { ssi_level?: number | null }
  }>('/analytics/sentiment/layers')
  const level = layers?.composite?.ssi_level
  if (level == null || !Number.isFinite(Number(level))) return null
  const n = Number(level)
  const prefix = n >= 0 ? '+' : ''
  return {
    score: `${prefix}${n.toFixed(2)}`,
    label: ssiTriggerLabel(n),
  }
}

function macroComboAlertCount(nightly: Awaited<ReturnType<typeof loadRunicNightly>>): number {
  if (!nightly) return 0
  return nightly.active_combos.length + nightly.watch_combos.length
}

export async function loadDashboard(): Promise<DashboardResponse | null> {
  const [outstanding, performance, breadth, overwatch, sigmaKpi, ssiKpi, nightly] = await Promise.all([
    loadOutstandingSignals(),
    loadPerformance(),
    loadBreadth(),
    loadOverwatch(),
    loadSigmaKpi(),
    loadSsiKpi(),
    loadRunicNightly(),
  ])
  if (!outstanding) return null

  const sigmaDisplay = nightly?.nfci_sigma ?? sigmaKpi
  const macroAlertCount = macroComboAlertCount(nightly)
  const macroAlertMessage =
    formatPersistenceSignals(nightly?.persistence_signals)
    || nightly?.dominant_reason?.trim()
    || overwatch?.message
    || 'No active macro signals'

  const signals = outstanding.signals
  const topSignals = [...signals]
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 6)
    .map(signalToTopSignal)

  const degraded = overwatch?.alerts[0]
  const functionsSidebar = (performance?.rows ?? [])
    .slice(0, 8)
    .map((r) => ({
      name: r.function,
      subtitle: `${r.win_percentage.toFixed(1)}% WR`,
      status: (r.win_percentage >= r.avg_backtested_win_rate - 10 ? 'green' : 'red') as
        | 'green'
        | 'red',
    }))

  const longAvg = outstanding.summary.long_pct
  const winRateChart = performance?.rows?.length
    ? buildWinRateChart(performance.rows, performance.meta ?? outstanding.meta)
    : undefined

  return {
    meta: outstanding.meta,
    kpis: {
      avg_win_rate: performance?.aggregates?.avg_win_rate ?? longAvg,
      avg_win_rate_display: `${performance?.aggregates?.avg_win_rate ?? longAvg}%`,
      win_rate_mom: 0,
      win_rate_mom_display: 'live from trade store',
      outstanding_count: outstanding.signals.length,
      new_today: (await loadSignalCounts())?.new ?? 0,
      sentiment_score: ssiKpi?.score ?? breadth?.sentiment.score ?? '+0.0',
      sentiment_label: ssiKpi?.label ?? breadth?.sentiment.label ?? 'neutral · no trigger',
      overwatch_count: macroAlertCount || overwatch?.count || 0,
      overwatch_message: macroAlertMessage,
      sigma: sigmaDisplay,
    },
    top_signals: topSignals,
    functions_sidebar: functionsSidebar,
    degraded_strategy: degraded?.strategy ?? null,
    analyst_snippet:
      topSignals.length > 0
        ? `${topSignals[0].ticker} leads active book on ${topSignals[0].function} (${topSignals[0].win_rate_display} backtest WR). ${outstanding.summary.long} long / ${outstanding.summary.short} short outstanding.`
        : 'No outstanding signals in latest trade store report.',
    win_rate_chart: winRateChart,
    regime: breadth
      ? {
          items: breadth.rows.slice(0, 5).map((r) => ({
            label: r.function,
            pct: r.bullish_signal_percentage,
          })),
        }
      : undefined,
  }
}

async function latestOverlayDateWithScoreSheet(): Promise<string | null> {
  const dates = await mindwealthFetch<string[]>('/conviction/overlays/dates')
  if (!dates?.length) return null
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i]
    const sheet = await mindwealthFetch<{ records?: Record<string, unknown>[] }>(
      `/conviction/overlays/${date}/score-sheet`,
    )
    if (sheet?.records?.length) return date
  }
  return dates[dates.length - 1] ?? null
}

export async function loadConviction(): Promise<ConvictionResponse | null> {
  if (!isBackendConfigured()) return null
  const reportDate = await latestOverlayDateWithScoreSheet()
  if (!reportDate) return null

  const [summary, sheet, tickers, alerts] = await Promise.all([
    mindwealthFetch<Record<string, number>>(`/conviction/overlays/${reportDate}/summary`),
    mindwealthFetch<{ records: Record<string, unknown>[] }>(
      `/conviction/overlays/${reportDate}/score-sheet`,
    ),
    mindwealthFetch<TickerSummary[]>('/conviction/tickers?limit=500&fields=summary'),
    mindwealthFetch<{ alerts: Record<string, string[]> }>('/conviction/alerts/daily'),
  ])

  const records = sheet?.records ?? []
  const tickerMap = new Map((tickers ?? []).map((t) => [t.ticker, t]))

  const signalRows: ConvictionSignalRow[] = await Promise.all(
    records.map(async (rec) => {
      const t = String(rec.ticker ?? parseSymbolField(String(rec[SYM_COL] ?? '')).symbol)
      let full = await mindwealthFetch<TickerFull>(`/conviction/tickers/${encodeURIComponent(t)}`)
      if (!full) full = (tickerMap.get(t) as TickerFull | undefined) ?? null
      return scoreRecordToRow(rec, full)
    }),
  )

  const applicable = (tickers ?? []).filter((t) => t.asset_type === 'EQUITY')
  const scores = applicable.map((t) => Number(t.conviction_score ?? 0))
  const yieldTrapTickers = applicable
    .filter((t) => t.yield_trap_warning)
    .map((t) => t.ticker)

  const verdictCounts = { max: 0, tactical: 0, reduced: 0, cancel: 0 }
  for (const row of signalRows) {
    if (row.verdict === 'MAX CONVICTION') verdictCounts.max++
    else if (row.verdict === 'TACTICAL') verdictCounts.tactical++
    else if (row.verdict === 'REDUCED') verdictCounts.reduced++
    else verdictCounts.cancel++
  }
  const total = signalRows.length || 1
  const health: ConvictionHealth = {
    breakdown: {
      max: { count: verdictCounts.max, pct: Math.round((verdictCounts.max / total) * 100) },
      tactical: {
        count: verdictCounts.tactical,
        pct: Math.round((verdictCounts.tactical / total) * 100),
      },
      reduced: {
        count: verdictCounts.reduced,
        pct: Math.round((verdictCounts.reduced / total) * 100),
      },
      cancel: { count: verdictCounts.cancel, pct: Math.round((verdictCounts.cancel / total) * 100) },
    },
    yieldTraps: yieldTrapTickers.length,
    yieldTrapTickers,
    avgConviction:
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0,
    avgRange: {
      min: scores.length ? Math.min(...scores) : 0,
      max: scores.length ? Math.max(...scores) : 0,
    },
    equityCount: applicable.length,
    businessTypes: buildBusinessTypeBreakdown(applicable),
  }

  if (summary) {
    health.breakdown.max.count = Number(summary.max_conviction ?? verdictCounts.max)
    health.yieldTraps = Number(summary.yield_traps ?? health.yieldTraps)
  }

  const contradictions: ConvictionContradiction[] = []
  const alertMap = alerts?.alerts ?? {}
  for (const [ticker, flags] of Object.entries(alertMap)) {
    if (!flags.includes('low_conviction')) continue
    const row = signalRows.find((r) => r.ticker === ticker)
    if (!row || row.verdict === 'MAX CONVICTION') continue
    contradictions.push({
      id: `alert-${ticker}`,
      kind: 'warning',
      ticker,
      body: `Daily alert: ${flags.join(', ')}. Quant signal active on ${row.function} but conviction is ${row.verdict} (score ${row.convictionScore ?? '—'}). Review sizing (${row.sizeModifier}).`,
    })
  }

  const portfolio: ConvictionPortfolioCard[] = signalRows
    .filter((r) => r.isEquity && r.convictionScore != null && r.convictionScore >= 2)
    .slice(0, 6)
    .map((r) => ({
      ticker: r.ticker,
      name: r.ticker,
      businessType: (r.detail?.businessType?.split('/')[0]?.trim() ?? 'compounder') as
        | 'compounder'
        | 'saas'
        | 'income'
        | 'cyclical',
      mtm: '—',
      mtmPositive: true,
      convictionScore: r.convictionScore ?? 0,
      verdict: r.verdict,
      borderClass: r.yieldTrap ? 'review' : r.convictionScore != null && r.convictionScore >= 5 ? 'hold' : 'monitor',
      actionNote: r.detail?.verdictNote || `${r.verdict} — ${r.sizeModifier} size`,
      actionColor: r.yieldTrap ? '#c0392b' : '#27ae60',
    }))

  const convictionStoreDate = latestTickerDailyDate(tickers ?? [])
  const overlaySignalsDate = reportDate
  // Streamlit reads conviction_store live (daily); overlay score-sheet may lag trade_store batch.
  const asOf =
    convictionStoreDate && convictionStoreDate > overlaySignalsDate
      ? convictionStoreDate
      : overlaySignalsDate

  return {
    asOf,
    storeLive: true,
    health,
    signals: signalRows,
    portfolio,
    contradictions: contradictions.slice(0, 8),
  }
}

function latestTickerDailyDate(tickers: TickerSummary[]): string | null {
  let latest: string | null = null
  for (const t of tickers) {
    const raw = t.last_daily_update
    if (!raw) continue
    const day = raw.slice(0, 10)
    if (!latest || day > latest) latest = day
  }
  return latest
}

function buildBusinessTypeBreakdown(tickers: TickerSummary[]) {
  const colors: Record<string, string> = {
    compounder: '#27ae60',
    saas: '#3498db',
    income: '#e67e22',
    cyclical: '#888888',
  }
  const counts = new Map<string, number>()
  for (const t of tickers) {
    const bt = (t.business_type ?? 'other').split(/[\s/]/)[0]
    counts.set(bt, (counts.get(bt) ?? 0) + 1)
  }
  return [...counts.entries()].map(([type, count]) => ({
    type: type as 'compounder' | 'saas' | 'income' | 'cyclical',
    count,
    color: colors[type] ?? '#888888',
  }))
}

export async function loadChatSessions(): Promise<ChatSessionsResponse | null> {
  const sessions = await mindwealthFetch<
    Array<{
      session_id: string
      title?: string
      last_updated?: string
      message_count?: number
    }>
  >('/chatbot/sessions?limit=50')
  if (!sessions) return null
  return {
    sessions: sessions.map((s) => ({
      session_id: s.session_id,
      title: s.title ?? 'Chat',
      last_updated: s.last_updated ?? '',
      message_count: s.message_count ?? 0,
    })),
  }
}

async function pollChatJob(jobId: string, timeoutMs: number): Promise<ChatResponse | null> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const job = await mindwealthFetch<{
      status: string
      session_id?: string
      error?: string
      result?: { content?: string; metadata?: Record<string, unknown> }
    }>(`/chatbot/jobs/${jobId}`)
    if (!job) return null
    if (job.status === 'completed' && job.result?.content) {
      return {
        session_id: job.session_id ?? '',
        reply: job.result.content,
        metadata: job.result.metadata,
      }
    }
    if (job.status === 'failed') {
      return {
        session_id: job.session_id ?? '',
        reply: '',
        error: job.error ?? 'Chat job failed',
        metadata: job.result?.metadata,
      }
    }
    await new Promise((r) => setTimeout(r, 2500))
  }
  return null
}

export async function sendChatMessage(body: ChatRequest): Promise<ChatResponse | null> {
  let sessionId = body.session_id ?? null
  if (!sessionId) {
    const created = await mindwealthFetch<{ session_id: string }>('/chatbot/sessions', {
      method: 'POST',
      body: {},
    })
    sessionId = created?.session_id ?? null
  }
  if (!sessionId) return null

  const config = await mindwealthFetch<{ limits?: { deep_research_total_timeout_seconds?: number } }>(
    '/chatbot/config',
  )
  const timeoutSec = config?.limits?.deep_research_total_timeout_seconds ?? 120

  const preset = body.signal_types?.includes('breadth')
    ? 'breadth'
    : body.assets?.length
      ? 'analyze_asset'
      : body.signal_types?.length
        ? 'signal_insights'
        : 'freeform'

  const enqueue = await mindwealthFetch<{ job_id: string; session_id?: string }>(
    `/chatbot/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      body: {
        message: body.message,
        preset,
        signal_types: body.signal_types ?? [],
        assets: body.assets ?? [],
        from_date: body.from_date,
        to_date: body.to_date,
        functions: body.functions ?? [],
        is_followup: body.is_followup ?? false,
      },
    },
  )

  if (!enqueue?.job_id) return null
  const result = await pollChatJob(enqueue.job_id, (timeoutSec + 30) * 1000)
  if (!result) return null
  return { ...result, session_id: result.session_id || sessionId }
}

export async function loadShortlist(): Promise<ShortlistResponse | null> {
  const report = await mindwealthFetch<{
    report_date?: string
    markdown?: string
    row_count?: number
    records?: Record<string, string>[]
  }>('/signals/shortlist')

  if (report?.markdown) {
    const meta = baseMeta()
    if (report.report_date) {
      meta.data_updated_at = {
        date: report.report_date,
        time: '00:00:00',
        datetime: `${report.report_date}T00:00:00Z`,
        timezone: 'UTC',
      }
    }
    return {
      meta,
      count: report.row_count ?? report.records?.length ?? 0,
      report_text: report.markdown,
      rows: report.records,
    }
  }

  const newSig = await loadNewSignals()
  if (!newSig?.signals.length) return null
  return {
    meta: newSig.meta,
    count: newSig.signals.length,
    report_text: `Cross-confirmed new signals (${newSig.signals.length}) from latest new_signal.csv overlay.`,
    rows: newSig.signals.map((s) => ({
      symbol: s.symbol,
      function: s.function,
      interval: s.interval,
      signal_type: s.signal_type,
    })),
  }
}

const PORTFOLIO_NOTIONAL = 500_000
const CLUSTER_COLORS = [
  'var(--green)',
  'var(--blue)',
  '#e67e22',
  'var(--teal)',
  '#9b59b6',
  '#1abc9c',
  '#e74c3c',
]

function clusterForSymbol(symbol: string, fn: string): string {
  const s = symbol.toUpperCase()
  if (s.endsWith('.NS') || s.endsWith('.BO')) return 'india'
  if (s.endsWith('.HK')) return 'asia_ex_japan'
  if (s.endsWith('.TO')) return 'canada_def'
  if (['SPY', 'QQQ', 'IWM', 'VTI'].includes(s)) return 'global_risk_on'
  if (['XLF', 'JPM', 'BAC', 'GS'].includes(s)) return 'financials'
  if (['NVDA', 'AMD', 'ASML', 'TSM', 'AAPL', 'MSFT'].includes(s)) return 'semiconductors'
  const f = fn.toLowerCase()
  if (f.includes('delta')) return 'commodities'
  return 'us_tech'
}

function parseMtmPct(raw: unknown): number {
  if (raw == null) return 0
  const m = String(raw).match(/(-?[\d.]+)%/)
  return m ? Number(m[1]) : 0
}

export async function loadPortfolio(): Promise<PortfolioResponse | null> {
  const [longBook, shortBook, layers, variables] = await Promise.all([
    mindwealthFetch<{ records?: Record<string, unknown>[] }>('/virtual-trading/long'),
    mindwealthFetch<{ records?: Record<string, unknown>[] }>('/virtual-trading/short'),
    mindwealthFetch<{ composite?: { ssi_multiplier?: number } }>('/analytics/sentiment/layers'),
    mindwealthFetch<{ regime?: Record<string, unknown>; variables_dashboard?: Array<{ variable?: string; current?: number }> }>(
      '/macro/runic/variables/current',
    ),
  ])

  type VtRow = Record<string, unknown> & { _side: 'Long' | 'Short' }
  const openLong = (longBook?.records ?? []).filter((r) => String(r.Status ?? '').toLowerCase() === 'open')
  const openShort = (shortBook?.records ?? []).filter((r) => String(r.Status ?? '').toLowerCase() === 'open')
  const openAll: VtRow[] = [
    ...openLong.map((r) => ({ ...r, _side: 'Long' as const })),
    ...openShort.map((r) => ({ ...r, _side: 'Short' as const })),
  ]

  if (!openAll.length) return null

  const vixVar = variables?.variables_dashboard?.find(
    (v) => String(v.variable ?? '').toUpperCase() === 'VIX',
  )
  const vix = vixVar?.current != null ? Number(vixVar.current) : 16
  const valRegime = String(variables?.regime?.val_regime ?? 'NORMAL')
  const maxDeploy = valRegime === 'EXTREME' ? 70 : 80
  const ssiMult = layers?.composite?.ssi_multiplier ?? 1
  const creditAdj = vix > 25 ? 0.85 : vix > 20 ? 0.9 : 1
  const finalCeiling = Math.round(maxDeploy * ssiMult * creditAdj)
  const deployPct = Math.min(finalCeiling, 85)
  const deployedTotal = Math.round((PORTFOLIO_NOTIONAL * deployPct) / 100)
  const perPosition = Math.round(deployedTotal / openAll.length)

  const clusterTotals = new Map<string, number>()
  const positions = openAll.slice(0, 24).map((r) => {
    const ticker = String(r.Symbol ?? '—')
    const fn = String(r.Function ?? '')
    const cluster = clusterForSymbol(ticker, fn)
    clusterTotals.set(cluster, (clusterTotals.get(cluster) ?? 0) + 1)
    const wr = parsePercentValue(r['Backtested Win Rate [%]'])
    const profit = parseMtmPct(r['Realised/Unrealised Profit'])
    const excluded = profit < -15 || wr < 60
    return {
      cluster,
      ticker,
      direction: r._side,
      meta: `${fn} · ${String(r.Interval ?? '')} · WR ${wr.toFixed(1)}% · MTM ${profit.toFixed(1)}%`,
      dollar: excluded ? 0 : perPosition,
      pct: excluded ? 0 : Math.round((perPosition / PORTFOLIO_NOTIONAL) * 1000) / 10,
      excluded,
    }
  })

  const activeClusters = [...clusterTotals.entries()]
  const clusterSum = activeClusters.reduce((a, [, n]) => a + n, 0) || 1
  const clusters = activeClusters.map(([id, count], i) => ({
    id,
    pct: Math.round((count / clusterSum) * deployPct),
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
  }))

  const actualDeployed = positions.reduce((a, p) => a + p.dollar, 0)
  const cash = PORTFOLIO_NOTIONAL - actualDeployed

  return {
    meta: baseMeta(),
    regime: {
      vix: Math.round(vix * 10) / 10,
      vix_pct: Math.min(99, Math.round(vix * 2.5)),
      regime: valRegime,
      max_deploy: maxDeploy,
      ssi_multiplier: ssiMult,
      credit_adj: creditAdj,
      final_ceiling: finalCeiling,
      cash_pct: Math.round((cash / PORTFOLIO_NOTIONAL) * 100),
    },
    clusters,
    positions,
    totals: {
      deployed: actualDeployed,
      deployed_pct: Math.round((actualDeployed / PORTFOLIO_NOTIONAL) * 100),
      cash,
      cash_pct: Math.round((cash / PORTFOLIO_NOTIONAL) * 100),
      idle_cash_yield: 3.5,
    },
  }
}

export async function loadMonitoredTrades(): Promise<MonitoredTradesResponse | null> {
  const trades = await mindwealthFetch<
    Array<{
      Trade_ID?: string
      Symbol?: string
      Function?: string
      Interval?: string
      Signal_Type?: string
      Signal_Date?: string
      Signal_Price?: number
      Current_Price?: number
      Last_Updated?: string
      Exit_Date?: string | null
      Raw_Data?: Record<string, unknown>
    }>
  >('/monitored-trades')

  if (!trades?.length) return null

  const mapped = trades.map((t) => {
    const signalPrice = Number(t.Signal_Price ?? 0)
    const currentPrice = Number(t.Current_Price ?? signalPrice)
    const mtmRaw = t.Raw_Data?.['Current Mark to Market and Holding Period']
    const mtmPct = parseMtmPct(mtmRaw)
    const holdMatch = mtmRaw != null ? String(mtmRaw).match(/(\d+)\s*days?/i) : null
    const priceChange =
      signalPrice > 0 ? Math.round(((currentPrice - signalPrice) / signalPrice) * 1000) / 10 : 0

    return {
      trade_id: String(t.Trade_ID ?? `${t.Symbol}_${t.Signal_Date}`),
      symbol: String(t.Symbol ?? ''),
      function: String(t.Function ?? ''),
      interval: String(t.Interval ?? ''),
      signal_type: String(t.Signal_Type ?? ''),
      signal_date: String(t.Signal_Date ?? ''),
      signal_price: signalPrice,
      current_price: currentPrice,
      price_change_pct: priceChange,
      holding_period_days: holdMatch ? Number(holdMatch[1]) : 0,
      mark_to_market: mtmPct,
      status: t.Exit_Date ? 'closed' : 'open',
    }
  })

  const lastUpdated =
    trades
      .map((t) => t.Last_Updated)
      .filter(Boolean)
      .sort()
      .pop() ?? new Date().toISOString()

  return {
    meta: baseMeta(),
    last_updated: String(lastUpdated),
    trades: mapped,
  }
}

export async function loadRunicNightly() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/nightly')
  return raw ? mapRunicNightly(raw) : null
}

export async function loadRunicVariables() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/variables/current')
  return raw ? mapRunicVariables(raw) : null
}

export async function loadRunicCancelTracker() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/nightly')
  return raw ? mapRunicCancelTracker(raw) : null
}

export async function loadRunicAnalog(combo: string) {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/nightly')
  if (!raw) return null
  return mapRunicAnalog(combo.toUpperCase(), raw)
}
