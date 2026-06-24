import type {
  ApiMeta,
  BreadthResponse,
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  ChatSessionsResponse,
  CombinedPerformanceReportResponse,
  CombinedPerformanceReportRow,
  CheckDegradationResponse,
  DashboardResponse,
  HorizontalNewHighResponse,
  MonitoredTradesResponse,
  OverwatchResponse,
  PerformanceResponse,
  PortfolioAnalyzeRequest,
  PortfolioAnalyzeResponse,
  PortfolioResponse,
  PortfolioRiskResponse,
  PortfolioScenario,
  PortfolioTickerSearchResult,
  SentimentResponse,
  ShortlistResponse,
  SignalCountsResponse,
  SignalSurfaceResponse,
  SignalSummaryResponse,
  SignalsListResponse,
  StrategyHealthResponse,
  GateA2bResponse,
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
  avgCagrFromGateA2b,
  parseForwardTestingRows,
  parsePercentValue,
  parseSymbolField,
  recordToSignal,
  recordsToSignals,
  signalToTopSignal,
  normalizeShortlistRecord,
  shortlistRowsToSignals,
} from './signal-parsers'
import {
  computeWrAggregatesFromRows,
  computeWrAggregatesFromSignals,
  resolveWrAggregates,
} from '~/utils/performance-aggregates'
import { formatPersistenceSignals } from '~/utils/runic-regime'
import { buildWinRateChart } from '~/utils/win-rate-chart'
import { UNAVAILABLE_COMPUTE } from '~/constants/unavailable'
import { baseMeta } from './meta'
import { mapSentimentLayers } from './sentiment-mapper'
import {
  buildActiveCombos,
  buildMacroOverride,
  buildMultiSigTickers,
  buildPortfolioCeiling,
  buildPortfolioResponse,
  filterOpenVtRows,
  indexConvictionByTicker,
  mapPortfolioRiskResponse,
  mapPortfolioSizerResponse,
  mapVtRowToAllocationRow,
  mapVtRowToPnlRow,
  parseVtMtmPct,
} from './portfolio-mappers'
import {
  mapMacroAnalogTable,
  mapMacroCancelTracker,
  mapMacroCombos,
  mapMacroDataFreshness,
  mapMacroNarrative,
  mapMacroOverviewKpis,
  mapMacroPersistence,
  mapMacroRegime,
  mapMacroSsiMultiplier,
  mapMacroSsiSummary,
  mapMacroStatus,
  mapMacroVariablesHeatmap,
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

type ValuationTaxBreakdown = {
  components?: Record<string, number>
  total?: number
}

type TickerFull = TickerSummary & {
  bq_components?: Array<{ name?: string; score?: number; source?: string }>
  fd_votes?: Record<string, { vote?: string; rationale?: string }> | Array<{ label?: string; direction?: string }>
  valuation_tax?: number
  valuation_tax_breakdown?: ValuationTaxBreakdown
  oey?: number
  pe_percentile?: number
  pe_fwd?: number
  rationale?: string
  verdict?: string
  sizing_pct?: number
}

function formatValuationTaxBreakdown(
  breakdown: ValuationTaxBreakdown | undefined,
  fallbackTotal?: number | null,
): string {
  const components = breakdown?.components
  if (components && typeof components === 'object') {
    const lines = Object.entries(components)
      .filter(([, val]) => Number(val) !== 0)
      .map(([key, val]) => {
        const n = Number(val)
        const label = key.replace(/_/g, ' ')
        const signed = n > 0 ? `+${n}` : String(n)
        return `${label}: ${signed}`
      })
    const total = breakdown.total ?? fallbackTotal
    if (lines.length) {
      const parts = [...lines]
      if (total != null && Number.isFinite(Number(total))) {
        const n = Number(total)
        parts.push(`total: ${n > 0 ? '+' : ''}${n}`)
      }
      return parts.join(' · ')
    }
  }
  if (fallbackTotal != null && Number.isFinite(Number(fallbackTotal))) {
    const n = Number(fallbackTotal)
    return `total: ${n > 0 ? '+' : ''}${n}`
  }
  return ''
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

function formatFdVoteKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseFdVoteEntry(
  key: string,
  val: unknown,
): ConvictionSignalDetail['fdVotes'][number] | null {
  const name = formatFdVoteKey(key)
  if (val == null) return null
  if (typeof val === 'string') {
    return {
      label: `${name}: ${val}`,
      direction: normalizeFd(val) ?? 'stable',
    }
  }
  if (typeof val === 'object') {
    const obj = val as {
      vote?: string
      direction?: string
      rationale?: string
      label?: string
    }
    const direction = normalizeFd(obj.vote ?? obj.direction ?? obj.label) ?? 'stable'
    const rationale = obj.rationale?.trim()
    const label = rationale ? `${name}: ${rationale}` : name
    return { label, direction, rationale }
  }
  return { label: name, direction: 'stable' }
}

function parseFdVotes(raw: unknown): ConvictionSignalDetail['fdVotes'] {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => {
        const obj = v as {
          label?: string
          direction?: string
          vote?: string
          rationale?: string
        }
        const direction = normalizeFd(obj.vote ?? obj.direction) ?? 'stable'
        const label = String(obj.label ?? obj.rationale ?? '').trim()
        if (!label) return null
        return {
          label,
          direction,
          rationale: obj.rationale,
        }
      })
      .filter((v): v is ConvictionSignalDetail['fdVotes'][number] => v != null)
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>)
      .map(([key, val]) => parseFdVoteEntry(key, val))
      .filter((v): v is ConvictionSignalDetail['fdVotes'][number] => v != null)
  }
  return []
}

