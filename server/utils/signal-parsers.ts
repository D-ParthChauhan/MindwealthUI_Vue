import type { PerformanceRow, Signal, SignalsSummary, TopSignal } from '~/types/api'

const SYM_COL = 'Symbol, Signal, Signal Date/Price[$]'
const WIN_COL = 'Win Rate [%], History Tested, Number of Trades'
const FWD_COL =
  'Forward Testing Win Rate[%]/No. of Analysed Trades/Avg Holding Period (days) (Across ALL Assets)'
const MTM_COL = 'Current Mark to Market and Holding Period'
const INTERVAL_COL = 'Interval, Confirmation Status'

export function parseSymbolField(raw: string): { symbol: string; signalType: string; signalDate: string; signalPrice: number } {
  const parts = raw.split(',').map((p) => p.trim())
  const symbol = parts[0] ?? raw
  const signalType = parts[1] ?? 'Long'
  const datePart = parts[2] ?? ''
  const dateMatch = datePart.match(/(\d{4}-\d{2}-\d{2})/)
  const priceMatch = datePart.match(/Price:\s*([\d.]+)/i)
  return {
    symbol,
    signalType,
    signalDate: dateMatch?.[1] ?? '',
    signalPrice: priceMatch ? Number(priceMatch[1]) : 0,
  }
}

export function parseWinRateField(raw: string): { winRate: number; numTrades: number } {
  const pctMatch = raw.match(/([\d.]+)%/)
  const tradesMatch = raw.match(/,\s*(\d+)\s*$/) || raw.match(/,\s*(\d+),/)
  const trailingNum = raw.split(',').pop()?.trim()
  const num = tradesMatch?.[1] ? Number(tradesMatch[1]) : trailingNum && /^\d+$/.test(trailingNum) ? Number(trailingNum) : 0
  return {
    winRate: pctMatch ? Number(pctMatch[1]) : 0,
    numTrades: num,
  }
}

export function parseForwardWinRate(raw: unknown): number | null {
  if (raw == null || raw === 'No Information') return null
  const s = String(raw)
  const m = s.match(/^([\d.]+)%/)
  return m ? Number(m[1]) : null
}

