import type { Signal, TopSignal } from '~/types/api'

export function deriveSignalStatus(s: Signal): 'active' | 'degraded' {
  if (s.status) return s.status
  if (s.forward_wr != null && s.win_rate && s.forward_wr < s.win_rate - 10) return 'degraded'
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
    ticker: s.symbol,
    function: s.function,
    interval: s.interval,
    direction: formatDirection(s.signal_type),
    btWr: `${s.win_rate.toFixed(1)}%`,
    btClass: winRateClass(s.win_rate),
    fwdWr: s.forward_wr != null ? `${s.forward_wr.toFixed(1)}%` : '—',
    fwdClass: s.forward_wr != null ? winRateClass(s.forward_wr) : '',
    date: formatSignalDate(s.signal_date),
    tag: sentiment,
    tagClass: sentimentTagClass(sentiment),
    status: status === 'active' ? '✓ active' : '⚠ degraded FWD',
    statusColor: status === 'active' ? 'var(--green)' : 'var(--gold)',
    dimmed: status === 'degraded',
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
    dimmed: isDegraded,
  }
}
