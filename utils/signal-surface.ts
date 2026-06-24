import type { Signal, SignalSurfaceRecord } from '~/types/api'
import { normalizeFunctionName, normalizeIntervalName } from '~/utils/signal-filters'
import { signalKey } from '~/utils/signal-detail'
import { formatDirection, formatSignalDate, parseSignalStatusFromRaw } from '~/utils/signals'

export type SignalTier = 'tA' | 'best' | 'tierc' | 'exit' | string

export interface AlphaInterpretation {
  type: 'fail' | 'warn' | 'info' | null
  label: string
  detail: string
}

export interface SignalSurfacePoint {
  key: string
  signal: Signal
  symbol: string
  function: string
  interval: string
  direction: 'LONG' | 'SHORT'
  signalDate: string
  daysElapsed: number | null
  mtmPct: number | null
  btWr: number
  fwdWr: number | null
  compositeScore: number | null
  windowRemainingPct: number | null
  upsideRemainingPct: number | null
  er: number | null
  signalAlpha: number | null
  sharpe: number | null
  avgHoldDays: number | null
  rrStatic: number | null
  rrDynamic: number | null
  intrinsicLagDays: number | null
  tier: SignalTier | null
  exitFired: boolean
  convictionBqScore: number | null
  convictionFsClass: string | null
  alphaInterpretation: AlphaInterpretation | null
  /** Fields required for the active view but absent from API payload */
  missingFields: string[]
}

export const SURFACE_REQUIRED_FIELDS = ['composite_score', 'window_remaining_pct'] as const
export const RANKED_PREFERRED_FIELDS = ['composite_score', 'tier'] as const

export type TierFilterSlug = 'best' | 'ta' | 'tierc' | 'exit' | 'unrated'

export const RANKED_TIER_FILTERS = [
  { value: 'all', label: 'All tiers' },
  { value: 'best', label: 'Best Available' },
  { value: 'ta', label: 'Tier A' },
  { value: 'tierc', label: 'Tier C' },
  { value: 'exit', label: 'Exit' },
] as const

export type RankedTierFilter = (typeof RANKED_TIER_FILTERS)[number]['value']

export function normalizeTierSlug(tier: SignalTier | null | undefined): TierFilterSlug {
  if (tier == null || tier === '') return 'unrated'
  const t = String(tier).toLowerCase().replace(/\s+/g, '')
  if (t === 'best' || t === 'bestavailable') return 'best'
  if (t === 'ta' || t === 'tiera') return 'ta'
  if (t === 'tierc') return 'tierc'
  if (t === 'exit') return 'exit'
  return 'unrated'
}

export function matchesTierFilter(tier: SignalTier | null | undefined, filter: RankedTierFilter): boolean {
  if (filter === 'all') return true
  return normalizeTierSlug(tier) === filter
}

const FUNCTION_COLORS: Record<string, string> = {
  TRENDPULSE: '#378ADD',
  DELTADRIFT: '#D85A30',
  'OSCILLATOR DELTA': '#9F4AB7',
  OSCILLATORDELTA: '#9F4AB7',
  SIGMASHELL: '#1D9E75',
  'FRACTAL TRACK': '#BA7517',
  FRACTALTRACK: '#BA7517',
  BASELINEDIVERGENCE: '#0F6E56',
  'BASELINE DIVERGENCE': '#0F6E56',
  PULSEGAUGE: '#5F5E5A',
  'BAND MATRIX': '#6B8CAE',
  'ALTITUDE ALPHA': '#C9A84C',
  SBI: '#888888',
}

function normalizeFn(name: string): string {
  return name.toUpperCase().replace(/\s+/g, ' ').trim()
}

export function functionColor(functionName: string): string {
  const key = normalizeFn(functionName)
  if (FUNCTION_COLORS[key]) return FUNCTION_COLORS[key]
  const compact = key.replace(/\s+/g, '')
  return FUNCTION_COLORS[compact] ?? '#888888'
}

function pickRaw(raw: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (raw[k] != null && raw[k] !== '' && raw[k] !== 'No Information') return raw[k]
  }
  const lower = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]))
  for (const k of keys) {
    const v = lower.get(k.toLowerCase())
    if (v != null && v !== '' && v !== 'No Information') return v
  }
  return undefined
}

function toNumber(raw: unknown): number | null {
  if (raw == null || raw === '' || raw === 'No Information') return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const s = String(raw).replace(/%/g, '').replace(/,/g, '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function toInt(raw: unknown): number | null {
  const n = toNumber(raw)
  return n == null ? null : Math.round(n)
}

function toBool(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  if (raw == null) return false
  const s = String(raw).toLowerCase().trim()
  return s === 'true' || s === '1' || s === 'yes' || s === 'y'
}

function parseMtmFromDisplay(mtm: string | undefined): number | null {
  if (!mtm || mtm === '—') return null
  const m = mtm.match(/([+-]?[\d.]+)\s*%/)
  return m ? Number(m[1]) : null
}

function parseDaysFromMtmCol(raw: unknown): number | null {
  if (raw == null) return null
  const s = String(raw)
  const daysMatch = s.match(/([\d.]+)\s*days?/i)
  return daysMatch ? Math.round(Number(daysMatch[1])) : null
}

function parseAlphaInterpretation(raw: unknown): AlphaInterpretation | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  return {
    type: (o.type as AlphaInterpretation['type']) ?? null,
    label: String(o.label ?? ''),
    detail: String(o.detail ?? ''),
  }
}

