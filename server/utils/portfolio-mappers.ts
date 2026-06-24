import type {
  PortfolioAllocationRow,
  PortfolioCeiling,
  PortfolioCeilingStep,
  PortfolioClusterGroup,
  PortfolioComboStripItem,
  PortfolioConstraintCheck,
  PortfolioFlag,
  PortfolioMacroOverride,
  PortfolioPnlRow,
  PortfolioResponse,
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