function tickerToDetail(t: TickerFull, rec?: Record<string, unknown>): ConvictionSignalDetail {
  const valuationTax =
    t.valuation_tax != null
      ? Number(t.valuation_tax)
      : rec?.valuation_tax != null
        ? Number(rec.valuation_tax)
        : 0

  return {
    ticker: t.ticker,
    businessType: String(t.business_type ?? rec?.business_type ?? ''),
    bq: Number(t.bq_raw ?? rec?.bq_raw ?? 0),
    tax: valuationTax,
    conviction: Number(t.conviction_score ?? rec?.conviction_score ?? 0),
    fsClass: normalizeFsClass(String(t.fs_class ?? rec?.fs_class)) ?? 'moderate',
    fdDirection: normalizeFd(String(t.fd_direction ?? rec?.fd_direction)) ?? 'stable',
    yieldTrap: Boolean(t.yield_trap_warning ?? rec?.yield_trap_warning),
    dimensions: parseBqComponents(t.bq_components),
    oey: Number(t.oey ?? 0),
    oeyFloorLabel: '',
    pe: Number(t.pe_fwd ?? 0),
    pePercentile: Number(t.pe_percentile ?? 0),
    fdVotes: parseFdVotes(t.fd_votes ?? rec?.fd_votes),
    fdSummary: '',
    taxNote: formatValuationTaxBreakdown(t.valuation_tax_breakdown, valuationTax),
    verdictNote: String(rec?.rationale ?? t.rationale ?? ''),
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
  const detail = ticker || rec.rationale != null || rec.valuation_tax != null
    ? tickerToDetail(
        ticker ? { ...ticker, ticker: sym.symbol } : { ticker: sym.symbol },
        rec,
      )
    : undefined

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

export async function loadAllSignals(): Promise<SignalsListResponse | null> {
  function fromRecords(
    records: Record<string, unknown>[],
    sourceFile?: string,
    reportDate?: string,
  ): SignalsListResponse {
    const signals = recordsToSignals(records)
    const functionCounts = Object.entries(
      signals.reduce<Record<string, number>>((acc, s) => {
        const k = s.function.toUpperCase()
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {}),
    ).map(([name, count]) => ({ name, count }))

    const meta = metaFromSource(sourceFile)
    if (reportDate) {
      meta.data_updated_at = {
        date: reportDate,
        time: '00:00:00',
        datetime: `${reportDate}T00:00:00Z`,
        timezone: 'UTC',
      }
    }

    return {
      meta,
      summary: buildSignalsSummary(signals),
      signals,
      function_counts: functionCounts,
    }
  }

  const report = await mindwealthFetch<{
    report_date?: string
    source_file?: string
    records?: Record<string, unknown>[]
  }>('/signals/reports/all-signal/latest')
  if (report?.records?.length) {
    return fromRecords(report.records, report.source_file, report.report_date)
  }

  const overlay = await fetchOverlayFile('all_signal.csv')
  if (overlay?.records?.length) {
    return fromRecords(overlay.records, overlay.source_file)
  }

  const surface = await loadSignalSurface('all-signal')
  if (surface?.records?.length) {
    return fromRecords(
      surface.records as Record<string, unknown>[],
      surface.source_file,
      surface.report_date,
    )
  }

  return null
}

export async function loadHorizontalNewHigh(): Promise<HorizontalNewHighResponse | null> {
  const raw = await mindwealthFetch<{
    report_date?: string
    source_file?: string
    row_count?: number
    records?: Record<string, unknown>[]
  }>('/signals/reports/horizontal-new-high/latest')
  if (!raw?.records?.length) return null

  return {
    meta: metaFromSource(raw.source_file),
    report_date: raw.report_date,
    row_count: raw.row_count ?? raw.records.length,
    rows: raw.records.map((rec) => ({
      report_type: String(rec['Report Type'] ?? ''),
      symbol: String(rec.Symbol ?? ''),
      today_price: String(rec['Today price'] ?? rec['Today Price'] ?? ''),
      new_highest: String(rec['New Highest'] ?? rec['New highest'] ?? ''),
    })),
  }
}

function combinedPerformanceRowFromRecord(
  rec: Record<string, unknown>,
  section: CombinedPerformanceReportRow['section'],
): CombinedPerformanceReportRow | null {
  const fn = String(rec.Function ?? '')
  if (section === 'forward_testing' && fn !== 'Forward Testing') return null
  if (section === 'latest_performance' && fn !== 'Latest Performance') return null

  const strategy =
    section === 'forward_testing'
      ? String(rec.Strategy ?? '')
      : String(rec.Strategy ?? 'LATEST_PERFORMANCE').replace(/_/g, ' ')
  const profitField = String(rec['Profit [%] (Max/Min/Avg.)'] ?? '')
  const profits = profitField.match(/([\d.-]+)%/g)?.map((p) => Number(p.replace('%', ''))) ?? []
  const holding = String(rec['Holding Period (days) (Max/Min/Avg)'] ?? '')
  const holdDays = holding.match(/([\d.]+)\s*days?/gi)?.map((d) => Number(d.replace(/[^\d.]/g, ''))) ?? []

  return {
    section,
    strategy,
    interval: String(rec.Interval ?? ''),
    signal_type: String(rec['Signal Type'] ?? 'Long'),
    total_trades: Number(rec['Total Analysed Trades'] ?? 0),
    win_percentage: parsePercentValue(rec['Win Percentage']),
    avg_backtested_win_rate: parsePercentValue(rec['Avg Backtested Win Rate [%]']),
    best_profit: profits[0],
    worst_profit: profits[1],
    avg_profit: profits[2],
    max_holding_days: holdDays[0],
    min_holding_days: holdDays[1],
    avg_holding_days: holdDays[2],
  }
}

export async function loadCombinedPerformanceReport(): Promise<CombinedPerformanceReportResponse | null> {
  const raw = await mindwealthFetch<PerformanceApiResponse>('/analytics/performance')
  if (!raw?.records?.length) return null

  const forward_testing = raw.records
    .map((rec) => combinedPerformanceRowFromRecord(rec, 'forward_testing'))
    .filter((r): r is CombinedPerformanceReportRow => r != null)
  const latest_performance = raw.records
    .map((rec) => combinedPerformanceRowFromRecord(rec, 'latest_performance'))
    .filter((r): r is CombinedPerformanceReportRow => r != null)

  const apiAggregates = parsePerformanceApiAggregates(raw)
  const fromRows = computeWrAggregatesFromRows(
    forward_testing.map((r) => ({
      win_percentage: r.win_percentage,
      avg_backtested_win_rate: r.avg_backtested_win_rate,
      total_trades: r.total_trades,
    })),
  )
  const wr = resolveWrAggregates(apiAggregates, fromRows)

  const dateMatch = raw.source_file?.match(/(\d{4}-\d{2}-\d{2})/)

  return {
    meta: metaFromSource(raw.source_file),
    report_date: dateMatch?.[1],
    forward_testing,
    latest_performance,
    aggregates: {
      avg_forward_wr: wr.avg_forward_wr,
      avg_backtest_wr: wr.avg_backtest_wr,
      total_trades: wr.total_trades ?? apiAggregates.total_trades,
      degrading_count: apiAggregates.degrading_count,
    },
  }
}

export async function loadSignalCounts(): Promise<SignalCountsResponse | null> {
  const api = await mindwealthFetch<{
    report_date?: string | null
    outstanding?: { total: number; long: number; short: number; exited?: number; tier_counts?: Record<string, number> }
    new?: { total: number; long: number; short: number; exited?: number; tier_counts?: Record<string, number> }
    shortlist?: { total: number }
  }>('/signals/counts')

  if (api?.outstanding) {
    return {
      outstanding: api.outstanding.total,
      new: api.new?.total ?? 0,
      shortlisted: api.shortlist?.total ?? 0,
      report_date: api.report_date,
      outstanding_detail: api.outstanding,
      new_detail: api.new,
      shortlist_detail: api.shortlist,
    }
  }

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

export type SignalReportSlug = 'outstanding-signals' | 'new-signals' | 'all-signal'

export async function loadSignalSurface(
  report: SignalReportSlug = 'outstanding-signals',
  reportDate?: string,
): Promise<SignalSurfaceResponse | null> {
  const query = new URLSearchParams({ report })
  if (reportDate) query.set('report_date', reportDate)
  return mindwealthFetch<SignalSurfaceResponse>(`/signals/surface?${query.toString()}`)
}

export async function loadSignalSummary(
  report: SignalReportSlug = 'outstanding-signals',
  reportDate?: string,
): Promise<SignalSummaryResponse | null> {
  const query = new URLSearchParams({ report })
  if (reportDate) query.set('report_date', reportDate)
  return mindwealthFetch<SignalSummaryResponse>(`/signals/summary?${query.toString()}`)
}

export async function loadStrategyHealth(reportDate?: string): Promise<StrategyHealthResponse | null> {
  const query = reportDate ? `?report_date=${encodeURIComponent(reportDate)}` : ''
  return mindwealthFetch<StrategyHealthResponse>(`/signals/strategy-health${query}`)
}

export async function loadGateA2b(reportDate?: string): Promise<GateA2bResponse | null> {
  const query = reportDate ? `?report_date=${encodeURIComponent(reportDate)}` : ''
  return mindwealthFetch<GateA2bResponse>(`/signals/gate-a2b${query}`)
}

async function loadAllSignalRecords(): Promise<Record<string, unknown>[]> {
  const report = await mindwealthFetch<{ records?: Record<string, unknown>[] }>(
    '/signals/reports/all-signal/latest',
  )
  if (report?.records?.length) return report.records
  const overlay = await fetchOverlayFile('all_signal.csv')
  return overlay?.records ?? []
}

export async function loadSignalCheckDegradation(): Promise<CheckDegradationResponse | null> {
  return mindwealthFetch<CheckDegradationResponse>('/signals/check-degradation', {
    method: 'POST',
    body: {},
  })
}

function apiAggregateWinRate(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n > 0 && n <= 1) return Math.round(n * 1000) / 10
  return Math.round(n * 10) / 10
}

function apiAggregateTotalTrades(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

type PerformanceApiResponse = {
  source_file?: string
  row_count?: number
  avg_win_rate?: number | null
  avg_backtest_win_rate?: number | null
  total_trades?: number | null
  degrading_count?: number | null
  records?: Record<string, unknown>[]
}

function parsePerformanceApiAggregates(raw: PerformanceApiResponse) {
  return {
    avg_win_rate: apiAggregateWinRate(raw.avg_win_rate),
    avg_backtest_win_rate: apiAggregateWinRate(raw.avg_backtest_win_rate),
    total_trades: apiAggregateTotalTrades(raw.total_trades),
    degrading_count: apiAggregateTotalTrades(raw.degrading_count),
  }
}

function forwardTestingRowToPerformanceRow(row: CombinedPerformanceReportRow): PerformanceRow {
  return {
    function: row.strategy,
    strategy: row.strategy.toUpperCase().replace(/\s+/g, '_'),
    interval: row.interval,
    signal_type: row.signal_type,
    total_trades: row.total_trades,
    win_percentage: row.win_percentage,
    max_holding_days: row.max_holding_days,
    min_holding_days: row.min_holding_days,
    avg_holding_days: row.avg_holding_days,
    best_profit: row.best_profit ?? 0,
    worst_profit: row.worst_profit ?? 0,
    avg_profit: row.avg_profit ?? 0,
    avg_backtested_win_rate: row.avg_backtested_win_rate,
  }
}

export async function loadPerformance(): Promise<PerformanceResponse | null> {
  const [raw, gateA2b, allSignalRecords, shortlist] = await Promise.all([
    mindwealthFetch<PerformanceApiResponse>('/analytics/performance'),
    loadGateA2b(),
    loadAllSignalRecords(),
    loadShortlist(),
  ])
  if (!raw?.records?.length) return null

  const forwardRows = raw.records
    .map((rec) => combinedPerformanceRowFromRecord(rec, 'forward_testing'))
    .filter((r): r is CombinedPerformanceReportRow => r != null)
  const rows = forwardRows.map(forwardTestingRowToPerformanceRow)
  const apiAggregates = parsePerformanceApiAggregates(raw)
  const fromRows = computeWrAggregatesFromRows(rows)
  const fromSignals = computeWrAggregatesFromSignals(shortlist?.signals ?? [])
  const wr = resolveWrAggregates(apiAggregates, fromRows, fromSignals)

  const avgCagr =
    gateA2b?.avg_bt_cagr != null && Number.isFinite(gateA2b.avg_bt_cagr)
      ? Math.round(gateA2b.avg_bt_cagr * 10) / 10
      : gateA2b?.gates?.length
        ? avgCagrFromGateA2b(gateA2b.gates, allSignalRecords)
        : undefined
  const sharpes = raw.records
    .map((rec) => {
      const v = rec['Backtested Strategy Sharpe Ratio']
      const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.-]/g, ''))
      return n
    })
    .filter((n) => Number.isFinite(n) && n !== 0)
  const avgSharpe =
    sharpes.length > 0
      ? Math.round((sharpes.reduce((a, n) => a + n, 0) / sharpes.length) * 100) / 100
      : undefined

  const functionCount = new Set(
    raw.records
      .map((rec) => combinedPerformanceRowFromRecord(rec, 'forward_testing'))
      .filter((r): r is CombinedPerformanceReportRow => r != null)
      .map((r) => r.strategy.toUpperCase().replace(/\s+/g, ' ').trim())
      .filter(Boolean),
  ).size

  return {
    meta: metaFromSource(raw.source_file),
    rows,
    aggregates: {
      avg_win_rate: wr.avg_forward_wr,
      avg_win_rate_source: wr.source,
      avg_backtest_win_rate: wr.avg_backtest_wr,
      avg_cagr: avgCagr,
      total_trades: wr.total_trades ?? apiAggregates.total_trades,
      avg_sharpe: avgSharpe ?? 0,
      function_count: functionCount,
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
  const [perf, shortlist] = await Promise.all([
    mindwealthFetch<PerformanceApiResponse>('/analytics/performance'),
    loadShortlist(),
  ])
  if (!perf?.records?.length) return null
  const alerts = parseForwardTestingRows(perf.records)
  const apiAggregates = parsePerformanceApiAggregates(perf)

  const forwardRows = perf.records
    .map((rec) => combinedPerformanceRowFromRecord(rec, 'forward_testing'))
    .filter((r): r is CombinedPerformanceReportRow => r != null)
    .map(forwardTestingRowToPerformanceRow)
  const fromRows = computeWrAggregatesFromRows(forwardRows)
  const fromSignals = computeWrAggregatesFromSignals(shortlist?.signals ?? [])
  const wr = resolveWrAggregates(apiAggregates, fromRows, fromSignals)

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

  return {
    meta: metaFromSource(perf.source_file),
    alerts,
    count: alerts.length,
    message: top
      ? `${top.strategy} ${top.signal_type.toLowerCase()} degradation`
      : 'No degradation alerts',
    kpis: {
      backtest_wr: wr.avg_backtest_wr,
      forward_wr: wr.avg_forward_wr,
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

  const apiAvgWin = performance?.aggregates?.avg_win_rate ?? null
  const avgWinSource = performance?.aggregates?.avg_win_rate_source
  const winRateChart = performance?.rows?.length
    ? buildWinRateChart(performance.rows, performance.meta ?? outstanding.meta)
    : undefined

  const winRateMomLabel =
    avgWinSource === 'api'
      ? 'from analytics API'
      : avgWinSource === 'signals'
        ? 'from Claude shortlist signals'
        : avgWinSource === 'rows'
          ? 'from forward-testing rows'
          : 'awaiting API aggregate'

  return {
    meta: outstanding.meta,
    kpis: {
      avg_win_rate: apiAvgWin,
      avg_win_rate_display: apiAvgWin != null ? `${apiAvgWin}%` : UNAVAILABLE_COMPUTE,
      win_rate_mom: 0,
      win_rate_mom_display: winRateMomLabel,
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

export async function loadChatHistory(sessionId: string): Promise<ChatHistoryResponse | null> {
  const rows = await mindwealthFetch<
    Array<{
      role: string
      content: string
      timestamp?: string
      metadata?: Record<string, unknown> | null
    }>
  >(`/chatbot/sessions/${sessionId}/history?display=true`)
  if (!rows) return null
  return {
    messages: rows
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata,
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

  const signalTypes = body.selected_signal_types ?? []
  const preset =
    body.preset ??
    (signalTypes.includes('breadth')
      ? 'breadth_analysis'
      : body.assets?.length || body.asset
        ? 'analyze_asset'
        : signalTypes.length
          ? 'signal_insights'
          : 'freeform')

  const enqueue = await mindwealthFetch<{ job_id: string; session_id?: string }>(
    `/chatbot/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      body: {
        message: body.message,
        preset,
        selected_signal_types: signalTypes,
        asset: body.asset ?? null,
        assets: body.assets ?? null,
        from_date: body.from_date ?? null,
        to_date: body.to_date ?? null,
        functions: body.functions ?? null,
        deep_research_enabled: body.deep_research_enabled ?? false,
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
    records?: Array<Record<string, string | number | boolean | null>>
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
    const rawRows = report.records ?? []
    const rows = rawRows.map((r) => normalizeShortlistRecord(r as Record<string, unknown>))
    const signals = shortlistRowsToSignals(rawRows as Record<string, unknown>[])
    return {
      meta,
      count: report.row_count ?? rows.length,
      report_text: report.markdown,
      rows,
      signals,
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
    signals: newSig.signals,
  }
}

export async function loadPortfolioSizer(
  scenario: PortfolioScenario = 'normal',
): Promise<PortfolioResponse | null> {
  try {
    const raw = await mindwealthFetch<Record<string, unknown>>(
      `/portfolio/sizer?scenario=${encodeURIComponent(scenario)}`,
    )
    if (!raw || typeof raw !== 'object') return null
    return mapPortfolioSizerResponse(raw, baseMeta())
  } catch {
    return null
  }
}

async function loadPortfolioLegacy(): Promise<PortfolioResponse | null> {
  const [
    longBook,
    shortBook,
    macroRegime,
    ssiMultiplier,
    variables,
    overviewKpis,
    outstanding,
    conviction,
  ] = await Promise.all([
    mindwealthFetch<{ records?: Record<string, unknown>[] }>('/virtual-trading/long'),
    mindwealthFetch<{ records?: Record<string, unknown>[] }>('/virtual-trading/short'),
    mindwealthFetch<Record<string, unknown>>('/macro/regime'),
    mindwealthFetch<Record<string, unknown>>('/macro/ssi/multiplier'),
    mindwealthFetch<{ regime?: Record<string, unknown>; variables_dashboard?: Array<{ variable?: string; current?: number; percentile?: number }> }>(
      '/macro/runic/variables/current',
    ),
    mindwealthFetch<Record<string, unknown>>('/macro/overview/kpis'),
    loadOutstandingSignals(),
    loadConviction(),
  ])

  const openAll = filterOpenVtRows(longBook, shortBook)
  if (!openAll.length) return null

  const convictionByTicker = indexConvictionByTicker(conviction?.signals ?? [])
  const multiSigTickers = buildMultiSigTickers(
    (outstanding?.signals ?? []).map((s) => ({
      symbol: s.ticker,
      function: s.function,
      direction: s.direction,
    })),
  )

  const allocationRows = openAll.map((row) =>
    mapVtRowToAllocationRow(row, convictionByTicker, multiSigTickers),
  )
  const pnlRows = openAll.map((row) =>
    mapVtRowToPnlRow(row, convictionByTicker, multiSigTickers),
  )

  const ceiling = buildPortfolioCeiling({ macroRegime, ssiMultiplier, variables })
  const macroOverride = buildMacroOverride(macroRegime, overviewKpis)
  const activeCombos = buildActiveCombos(macroRegime, overviewKpis)

  return buildPortfolioResponse({
    meta: baseMeta(),
    ceiling,
    allocationRows,
    pnlRows,
    macroOverride,
    activeCombos,
  })
}

export async function loadPortfolio(
  scenario: PortfolioScenario = 'normal',
): Promise<PortfolioResponse | null> {
  const sizer = await loadPortfolioSizer(scenario)
  if (sizer) return sizer
  return loadPortfolioLegacy()
}

export async function loadPortfolioRisk(
  scenario: PortfolioScenario = 'normal',
): Promise<PortfolioRiskResponse | null> {
  try {
    const raw = await mindwealthFetch<Record<string, unknown>>(
      `/portfolio/risk?scenario=${encodeURIComponent(scenario)}`,
    )
    if (!raw || typeof raw !== 'object') return null
    return mapPortfolioRiskResponse(raw)
  } catch {
    return null
  }
}

export async function searchPortfolioTickers(
  query: string,
  limit = 20,
): Promise<PortfolioTickerSearchResult[] | null> {
  const q = query.trim()
  if (!q) return []
  try {
    const raw = await mindwealthFetch<PortfolioTickerSearchResult[]>(
      `/portfolio/risk/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    )
    return Array.isArray(raw) ? raw : []
  } catch {
    return null
  }
}

export async function analyzePortfolioHoldings(
  body: PortfolioAnalyzeRequest,
): Promise<PortfolioAnalyzeResponse | null> {
  if (!body.holdings?.length) return null
  try {
    return await mindwealthFetch<PortfolioAnalyzeResponse>('/portfolio/risk/analyze', {
      method: 'POST',
      body,
    })
  } catch {
    return null
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
    const mtmPct = parseVtMtmPct(mtmRaw) ?? 0
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

export async function loadMacroOverviewKpis() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/overview/kpis')
  return raw ? mapMacroOverviewKpis(raw) : null
}

export async function loadMacroRegime() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/regime')
  return raw ? mapMacroRegime(raw) : null
}

export async function loadMacroCombos() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/combos')
  return raw ? mapMacroCombos(raw) : null
}

export async function loadMacroNarrative() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/narrative')
  return raw ? mapMacroNarrative(raw) : null
}

export async function loadMacroStatus() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/status')
  return raw ? mapMacroStatus(raw) : null
}

export async function loadMacroPersistence() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/persistence')
  return raw ? mapMacroPersistence(raw) : null
}

export async function loadMacroDataFreshness() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/data/freshness')
  return raw ? mapMacroDataFreshness(raw) : null
}

export async function loadMacroSsiSummary() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/ssi/summary')
  return raw ? mapMacroSsiSummary(raw) : null
}

export async function loadMacroSsiMultiplier() {
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/ssi/multiplier')
  return raw ? mapMacroSsiMultiplier(raw) : null
}

export async function loadRunicVariables() {
  const heatmap = await mindwealthFetch<Record<string, unknown>>('/macro/variables/heatmap')
  if (heatmap) return mapMacroVariablesHeatmap(heatmap)
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/variables/current')
  return raw ? mapRunicVariables(raw) : null
}

export async function loadRunicCancelTracker() {
  const [cancel, fWindow] = await Promise.all([
    mindwealthFetch<Record<string, unknown>>('/macro/combo-c/cancel'),
    mindwealthFetch<Record<string, unknown>>('/macro/combo-f/window'),
  ])
  if (cancel || fWindow) return mapMacroCancelTracker(cancel, fWindow)
  const raw = await mindwealthFetch<Record<string, unknown>>('/macro/runic/nightly')
  return raw ? mapRunicCancelTracker(raw) : null
}

export async function loadRunicAnalog(combo: string) {
  const letter = combo.toUpperCase()
  const raw = await mindwealthFetch<Record<string, unknown>>(`/macro/analogs/${letter}`)
  if (raw) {
    const mapped = mapMacroAnalogTable(letter, raw)
    if (mapped?.rows?.length) return mapped
  }
  const nightly = await mindwealthFetch<Record<string, unknown>>('/macro/runic/nightly')
  if (!nightly) return null
  return mapRunicAnalog(letter, nightly)
}
