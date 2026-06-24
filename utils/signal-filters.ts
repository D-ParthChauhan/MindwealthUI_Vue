import type { Signal, SignalsSummary } from '~/types/api'

export type SignalIntervalFilter = 'all' | 'daily' | 'weekly' | 'yearly'

export const SIGNAL_INTERVAL_OPTIONS: Array<{ value: SignalIntervalFilter; label: string }> = [
  { value: 'all', label: 'All intervals' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
]

/** Sidebar nav id → canonical CSV function name */
export const SIGNAL_FUNCTION_FILTERS: Record<string, string> = {
  'fractal-f': 'FRACTAL TRACK',
  'trend-f': 'TRENDPULSE',
  'delta-f': 'DELTADRIFT',
  'band-f': 'BAND MATRIX',
  'sigma-f': 'SIGMASHELL',
  'pulse-f': 'PULSEGAUGE',
  'alt-f': 'ALTITUDE ALPHA',
  'osc-f': 'OSCILLATOR DELTA',
  'base-f': 'BASELINEDIVERGENCE',
  'sbi-f': 'SBI',
}

export const SIGNAL_FUNCTION_FILTER_IDS = new Set(Object.keys(SIGNAL_FUNCTION_FILTERS))

export const SIGNAL_VIEW_NAV_IDS = new Set([
  'outstanding',
  'new',
  'shortlist',
  'report',
  'sbi',
  'high',
  'perf',
])

/** Nav ids that show the signal table (interval filter applies) */
export const SIGNAL_LIST_NAV_IDS = new Set(['outstanding', 'new', 'shortlist', 'report'])

export function normalizeFunctionName(name: string): string {
  return name.toUpperCase().replace(/\s+/g, ' ').trim()
}

export function normalizeIntervalName(interval: string): string {
  return interval.toLowerCase().trim()
}

export function matchesFunctionFilter(signalFunction: string, selectedFilterIds: Set<string>): boolean {
  if (selectedFilterIds.size === 0) return true
  const fn = normalizeFunctionName(signalFunction)
  for (const id of selectedFilterIds) {
    const target = SIGNAL_FUNCTION_FILTERS[id]
    if (target && fn === normalizeFunctionName(target)) return true
    if (target && fn.includes(normalizeFunctionName(target))) return true
  }
  return false
}

export function matchesIntervalFilter(interval: string, filter: SignalIntervalFilter): boolean {
  if (filter === 'all') return true
  return normalizeIntervalName(interval) === filter
}

export function filterSignals(
  signals: Signal[],
  selectedFilterIds: Set<string>,
  interval: SignalIntervalFilter,
): Signal[] {
  return signals.filter(
    (s) => matchesFunctionFilter(s.function, selectedFilterIds) && matchesIntervalFilter(s.interval, interval),
  )
}

export function buildSignalsSummary(signals: Signal[], shortlisted = 0): SignalsSummary {
  const longs = signals.filter((s) => s.signal_type.toLowerCase().startsWith('l'))
  const shorts = signals.filter((s) => s.signal_type.toLowerCase().startsWith('s'))
  const longPct =
    longs.length > 0
      ? Math.round(longs.reduce((a, s) => a + s.win_rate, 0) / longs.length)
      : 0
  return {
    long: longs.length,
    short: shorts.length,
    long_pct: longPct,
    short_note: shorts.length ? `${shorts.length} active shorts` : 'no shorts',
    new_long: longs.length,
    new_short: shorts.length,
    shortlisted,
  }
}

export function activeFilterLabels(selectedFilterIds: Set<string>): string[] {
  return [...selectedFilterIds]
    .map((id) => SIGNAL_FUNCTION_FILTERS[id])
    .filter((name): name is string => Boolean(name))
}

export function signalListKey(signal: Signal): string {
  return `${signal.symbol}|${normalizeFunctionName(signal.function)}|${normalizeIntervalName(signal.interval)}`
}

export function shortlistRowKey(row: {
  symbol?: string | number | null
  function?: string | number | null
  interval?: string | number | null
}): string {
  return `${String(row.symbol ?? '')}|${normalizeFunctionName(String(row.function ?? ''))}|${normalizeIntervalName(String(row.interval ?? ''))}`
}

export function matchesShortlistRow(
  signal: Signal,
  rows: Array<{ symbol?: string | number | null; function?: string | number | null; interval?: string | number | null }>,
): boolean {
  if (!rows.length) return false
  const hasRichRows = rows.some((r) => r.function != null && r.interval != null)
  if (hasRichRows) {
    const keys = new Set(rows.map(shortlistRowKey))
    return keys.has(signalListKey(signal))
  }
  const symbols = new Set(rows.map((r) => String(r.symbol ?? '')))
  return symbols.has(signal.symbol)
}
