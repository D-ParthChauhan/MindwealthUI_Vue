import type { Signal } from '~/types/api'
import { sentimentDisplay } from '~/utils/signals'

export function signalKey(s: Signal): string {
  return `${s.symbol}|${s.function}|${s.signal_date}|${s.interval}|${s.signal_type}`
}

const FUNCTION_ABBREV: Record<string, string> = {
  'FRACTAL TRACK': 'FT',
  'TRENDPULSE': 'TP',
  'SIGMASHELL': 'SS',
  'DELTADRIFT': 'DD',
  'OSCILLATOR DELTA': 'OD',
  'BASELINEDIVERGENCE': 'BD',
  'ALTITUDE ALPHA': 'AA',
  'PULSEGAUGE': 'PG',
  'SEQUENCE SIGNAL': 'SQ',
  'HORIZONTAL NEW HIGH': 'HNH',
}

const INTERVAL_ABBREV: Record<string, string> = {
  Daily: 'D',
  Weekly: 'W',
  Monthly: 'M',
  Quarterly: 'Q',
  Yearly: 'Y',
}

export function abbreviateFunction(name: string): string {
  const key = name.trim().toUpperCase()
  if (FUNCTION_ABBREV[key]) return FUNCTION_ABBREV[key]
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 4)
  return name.slice(0, 4).toUpperCase()
}

export function abbreviateInterval(interval: string): string {
  return INTERVAL_ABBREV[interval] ?? interval.slice(0, 1).toUpperCase()
}

export interface SignalDetailField {
  key: string
  label: string
  value: string
  tone?: 'pos' | 'neg' | 'warn' | 'muted'
}

export interface SignalDetailSection {
  id: string
  title: string
  fields: SignalDetailField[]
}

const PARSED_FIELD_KEYS = new Set([
  'Function',
  'function',
  'Interval',
  'interval',
  'Symbol, Signal, Signal Date/Price[$]',
  'symbol',
])

const CONVICTION_KEY_RE =
  /conviction|verdict|rationale|bq_|fs_|fd_|yield|position_layers|size_cap|tax/i
const PERFORMANCE_KEY_RE =
  /win rate|win percentage|sharpe|cagr|profit|holding|trades|spread|backtest|forward testing|mark to market|mtm/i
const EXIT_KEY_RE = /exit|target|stop|take.?profit/i

/** Suffix stripped from overlay column names; shown once in the panel footer. */
export const SIGNAL_DETAIL_ACROSS_ALL_NOTE =
  'No. of Analysed Trades · Avg Holding Period (days) (Across ALL Assets)'

const ACROSS_ALL_SUFFIX_RAW =
  /\/No\. of Analysed Trades\/Avg Holding Period \(days\) \(Across ALL Assets\)/gi

function rawKeyHasAcrossAllSuffix(key: string): boolean {
  return /No\. of Analysed Trades\/Avg Holding Period \(days\) \(Across ALL Assets\)/i.test(key)
}

function humanizeKey(key: string): string {
  return key
    .replace(ACROSS_ALL_SUFFIX_RAW, '')
    .replace(/\[%\]/g, '')
    .replace(/\[\$%\]/g, '')
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isEmptyRawValue(raw: unknown): boolean {
  if (raw == null) return true
  const s = String(raw).trim()
  return !s || s === '—' || /^no information$/i.test(s) || s === 'N/A'
}

function formatDetailValue(raw: unknown): string {
  if (raw == null) return '—'
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw, null, 2)
    } catch {
      return String(raw)
    }
  }
  return String(raw).trim() || '—'
}

function toneForField(key: string, value: string): SignalDetailField['tone'] | undefined {
  const k = key.toLowerCase()
  const v = value.toLowerCase()
  if (/degraded|yield trap|caution|short/i.test(v) && /verdict|status|signal/i.test(k)) return 'warn'
  if (/conviction|bq|spread/i.test(k)) {
    const n = Number(value.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(n)) {
      if (n > 0) return 'pos'
      if (n < 0) return 'neg'
    }
  }
  if (/%/.test(value)) {
    const n = Number(value.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(n) && n >= 85) return 'pos'
    if (Number.isFinite(n) && n < 60) return 'neg'
  }
  return undefined
}