export function parseSpread(raw: unknown): number | null {
  if (raw == null) return null
  const s = String(raw).replace('%', '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function parseMtmText(raw: unknown): string {
  if (raw == null) return '—'
  const s = String(raw)
  const pct = s.split(',')[0]?.trim()
  return pct || s
}

export function parsePercentValue(raw: unknown): number {
  if (raw == null) return 0
  const s = String(raw).replace('%', '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function recordToSignal(rec: Record<string, unknown>): Signal {
  const symRaw = String(rec[SYM_COL] ?? rec.symbol ?? '')
  const { symbol, signalType, signalDate, signalPrice } = parseSymbolField(symRaw)
  const win = parseWinRateField(String(rec[WIN_COL] ?? '0%, 0'))
  const spread = parseSpread(rec.Spread)
  const forwardWr = parseForwardWinRate(rec[FWD_COL])
  const mtm = parseMtmText(rec[MTM_COL])
  const cagr = parsePercentValue(rec['Backtested Strategy CAGR [%]'])
  const sharpeRaw = rec['Backtested Strategy Sharpe Ratio']
  const sharpe = sharpeRaw != null && sharpeRaw !== 'No Information' ? Number(sharpeRaw) : 0

  const status =
    forwardWr != null && win.winRate && forwardWr < win.winRate - 10 ? 'degraded' : 'active'

  return {
    symbol,
    function: String(rec.Function ?? rec.function ?? ''),
    interval: String(rec.Interval ?? rec.interval ?? extractInterval(rec)),
    signal_type: signalType,
    signal_date: signalDate,
    signal_price: signalPrice,
    win_rate: win.winRate,
    num_trades: win.numTrades,
    forward_wr: forwardWr,
    spread,
    strategy_cagr: cagr,
    strategy_sharpe: Number.isFinite(sharpe) ? sharpe : 0,
    confirmation_status: String(rec[INTERVAL_COL] ?? ''),
    exit_status: String(rec['Exit Signal Date/Price[$]'] ?? 'N/A'),
    current_mtm: mtm,
    status,
    raw_fields: { ...rec },
  }
}

/** Rebuild overlay-style fields from a parsed signal (mock / legacy rows). */
export function signalToRawFields(s: Signal): Record<string, unknown> {
  if (s.raw_fields && Object.keys(s.raw_fields).length > 0) return { ...s.raw_fields }
  return {
    Function: s.function,
    Interval: s.interval,
    [SYM_COL]: `${s.symbol}, ${s.signal_type}, ${s.signal_date} Price: ${s.signal_price}`,
    [WIN_COL]: `${s.win_rate}%, ${s.num_trades}`,
    [FWD_COL]: s.forward_wr != null ? `${s.forward_wr}%` : 'No Information',
    Spread: s.spread ?? 'No Information',
    [MTM_COL]: s.current_mtm ?? '—',
    [INTERVAL_COL]: s.confirmation_status ?? '',
    'Exit Signal Date/Price[$]': s.exit_status ?? 'N/A',
    'Backtested Strategy CAGR [%]': s.strategy_cagr ?? 'No Information',
    'Backtested Strategy Sharpe Ratio': s.strategy_sharpe ?? 'No Information',
  }
}

function extractInterval(rec: Record<string, unknown>): string {
  const conf = String(rec[INTERVAL_COL] ?? '')
  const m = conf.match(/^(Daily|Weekly|Monthly|Quarterly|Yearly)/i)
  return m ? m[1] : ''
}

export function recordsToSignals(records: Record<string, unknown>[]): Signal[] {
  return records.map(recordToSignal).filter((s) => s.symbol && s.function)
}

export function buildSignalsSummary(signals: Signal[], shortlisted = 0): SignalsSummary {
  const longs = signals.filter((s) => s.signal_type.toLowerCase().startsWith('l'))
  const shorts = signals.filter((s) => s.signal_type.toLowerCase().startsWith('s'))
  const longPct =
    longs.length > 0
      ? Math.round(longs.reduce((a, s) => a + s.win_rate, 0) / longs.length)
      : 0
  const degradedShort = shorts.find(
    (s) => s.forward_wr != null && s.win_rate && s.forward_wr < s.win_rate - 10,
  )
  return {
    long: longs.length,
    short: shorts.length,
    long_pct: longPct,
    short_note: degradedShort
      ? `review ${degradedShort.function}`
      : shorts.length
        ? `${shorts.length} active shorts`
        : 'no shorts',
    new_long: longs.length,
    new_short: shorts.length,
    shortlisted,
  }
}

export function signalToTopSignal(s: Signal): TopSignal {
  const spread = s.spread ?? 0
  let sentiment: TopSignal['sentiment'] = 'neutral'
  if (spread >= 0.3) sentiment = 'bullish'
  else if (s.status === 'degraded' || spread <= -0.3) sentiment = 'cautious'
  return {
    ticker: s.symbol,
    function: s.function,
    interval: s.interval,
    function_interval: `${s.function} · ${s.interval}`,
    direction: s.signal_type,
    win_rate: s.win_rate,
    win_rate_display: `${s.win_rate.toFixed(1)}%`,
    sentiment,
  }
}

export function performanceRecordToRow(rec: Record<string, unknown>): PerformanceRow | null {
  const fn = String(rec.Function ?? '')
  if (!fn || fn === 'Forward Testing') return null
  const strategy = fn.toUpperCase().replace(/\s+/g, '_')
  const profitField = String(rec['Profit [%] (Max/Min/Avg.)'] ?? '')
  const profits = profitField.match(/([\d.-]+)%/g)?.map((p) => Number(p.replace('%', ''))) ?? [0, 0, 0]
  const holding = String(rec['Holding Period (days) (Max/Min/Avg)'] ?? '')
  const holdDays = holding.match(/([\d.]+)\s*days?/gi)?.map((d) => Number(d.replace(/[^\d.]/g, ''))) ?? []

  return {
    function: fn,
    strategy,
    interval: String(rec.Interval ?? ''),
    signal_type: String(rec['Signal Type'] ?? 'Long'),
    total_trades: Number(rec['Total Analysed Trades'] ?? 0),
    win_percentage: parsePercentValue(rec['Win Percentage']),
    max_holding_days: holdDays[0],
    min_holding_days: holdDays[1],
    avg_holding_days: holdDays[2],
    best_profit: profits[0] ?? 0,
    worst_profit: profits[1] ?? 0,
    avg_profit: profits[2] ?? 0,
    avg_backtested_win_rate: parsePercentValue(rec['Avg Backtested Win Rate [%]']),
    avg_backtested_holding_days: parseDaysFromText(rec['Avg Backtested Holding Period (days)']),
  }
}

function parseDaysFromText(raw: unknown): number | undefined {
  if (raw == null) return undefined
  const s = String(raw)
  const years = s.match(/([\d.]+)\s*years?/i)
  if (years) return Math.round(Number(years[1]) * 365)
  const days = s.match(/([\d.]+)\s*days?/i)
  return days ? Math.round(Number(days[1])) : undefined
}

export function parseForwardTestingRows(records: Record<string, unknown>[]) {
  return records
    .filter((r) => String(r.Function ?? '') === 'Forward Testing')
    .map((r) => {
      const strategy = String(r.Strategy ?? r.strategy ?? '')
      const fwd = parsePercentValue(r['Win Percentage'])
      const backtest = parsePercentValue(r['Avg Backtested Win Rate [%]'])
      return {
        strategy,
        interval: String(r.Interval ?? ''),
        signal_type: String(r['Signal Type'] ?? ''),
        win: fwd,
        backtest,
        gap: Math.round((fwd - backtest) * 10) / 10,
      }
    })
    .filter((a) => a.win < a.backtest - 10)
}