function parseTier(raw: unknown): SignalTier | null {
  if (raw == null || raw === '') return null
  return String(raw).trim() as SignalTier
}

export function surfaceRecordKey(
  symbol: string,
  functionName: string,
  interval: string,
  direction: string,
): string {
  const dir = direction.toUpperCase().startsWith('S') ? 'SHORT' : 'LONG'
  return `${symbol}|${normalizeFunctionName(functionName)}|${normalizeIntervalName(interval)}|${dir}`
}

export function enrichSignalSurface(
  signal: Signal,
  apiRecord?: SignalSurfaceRecord | null,
): SignalSurfacePoint {
  const raw: Record<string, unknown> = {
    ...(signal.raw_fields ?? {}),
    ...(apiRecord ?? {}),
  }
  const missingFields: string[] = []
  const hasApiEnrichment = apiRecord?.composite_score != null

  const compositeScore = toNumber(
    apiRecord?.composite_score ??
      pickRaw(raw, [
        'composite_score',
        'Composite Score',
        'Quality Score',
        'quality_score',
        'Signal Quality Composite Score',
      ]),
  )
  const windowRemainingPct = toNumber(
    apiRecord?.window_remaining_pct ??
      pickRaw(raw, [
        'window_remaining_pct',
        'Window Remaining %',
        'Window Remaining (%)',
        'window_remaining',
        'reward_remaining_pct',
      ]),
  )
  const mtmPct =
    toNumber(apiRecord?.mtm_pct ?? pickRaw(raw, ['mtm_pct', 'MTM %', 'MTM [%]', 'mtm', 'Mark to Market %'])) ??
    parseMtmFromDisplay(signal.current_mtm)
  const daysElapsed =
    toInt(apiRecord?.days_elapsed ?? pickRaw(raw, ['days_elapsed', 'Days Elapsed', 'days_old', 'Holding Days'])) ??
    parseDaysFromMtmCol(raw['Current Mark to Market and Holding Period'] ?? signal.current_mtm)

  if (compositeScore == null) missingFields.push('composite_score')
  if (windowRemainingPct == null) missingFields.push('window_remaining_pct')

  const tier = parseTier(apiRecord?.tier ?? pickRaw(raw, ['tier', 'Tier', 'signal_tier']))
  const exitFired =
    apiRecord?.exit_fired ??
    (toBool(pickRaw(raw, ['exit_fired', 'Exit Fired', 'exit_signal'])) ||
      (String(signal.exit_status ?? '').toLowerCase() !== 'n/a' &&
        !String(signal.exit_status ?? '').toLowerCase().includes('no exit')))

  return {
    key: signalKey(signal),
    signal,
    symbol: signal.symbol,
    function: signal.function,
    interval: signal.interval,
    direction: formatDirection(signal.signal_type),
    signalDate: formatSignalDate(signal.signal_date),
    daysElapsed,
    mtmPct,
    btWr: signal.win_rate,
    fwdWr: apiRecord?.fwd_wr ?? signal.forward_wr,
    compositeScore,
    windowRemainingPct,
    upsideRemainingPct: toNumber(
      pickRaw(raw, ['upside_remaining_pct', 'Upside Remaining %', 'upside_remaining', 'reward_remaining_pct']),
    ),
    er: toNumber(apiRecord?.er ?? pickRaw(raw, ['er', 'E[R]', 'expected_return', 'Expected Return %', 'expected_return'])),
    signalAlpha: toNumber(
      apiRecord?.signal_alpha ??
        pickRaw(raw, ['signal_alpha', 'signal_alpha_per_trade', 'Signal Alpha', 'alpha', 'Alpha %']),
    ),
    sharpe: toNumber(
      pickRaw(raw, [
        'bt_strategy_sharpe',
        'Backtested Strategy Sharpe Ratio',
        'strategy_sharpe',
        'Sharpe',
        'sharpe',
      ]),
    ) ?? (signal.strategy_sharpe || null),
    avgHoldDays: toInt(
      apiRecord?.avg_hold_days ??
        pickRaw(raw, ['avg_hold_days', 'Avg Hold Days', 'avg_hold_all_trades', 'Average Holding Period (days)']),
    ),
    rrStatic: toNumber(apiRecord?.rr_static ?? pickRaw(raw, ['rr_static', 'R:R Static', 'RR Static'])),
    rrDynamic: toNumber(apiRecord?.rr_dynamic ?? pickRaw(raw, ['rr_dynamic', 'R:R Dynamic', 'RR Dynamic'])),
    intrinsicLagDays: toInt(
      pickRaw(raw, ['intrinsic_lag_days', 'Intrinsic Lag Days', 'detection_lag_days']),
    ),
    tier,
    exitFired: Boolean(exitFired),
    convictionBqScore: toNumber(
      apiRecord?.conviction_bq_score ??
        pickRaw(raw, ['conviction_bq_score', 'BQ Score', 'conviction_score']),
    ),
    convictionFsClass: (() => {
      const v = apiRecord?.conviction_fs_class ?? pickRaw(raw, ['conviction_fs_class', 'FS Class', 'fs_class'])
      return v != null ? String(v) : null
    })(),
    alphaInterpretation: parseAlphaInterpretation(
      apiRecord?.alpha_interpretation ?? pickRaw(raw, ['alpha_interpretation']),
    ),
    missingFields: hasApiEnrichment ? [] : missingFields,
  }
}