function pushField(
  bucket: SignalDetailField[],
  key: string,
  label: string,
  raw: unknown,
) {
  if (isEmptyRawValue(raw)) return
  const value = formatDetailValue(raw)
  bucket.push({ key, label, value, tone: toneForField(key, value) })
}

function classifyRawField(key: string): 'conviction' | 'performance' | 'exit' | 'other' {
  if (CONVICTION_KEY_RE.test(key)) return 'conviction'
  if (EXIT_KEY_RE.test(key)) return 'exit'
  if (PERFORMANCE_KEY_RE.test(key)) return 'performance'
  return 'other'
}

export function buildSignalDetailSections(signal: Signal): SignalDetailSection[] {
  return buildSignalDetailLayout(signal).sections
}

export interface SignalDetailLayout {
  headerFields: SignalDetailField[]
  sections: SignalDetailSection[]
  showAcrossAllNote: boolean
}

export function buildSignalDetailLayout(signal: Signal): SignalDetailLayout {
  const sentiment = signal.sentiment_display ?? sentimentDisplay(signal.spread)

  const headerFields: SignalDetailField[] = []
  pushField(headerFields, 'function', 'Function', signal.function)
  pushField(headerFields, 'interval', 'Interval', signal.interval)
  pushField(headerFields, 'signal_date', 'Date', signal.signal_date)
  pushField(headerFields, 'signal_price', 'Price', `$${signal.signal_price}`)
  pushField(headerFields, 'sentiment', 'Sentiment', sentiment)
  pushField(headerFields, 'confirmation_status', 'Confirmation', signal.confirmation_status)

  const performanceFields: SignalDetailField[] = []
  pushField(performanceFields, 'win_rate', 'Backtest win rate', `${signal.win_rate.toFixed(1)}%`)
  pushField(performanceFields, 'num_trades', 'Trades analysed', signal.num_trades)
  pushField(
    performanceFields,
    'forward_wr',
    'Forward win rate',
    signal.forward_wr != null ? `${signal.forward_wr.toFixed(1)}%` : null,
  )
  pushField(performanceFields, 'spread', 'Spread', signal.spread)
  pushField(
    performanceFields,
    'strategy_cagr',
    'Strategy CAGR',
    signal.strategy_cagr != null ? `${signal.strategy_cagr}%` : null,
  )
  pushField(performanceFields, 'strategy_sharpe', 'Sharpe ratio', signal.strategy_sharpe)
  pushField(performanceFields, 'current_mtm', 'Mark to market', signal.current_mtm)

  const exitFields: SignalDetailField[] = []
  pushField(exitFields, 'exit_status', 'Exit signal', signal.exit_status)

  const convictionFields: SignalDetailField[] = []
  const otherFields: SignalDetailField[] = []
  let showAcrossAllNote = false

  const raw = signal.raw_fields ?? {}
  const usedKeys = new Set<string>([...PARSED_FIELD_KEYS])

  for (const [key, value] of Object.entries(raw)) {
    if (PARSED_FIELD_KEYS.has(key) || usedKeys.has(key) || isEmptyRawValue(value)) continue
    if (rawKeyHasAcrossAllSuffix(key)) showAcrossAllNote = true
    usedKeys.add(key)
    const label = humanizeKey(key)
    const field: SignalDetailField = {
      key,
      label,
      value: formatDetailValue(value),
      tone: toneForField(key, formatDetailValue(value)),
    }
    const bucket = classifyRawField(key)
    if (bucket === 'conviction') convictionFields.push(field)
    else if (bucket === 'performance') performanceFields.push(field)
    else if (bucket === 'exit') exitFields.push(field)
    else otherFields.push(field)
  }

  const sections: SignalDetailSection[] = []
  if (performanceFields.length) {
    sections.push({ id: 'performance', title: 'Performance', fields: performanceFields })
  }
  if (exitFields.length) sections.push({ id: 'exit', title: 'Exit & targets', fields: exitFields })
  if (convictionFields.length) {
    sections.push({ id: 'conviction', title: 'Conviction overlay', fields: convictionFields })
  }
  if (otherFields.length) {
    sections.push({ id: 'raw', title: 'Additional fields', fields: otherFields })
  }
  return { headerFields, sections, showAcrossAllNote }
}
