import type { Signal, TopSignal } from '~/types/api'
import { abbreviateFunction, abbreviateInterval, signalKey } from '~/utils/signal-detail'

export type SignalHealthStatus = 'active' | 'degraded'

/** Read FWD health status from backend CSV / enriched fields only — never derived from WR gap. */
export function parseSignalStatusFromRaw(
  raw: Record<string, unknown>,
): SignalHealthStatus | undefined {
  const candidates = [
    raw.status,
    raw.signal_status,
    raw.fwd_status,
    raw.fwd_degraded,
    raw.fwd_degrading,
    raw['Signal Status'],
    raw['FWD Status'],
    raw['FWD Degraded'],
    raw['FWD Degrading'],
  ]

  for (const value of candidates) {
    if (value == null || value === '' || value === 'No Information') continue
    if (typeof value === 'boolean') return value ? 'degraded' : 'active'
    const text = String(value).toLowerCase().trim()
    if (
      text === 'degraded' ||
      text === 'fwd degraded' ||
      text === 'fwd_degraded' ||
      text === 'fwd degrading' ||
      text === 'fwd_degrading' ||
      text === 'degrading'
    ) {
      return 'degraded'
    }
    if (text === 'active' || text === 'healthy' || text === 'ok') return 'active'
    if (text === 'true' || text === 'yes' || text === '1') return 'degraded'
    if (text === 'false' || text === 'no' || text === '0') return 'active'
  }

  return undefined
}

export function deriveSignalStatus(s: Signal): SignalHealthStatus {
  if (s.status === 'degraded') return 'degraded'
  if (s.status === 'active') return 'active'
  if (s.raw_fields) {
    const fromRaw = parseSignalStatusFromRaw(s.raw_fields)
    if (fromRaw === 'degraded') return 'degraded'
    if (fromRaw === 'active') return 'active'
  }
  // No explicit backend status — treat as active unless check-degradation marked degraded.
  return 'active'
}

export function sentimentDisplay(spread: number | null): string {
  if (spread == null) return 'neutral'
  if (spread >= 0.3) return `+${spread.toFixed(1)} bullish`
  if (spread <= -0.3) return `${spread.toFixed(1)} caution`
  return `${spread >= 0 ? '+' : ''}${spread.toFixed(1)} neutral`
}

export function winRateClass(wr: number): string {
  if (wr >= 85) return 'hi'
  if (wr >= 70) return 'mid'
  return 'lo'
}

export function sentimentTagClass(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('bullish') || t.includes('aligned') || t.includes('combo')) return 'aligned'
  if (t.includes('caution') || t.includes('degraded')) return 'caution'
  if (t.includes('degraded') || t.includes('bear')) return 'degraded'
  return 'neutral'
}

export function formatDirection(type: string): 'LONG' | 'SHORT' {
  return type.toLowerCase().startsWith('s') ? 'SHORT' : 'LONG'
}

export function formatSignalDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function mapSignalRow(s: Signal) {
  const status = deriveSignalStatus(s)
  const sentiment = s.sentiment_display ?? sentimentDisplay(s.spread)
  return {
    key: signalKey(s),
    signal: s,
    ticker: s.symbol,
    function: s.function,
    functionShort: abbreviateFunction(s.function),
    interval: s.interval,
    intervalShort: abbreviateInterval(s.interval),
    direction: formatDirection(s.signal_type),
    btWr: `${s.win_rate.toFixed(1)}%`,
    btClass: winRateClass(s.win_rate),
    fwdWr: s.forward_wr != null ? `${s.forward_wr.toFixed(1)}%` : '—',
    fwdClass: s.forward_wr != null ? winRateClass(s.forward_wr) : '',
    date: formatSignalDate(s.signal_date),
    tag: sentiment,
    tagClass: sentimentTagClass(sentiment),
    status: status === 'degraded' ? '⚠ degraded FWD' : '✓ active',
    statusColor: status === 'degraded' ? 'var(--gold)' : 'var(--green)',
    fwdDegraded: status === 'degraded',
    functionFilter: s.function.toUpperCase(),
  }
}

export function mapTopSignalRow(s: TopSignal, degradedStrategy?: string | null) {
  const direction = formatDirection(s.direction)
  const tagText =
    s.sentiment === 'bullish'
      ? 'Combo F'
      : s.sentiment === 'cautious'
        ? '⚠ FWD degraded'
        : '+0.4 neutral'
  const isDegraded =
    s.sentiment === 'cautious' ||
    !!(degradedStrategy && s.function.toLowerCase().includes(degradedStrategy.toLowerCase()))
  return {
    ticker: s.ticker,
    functionInterval: s.function_interval || `${s.function} · ${s.interval}`,
    direction,
    wr: s.win_rate_display || `${s.win_rate}%`,
    wrClass: winRateClass(s.win_rate),
    tag: tagText,
    tagClass: sentimentTagClass(tagText),
    fwdDegraded: isDegraded,
  }
}