function intervalFromSurfaceRecord(rec: SignalSurfaceRecord): string {
  if (rec.interval) return String(rec.interval)
  const conf = String(rec['Interval, Confirmation Status'] ?? '')
  const m = conf.match(/^(Daily|Weekly|Monthly|Quarterly|Yearly)/i)
  return m ? m[1] : ''
}

function functionFromSurfaceRecord(rec: SignalSurfaceRecord): string {
  return String(rec.function ?? rec.Function ?? '')
}

export function mergeSignalsWithSurfaceRecords(
  signals: Signal[],
  surfaceRecords?: SignalSurfaceRecord[] | null,
): Signal[] {
  if (!surfaceRecords?.length) return signals

  const map = new Map<string, SignalSurfaceRecord>()
  for (const rec of surfaceRecords) {
    const fn = functionFromSurfaceRecord(rec)
    const interval = intervalFromSurfaceRecord(rec)
    const direction = String(rec.direction ?? 'Long')
    if (!rec.symbol || !fn) continue
    map.set(surfaceRecordKey(rec.symbol, fn, interval, direction), rec)
  }

  return signals.map((signal) => {
    const rec = map.get(
      surfaceRecordKey(signal.symbol, signal.function, signal.interval, signal.signal_type),
    )
    if (!rec) return signal
    const mergedRaw = { ...(signal.raw_fields ?? {}), ...rec }
    const status = parseSignalStatusFromRaw(mergedRaw)
    return {
      ...signal,
      raw_fields: mergedRaw,
      ...(status ? { status } : {}),
    }
  })
}

export function buildSurfacePoints(
  signals: Signal[],
  surfaceRecords?: SignalSurfaceRecord[] | null,
): SignalSurfacePoint[] {
  const map = new Map<string, SignalSurfaceRecord>()
  for (const rec of surfaceRecords ?? []) {
    const fn = functionFromSurfaceRecord(rec)
    const interval = intervalFromSurfaceRecord(rec)
    const direction = String(rec.direction ?? 'Long')
    if (!rec.symbol || !fn) continue
    map.set(surfaceRecordKey(rec.symbol, fn, interval, direction), rec)
  }

  return signals.map((signal) => {
    const rec = map.get(
      surfaceRecordKey(signal.symbol, signal.function, signal.interval, signal.signal_type),
    )
    return enrichSignalSurface(signal, rec)
  })
}

export function enrichSignalsSurface(signals: Signal[]): SignalSurfacePoint[] {
  return signals.map((s) => enrichSignalSurface(s))
}

export function collectMissingSurfaceFields(points: SignalSurfacePoint[]): string[] {
  const set = new Set<string>()
  for (const p of points) {
    for (const f of p.missingFields) set.add(f)
  }
  return [...set]
}

export function isPlottableSurfacePoint(p: SignalSurfacePoint): boolean {
  return p.compositeScore != null && p.windowRemainingPct != null
}

export function sortByQuality(points: SignalSurfacePoint[]): SignalSurfacePoint[] {
  return [...points].sort((a, b) => {
    const aq = a.compositeScore
    const bq = b.compositeScore
    if (aq != null && bq != null) return bq - aq
    if (aq != null) return -1
    if (bq != null) return 1
    return a.symbol.localeCompare(b.symbol)
  })
}

export function tierLabel(tier: SignalTier | null): string {
  if (!tier) return ''
  const t = tier.toLowerCase()
  if (t === 'ta' || t === 't a') return 'Tier A'
  if (t === 'best') return 'Best Available'
  if (t === 'tierc' || t === 'tier c') return 'Tier C'
  if (t === 'exit') return 'Exit'
  return tier
}

export function tierBadgeClass(tier: SignalTier | null): string {
  if (!tier) return 'neutral'
  const t = tier.toLowerCase()
  if (t === 'ta' || t === 't a') return 'tier-a'
  if (t === 'best') return 'tier-best'
  if (t === 'exit') return 'tier-exit'
  return 'tier-c'
}

export function windowStatusColor(pct: number | null): string {
  if (pct == null) return 'var(--t3)'
  if (pct > 70) return 'var(--green)'
  if (pct >= 30) return 'var(--gold)'
  return 'var(--red)'
}
