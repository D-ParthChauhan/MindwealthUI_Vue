import type {
  PortfolioAllocationRow,
  PortfolioCeiling,
  PortfolioCeilingStep,
  PortfolioClusterGroup,
  PortfolioComboStripItem,
  PortfolioConstraintCheck,
  PortfolioFlag,
  PortfolioFlagId,
  PortfolioMacroOverride,
  PortfolioPnlRow,
  PortfolioResponse,
  PortfolioRiskResponse,
  PortfolioScenario,
  PortfolioSummary,
} from '~/types/api'
import type { ConvictionSignalRow, ConvictionVerdict } from '~/types/conviction'

type VtRow = Record<string, unknown> & { _side: 'Long' | 'Short' }

export function parseVtNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(String(raw).replace(/[$,%\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function parseVtMtmPct(raw: unknown): number | null {
  if (raw == null) return null
  const m = String(raw).match(/(-?[\d.]+)%/)
  return m ? Number(m[1]) : null
}

export function verdictToSizeTier(verdict: ConvictionVerdict | null | undefined): string | null {
  switch (verdict) {
    case 'MAX CONVICTION':
      return 'MAX 100%'
    case 'TACTICAL':
      return 'TACTICAL 75%'
    case 'REDUCED':
      return 'REDUCED 40%'
    case 'CANCEL':
    case 'YIELD TRAP':
      return 'BLOCKED'
    default:
      return null
  }
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export function indexConvictionByTicker(signals: ConvictionSignalRow[]): Map<string, ConvictionSignalRow> {
  const map = new Map<string, ConvictionSignalRow>()
  for (const row of signals) {
    map.set(normalizeTicker(row.ticker), row)
  }
  return map
}

export function buildMultiSigTickers(
  outstanding: Array<{ symbol?: string; function?: string; direction?: string }>,
): Set<string> {
  const byTicker = new Map<string, Set<string>>()
  for (const row of outstanding) {
    const ticker = normalizeTicker(String(row.symbol ?? ''))
    const fn = String(row.function ?? '').trim()
    if (!ticker || !fn) continue
    if (!byTicker.has(ticker)) byTicker.set(ticker, new Set())
    byTicker.get(ticker)!.add(fn.toLowerCase())
  }
  const multi = new Set<string>()
  for (const [ticker, fns] of byTicker) {
    if (fns.size >= 2) multi.add(ticker)
  }
  return multi
}

export function buildPortfolioFlags(
  conviction: ConvictionSignalRow | undefined,
  multiSig: boolean,
  pnlPct: number | null,
): PortfolioFlag[] {
  const flags: PortfolioFlag[] = []
  if (multiSig) flags.push({ id: 'MULTI-SIG', label: 'MULTI-SIG' })
  if (conviction?.fdDirection === 'positive') flags.push({ id: 'FD+', label: 'FD+' })
  if (conviction?.fdDirection === 'negative') flags.push({ id: 'FD−', label: 'FD−' })
  if (conviction?.yieldTrap) flags.push({ id: 'YIELD TRAP', label: 'YIELD TRAP' })
  if (pnlPct != null && pnlPct <= -10) flags.push({ id: 'DRAWDOWN', label: 'DRAWDOWN' })
  return flags
}

function isBlocked(conviction: ConvictionSignalRow | undefined, pnlPct: number | null): boolean {
  if (conviction?.yieldTrap) return true
  if (conviction?.verdict === 'CANCEL' || conviction?.verdict === 'YIELD TRAP') return true
  if (conviction?.bqScore != null && conviction.bqScore < 2) return true
  if (pnlPct != null && pnlPct <= -15) return true
  return false
}

function intervalLabel(raw: unknown): string {
  const s = String(raw ?? '').trim()
  if (!s) return '—'
  const lower = s.toLowerCase()
  if (lower.includes('month')) return 'Monthly'
  if (lower.includes('week')) return 'Weekly'
  if (lower.includes('day')) return 'Daily'
  return s
}

export function mapVtRowToPnlRow(
  row: VtRow,
  convictionByTicker: Map<string, ConvictionSignalRow>,
  multiSigTickers: Set<string>,
): PortfolioPnlRow {
  const ticker = String(row.Symbol ?? '—')
  const key = normalizeTicker(ticker)
  const conviction = convictionByTicker.get(key)
  const pnlPct = parseVtMtmPct(row['Realised/Unrealised Profit'])
  const flags = buildPortfolioFlags(conviction, multiSigTickers.has(key), pnlPct)
  const blocked = isBlocked(conviction, pnlPct)

  return {
    ticker,
    investment_type: null,
    function: String(row.Function ?? '—'),
    interval: intervalLabel(row.Interval),
    direction: row._side,
    entry_price: parseVtNumber(row['Entry Price']),
    current_price: parseVtNumber(row['Today price']),
    shares: null,
    market_value: null,
    pnl_usd: null,
    pnl_pct: pnlPct,
    bq_score: conviction?.bqScore ?? null,
    size_tier: verdictToSizeTier(conviction?.verdict),
    flags,
    status: String(row.Status ?? '—'),
    blocked,
  }
}

export function mapVtRowToAllocationRow(
  row: VtRow,
  convictionByTicker: Map<string, ConvictionSignalRow>,
  multiSigTickers: Set<string>,
): PortfolioAllocationRow {
  const pnl = mapVtRowToPnlRow(row, convictionByTicker, multiSigTickers)
  return {
    ticker: pnl.ticker,
    name: null,
    investment_type: null,
    function: pnl.function,
    interval: pnl.interval,
    direction: pnl.direction,
    bq_score: pnl.bq_score,
    size_tier: pnl.size_tier,
    allocation_usd: null,
    allocation_pct: null,
    flags: pnl.flags,
    blocked: pnl.blocked,
  }
}

export function groupAllocationClusters(rows: PortfolioAllocationRow[]): PortfolioClusterGroup[] {
  if (!rows.length) return []
  return [
    {
      id: 'open-book',
      label: 'Open positions',
      budget_usd: null,
      budget_pct: null,
      deployed_usd: null,
      deployed_pct: null,
      max_pct: null,
      positions: rows,
    },
  ]
}

function findVixVariable(
  variables: { variables_dashboard?: Array<{ variable?: string; current?: number; percentile?: number }> } | null,
): { vix: number | null; vix_pct: number | null } {
  const vixVar = variables?.variables_dashboard?.find(
    (v) => String(v.variable ?? '').toUpperCase() === 'VIX',
  )
  return {
    vix: vixVar?.current != null ? Number(vixVar.current) : null,
    vix_pct: vixVar?.percentile != null ? Math.round(Number(vixVar.percentile)) : null,
  }
}

export function buildPortfolioCeiling(input: {
  macroRegime: Record<string, unknown> | null
  ssiMultiplier: Record<string, unknown> | null
  variables: Record<string, unknown> | null
}): PortfolioCeiling {
  const regime = (input.macroRegime?.regime as Record<string, unknown> | undefined) ?? {}
  const { vix, vix_pct } = findVixVariable(
    input.variables as { variables_dashboard?: Array<{ variable?: string; current?: number; percentile?: number }> },
  )
  const valRegime = regime.val_regime != null ? String(regime.val_regime) : null
  const geoOverlay = regime.geo_overlay != null ? String(regime.geo_overlay) : null
  const ssiMult =
    input.ssiMultiplier?.ssi_multiplier != null
      ? Number(input.ssiMultiplier.ssi_multiplier)
      : input.macroRegime?.ssi_multiplier != null
        ? Number(input.macroRegime.ssi_multiplier)
        : null

  const steps: PortfolioCeilingStep[] = []
  if (vix != null) {
    steps.push({
      label: `VIX ${vix}${vix_pct != null ? ` (${vix_pct}th pct)` : ''}`,
      value: valRegime ?? '—',
      tone: 'green',
    })
  }
  if (valRegime) {
    steps.push({ label: 'Valuation regime', value: valRegime })
  }
  if (ssiMult != null) {
    steps.push({ label: '× SSI multiplier', value: `${ssiMult.toFixed(2)}×` })
  }
  if (input.macroRegime?.ssi_layer2_status) {
    steps.push({
      label: 'SSI Layer 2',
      value: String(input.macroRegime.ssi_layer2_status),
      tone: String(input.macroRegime.ssi_layer2_status) === 'CONFIRMED' ? 'green' : 'amber',
    })
  }

  const formulaParts: string[] = []
  if (valRegime) formulaParts.push(`${valRegime} valuation regime`)
  if (ssiMult != null) formulaParts.push(`${ssiMult.toFixed(2)}× SSI`)
  if (input.macroRegime?.brave_fearful_display) {
    formulaParts.push(String(input.macroRegime.brave_fearful_display))
  }

  return {
    vix,
    vix_pct,
    vix_regime: valRegime,
    val_regime: valRegime,
    geo_overlay: geoOverlay,
    regime_max_pct: null,
    ssi_multiplier: ssiMult,
    vix_level_mult: null,
    spx_trend_mult: null,
    hy_credit_mult: null,
    final_ceiling_pct: null,
    formula_text: formulaParts.length ? formulaParts.join(' · ') : null,
    note: input.macroRegime?.system_recommendation
      ? String(input.macroRegime.system_recommendation)
      : null,
    portfolio_notional: null,
    idle_cash_yield_pct: null,
    steps,
  }
}

export function buildMacroOverride(
  macroRegime: Record<string, unknown> | null,
  overviewKpis: Record<string, unknown> | null,
): PortfolioMacroOverride | null {
  const reasons: string[] = []
  const regime = (macroRegime?.regime as Record<string, unknown> | undefined) ?? {}
  const valRegime = String(regime.val_regime ?? '')
  const geo = String(regime.geo_overlay ?? '')
  const cape = overviewKpis?.cape as Record<string, unknown> | undefined
  const capeVal = cape?.current != null ? Number(cape.current) : null

  if (valRegime === 'EXTREME' || valRegime === 'HIGH') {
    reasons.push(
      capeVal != null
        ? `Valuation ${valRegime.toLowerCase()}: CAPE ${capeVal.toFixed(1)}×`
        : `Valuation regime: ${valRegime}`,
    )
  }
  if (geo && geo !== 'NEUTRAL') {
    reasons.push(`Geopolitical: ${geo.replace(/_/g, ' ')}`)
  }
  if (!reasons.length) return null
  return { active: true, reasons }
}

export function buildActiveCombos(
  macroRegime: Record<string, unknown> | null,
  overviewKpis: Record<string, unknown> | null,
): PortfolioComboStripItem[] {
  const items: PortfolioComboStripItem[] = []
  const dominant = macroRegime?.dominant_signal
  if (dominant) {
    items.push({
      id: String(dominant),
      label: `COMBO ${String(dominant)}`,
      detail: macroRegime?.dominant_reason ? String(macroRegime.dominant_reason) : null,
    })
  }
  const comboC = overviewKpis?.combo_c_duration as Record<string, unknown> | undefined
  if (comboC?.active) {
    items.push({
      id: 'C',
      label: `COMBO C wk ${comboC.duration_weeks ?? '—'}`,
      detail: comboC.duration_bucket ? String(comboC.duration_bucket) : null,
    })
  }
  const comboF = overviewKpis?.combo_f_window as Record<string, unknown> | undefined
  if (comboF?.active) {
    items.push({
      id: 'F',
      label: `COMBO F wk ${comboF.weeks_elapsed ?? '—'}`,
      detail: comboF.mtm_pct != null ? `MTM ${Number(comboF.mtm_pct)}%` : null,
    })
  }
  return items
}

export function buildConstraintChecks(input: {
  macroOverride: PortfolioMacroOverride | null
  activeCombos: PortfolioComboStripItem[]
  openCount: number
  drawdownCount: number
}): PortfolioConstraintCheck[] {
  const checks: PortfolioConstraintCheck[] = []
  if (input.openCount > 0) {
    checks.push({
      level: 'ok',
      title: 'Open book',
      body: `${input.openCount} open virtual-trading position${input.openCount === 1 ? '' : 's'} loaded from API.`,
    })
  }
  if (input.activeCombos.some((c) => c.id === 'C')) {
    checks.push({
      level: 'warn',
      title: 'Combo C active',
      body: 'Combo C is active per macro overview — entry sizing adjustments require portfolio sizer API.',
    })
  }
  if (input.drawdownCount > 0) {
    checks.push({
      level: 'warn',
      title: 'Drawdown flags',
      body: `${input.drawdownCount} position${input.drawdownCount === 1 ? '' : 's'} down more than 10% from entry (virtual trading MTM).`,
    })
  }
  if (input.macroOverride?.active) {
    checks.push({
      level: 'warn',
      title: 'Macro override flagged',
      body: input.macroOverride.reasons.join(' · '),
    })
  }
  return checks
}

export function buildPortfolioSummary(
  pnlRows: PortfolioPnlRow[],
  ceiling: PortfolioCeiling,
): PortfolioSummary {
  return {
    deployed_usd: null,
    deployed_pct: null,
    cash_usd: null,
    cash_pct: null,
    idle_income_usd: null,
    open_position_count: pnlRows.length,
  }
}

export function buildPortfolioResponse(parts: {
  meta?: PortfolioResponse['meta']
  ceiling: PortfolioCeiling
  allocationRows: PortfolioAllocationRow[]
  pnlRows: PortfolioPnlRow[]
  macroOverride: PortfolioMacroOverride | null
  activeCombos: PortfolioComboStripItem[]
}): PortfolioResponse {
  const drawdownCount = parts.pnlRows.filter((r) => r.flags.some((f) => f.id === 'DRAWDOWN')).length
  return {
    meta: parts.meta,
    ceiling: parts.ceiling,
    clusters: groupAllocationClusters(parts.allocationRows),
    pnl_rows: parts.pnlRows,
    summary: buildPortfolioSummary(parts.pnlRows, parts.ceiling),
    constraints: buildConstraintChecks({
      macroOverride: parts.macroOverride,
      activeCombos: parts.activeCombos,
      openCount: parts.pnlRows.length,
      drawdownCount,
    }),
    active_combos: parts.activeCombos,
    macro_override: parts.macroOverride,
    risk: {
      available: false,
      message: 'Portfolio correlation / risk analysis endpoint is not available in API v1.4.',
    },
    scenarios_available: false,
  }
}

export function filterOpenVtRows(
  longBook: { records?: Record<string, unknown>[] } | null,
  shortBook: { records?: Record<string, unknown>[] } | null,
): VtRow[] {
  const openLong = (longBook?.records ?? []).filter((r) => String(r.Status ?? '').toLowerCase() === 'open')
  const openShort = (shortBook?.records ?? []).filter((r) => String(r.Status ?? '').toLowerCase() === 'open')
  return [
    ...openLong.map((r) => ({ ...r, _side: 'Long' as const })),
    ...openShort.map((r) => ({ ...r, _side: 'Short' as const })),
  ]
}

export function mapOutstandingForMultiSig(
  outstanding: { records?: Record<string, unknown>[] } | null,
): Array<{ symbol?: string; function?: string; direction?: string }> {
  return (outstanding?.records ?? []).map((r) => ({
    symbol: String(r.Symbol ?? r.symbol ?? ''),
    function: String(r.Function ?? r.function ?? ''),
    direction: String(r.Signal ?? r.direction ?? ''),
  }))
}

const PORTFOLIO_SCENARIOS = new Set<PortfolioScenario>(['normal', 'stress', 'lowvol'])

export function parsePortfolioScenario(raw: unknown): PortfolioScenario {
  const s = String(raw ?? 'normal').toLowerCase()
  return PORTFOLIO_SCENARIOS.has(s as PortfolioScenario) ? (s as PortfolioScenario) : 'normal'
}

function numOrNull(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function mapPortfolioFlags(raw: unknown): PortfolioFlag[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((f) => {
      if (typeof f === 'string') return { id: f as PortfolioFlagId, label: f }
      const row = f as Record<string, unknown>
      const id = String(row.id ?? row.label ?? '')
      if (!id) return null
      return { id: id as PortfolioFlagId, label: String(row.label ?? id) }
    })
    .filter((f): f is PortfolioFlag => f != null)
}

function mapSizerPositionRow(raw: Record<string, unknown>): PortfolioAllocationRow {
  const direction = String(raw.direction ?? 'Long')
  return {
    ticker: String(raw.ticker ?? '—'),
    name: raw.name != null ? String(raw.name) : null,
    investment_type: raw.investment_type != null ? String(raw.investment_type) : null,
    cluster_id: raw.cluster_id != null ? String(raw.cluster_id) : null,
    function: String(raw.function ?? '—'),
    interval: String(raw.interval ?? '—'),
    direction: direction.toLowerCase() === 'short' ? 'Short' : 'Long',
    bq_score: numOrNull(raw.bq_score),
    size_tier: raw.size_tier != null ? String(raw.size_tier) : null,
    allocation_usd: numOrNull(raw.allocation_usd),
    allocation_pct: numOrNull(raw.allocation_pct),
    flags: mapPortfolioFlags(raw.flags),
    blocked: Boolean(raw.blocked),
    blocked_reason: raw.blocked_reason != null ? String(raw.blocked_reason) : null,
    win_rate: numOrNull(raw.win_rate),
    win_rate_label: raw.win_rate_label != null ? String(raw.win_rate_label) : null,
    backtested_win_rate_pct: numOrNull(raw.backtested_win_rate_pct),
    unscored: raw.unscored === true,
  }
}

function mapSizerPnlRow(raw: Record<string, unknown>): PortfolioPnlRow {
  const alloc = mapSizerPositionRow(raw)
  const direction = String(raw.direction ?? 'Long')
  return {
    ticker: alloc.ticker,
    name: alloc.name,
    investment_type: alloc.investment_type,
    function: alloc.function,
    interval: alloc.interval,
    direction: direction.toLowerCase() === 'short' ? 'Short' : 'Long',
    entry_price: numOrNull(raw.entry_price),
    current_price: numOrNull(raw.today_price ?? raw.current_price),
    shares: numOrNull(raw.shares),
    market_value: numOrNull(raw.market_value_usd ?? raw.market_value),
    pnl_usd: numOrNull(raw.pnl_usd),
    pnl_pct: numOrNull(raw.pnl_pct),
    bq_score: alloc.bq_score,
    size_tier: alloc.size_tier,
    flags: alloc.flags,
    status: String(raw.status ?? 'Open'),
    blocked: alloc.blocked,
    blocked_reason: alloc.blocked_reason,
    win_rate: alloc.win_rate,
    win_rate_label: alloc.win_rate_label,
    backtested_win_rate_pct: alloc.backtested_win_rate_pct,
    unscored: alloc.unscored,
  }
}

function mapSizerCluster(raw: Record<string, unknown>): PortfolioClusterGroup {
  const positions = Array.isArray(raw.positions)
    ? raw.positions.map((p) => mapSizerPositionRow(p as Record<string, unknown>))
    : []
  return {
    id: String(raw.id ?? 'cluster'),
    label: String(raw.label ?? raw.id ?? 'Cluster'),
    budget_usd: numOrNull(raw.budget_usd),
    budget_pct: numOrNull(raw.budget_pct),
    deployed_usd: numOrNull(raw.deployed_usd),
    deployed_pct: numOrNull(raw.deployed_pct),
    max_pct: numOrNull(raw.max_pct),
    positions,
  }
}

function mapSizerCeiling(raw: Record<string, unknown> | undefined): PortfolioCeiling {
  const c = raw ?? {}
  const steps = Array.isArray(c.steps)
    ? c.steps.map((s) => {
        const row = s as Record<string, unknown>
        return {
          label: String(row.label ?? ''),
          value: String(row.value ?? ''),
          tone: row.tone as PortfolioCeilingStep['tone'],
        }
      })
    : []

  const spxMeta = c.spx_trend_meta as Record<string, unknown> | undefined
  const spx_trend_meta = spxMeta
    ? {
        source: spxMeta.source != null ? String(spxMeta.source) : undefined,
        symbol: spxMeta.symbol != null ? String(spxMeta.symbol) : undefined,
        spx_price: numOrNull(spxMeta.spx_price) ?? undefined,
        spx_ma200: numOrNull(spxMeta.spx_ma200) ?? undefined,
        above_ma200: spxMeta.above_ma200 === true,
      }
    : null

  return {
    vix: numOrNull(c.vix),
    vix_pct: numOrNull(c.vix_pct),
    vix_regime: c.vix_regime != null ? String(c.vix_regime) : null,
    val_regime: c.val_regime != null ? String(c.val_regime) : null,
    geo_overlay: c.geo_overlay != null ? String(c.geo_overlay) : null,
    regime_max_pct: numOrNull(c.regime_max_pct),
    ssi_multiplier: numOrNull(c.ssi_multiplier),
    vix_level_mult: numOrNull(c.vix_level_mult),
    spx_trend_mult: numOrNull(c.spx_trend_mult),
    spx_trend_meta,
    hy_credit_mult: numOrNull(c.hy_credit_mult),
    final_ceiling_pct: numOrNull(c.final_ceiling_pct),
    formula_text: c.formula_text != null ? String(c.formula_text) : null,
    note: c.note != null ? String(c.note) : null,
    portfolio_notional: numOrNull(c.portfolio_notional),
    idle_cash_yield_pct: numOrNull(c.idle_cash_yield_pct),
    steps,
  }
}

export function mapPortfolioSizerResponse(
  raw: Record<string, unknown>,
  meta?: PortfolioResponse['meta'],
): PortfolioResponse {
  const ceiling = mapSizerCeiling(raw.ceiling as Record<string, unknown>)
  const clusters = Array.isArray(raw.clusters)
    ? raw.clusters.map((c) => mapSizerCluster(c as Record<string, unknown>))
    : []
  const pnl_rows = Array.isArray(raw.pnl_rows)
    ? raw.pnl_rows.map((r) => mapSizerPnlRow(r as Record<string, unknown>))
    : clusters.flatMap((c) =>
        c.positions.map((p) => ({
          ...mapSizerPnlRow(p as unknown as Record<string, unknown>),
          ticker: p.ticker,
          name: p.name,
          investment_type: p.investment_type,
          function: p.function,
          interval: p.interval,
          direction: p.direction,
          bq_score: p.bq_score,
          size_tier: p.size_tier,
          flags: p.flags,
          blocked: p.blocked,
          status: 'Open',
          entry_price: null,
          current_price: null,
          shares: null,
          market_value: null,
          pnl_usd: null,
          pnl_pct: null,
        })),
      )

  const summaryRaw = (raw.summary as Record<string, unknown>) ?? {}
  const summary: PortfolioSummary = {
    deployed_usd: numOrNull(summaryRaw.deployed_usd),
    deployed_pct: numOrNull(summaryRaw.deployed_pct),
    cash_usd: numOrNull(summaryRaw.cash_usd),
    cash_pct: numOrNull(summaryRaw.cash_pct),
    idle_income_usd: numOrNull(summaryRaw.idle_income_usd),
    open_position_count: Number(summaryRaw.open_position_count ?? pnl_rows.length),
  }

  const constraints = Array.isArray(raw.constraints)
    ? raw.constraints.map((c) => {
        const row = c as Record<string, unknown>
        return {
          level: (row.level as PortfolioConstraintCheck['level']) ?? 'ok',
          title: String(row.title ?? ''),
          body: String(row.body ?? ''),
        }
      })
    : []

  const active_combos = Array.isArray(raw.active_combos)
    ? raw.active_combos.map((c) => {
        const row = c as Record<string, unknown>
        return {
          id: String(row.id ?? ''),
          label: String(row.label ?? ''),
          detail: row.detail != null ? String(row.detail) : null,
        }
      })
    : []

  const macroRaw = raw.macro_override as Record<string, unknown> | null | undefined
  const macro_override =
    macroRaw && macroRaw.active
      ? {
          active: true,
          reasons: Array.isArray(macroRaw.reasons)
            ? macroRaw.reasons.map((r) => String(r))
            : [],
        }
      : null

  const riskRaw = (raw.risk as Record<string, unknown>) ?? {}

  return {
    meta,
    date: raw.date != null ? String(raw.date) : undefined,
    as_of: raw.as_of != null ? String(raw.as_of) : undefined,
    scenario: parsePortfolioScenario(raw.scenario),
    ceiling,
    clusters,
    pnl_rows,
    summary,
    constraints,
    active_combos,
    macro_override,
    risk: {
      available: riskRaw.available !== false,
      message: String(riskRaw.message ?? 'Use GET /api/v1/portfolio/risk for full correlation matrix.'),
    },
    scenarios_available: raw.scenarios_available === true,
  }
}

export function mapPortfolioRiskResponse(raw: Record<string, unknown>): PortfolioRiskResponse {
  const breaches = Array.isArray(raw.breaches)
    ? raw.breaches.map((b) => {
        const row = b as Record<string, unknown>
        return {
          pair: Array.isArray(row.pair) ? row.pair.map(String) : [],
          pair_labels: Array.isArray(row.pair_labels) ? row.pair_labels.map(String) : [],
          rho: Number(row.rho ?? 0),
          level: String(row.level) === 'action' ? 'action' as const : 'watch' as const,
          combined_weight_pct: Number(row.combined_weight_pct ?? 0),
          combined_weight_usd: Number(row.combined_weight_usd ?? 0),
          cap_pct: Number(row.cap_pct ?? 0),
          recommendation: row.recommendation != null ? String(row.recommendation) : null,
        }
      })
    : []

  const cluster_weights = Array.isArray(raw.cluster_weights)
    ? raw.cluster_weights.map((c) => {
        const row = c as Record<string, unknown>
        return {
          cluster_id: String(row.cluster_id ?? ''),
          label: String(row.label ?? row.cluster_id ?? ''),
          deployed_pct: Number(row.deployed_pct ?? 0),
          max_pct: Number(row.max_pct ?? 0),
        }
      })
    : []

  const metaRaw = (raw.correlation_meta as Record<string, unknown>) ?? {}
  const proxiesRaw = (metaRaw.proxies as Record<string, unknown>) ?? {}
  const proxies: Record<string, string> = {}
  for (const [k, v] of Object.entries(proxiesRaw)) {
    proxies[k] = String(v)
  }

  return {
    date: String(raw.date ?? ''),
    scenario: parsePortfolioScenario(raw.scenario),
    labels: Array.isArray(raw.labels) ? raw.labels.map(String) : [],
    matrix: Array.isArray(raw.matrix) ? (raw.matrix as number[][]) : [],
    correlation_meta: {
      source: String(metaRaw.source ?? ''),
      as_of: String(metaRaw.as_of ?? ''),
      proxies,
      window_days: Number(metaRaw.window_days ?? 0),
    },
    breaches,
    breach_threshold_watch: Number(raw.breach_threshold_watch ?? 0.75),
    breach_threshold_action: Number(raw.breach_threshold_action ?? 0.85),
    cluster_weights,
  }
}
