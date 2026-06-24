import type { Signal } from '~/types/api'

export interface WrAggregateRow {
  win_percentage?: number | null
  avg_backtested_win_rate?: number | null
  total_trades?: number | null
}

export interface WrAggregates {
  avg_forward_wr: number | null
  avg_backtest_wr: number | null
  total_trades: number | null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Trade-weighted forward WR; equal-weight backtest WR across strategy rows. */
export function computeWrAggregatesFromRows(rows: WrAggregateRow[]): WrAggregates {
  const valid = rows.filter(
    (r) => Number.isFinite(r.win_percentage) && Number.isFinite(r.avg_backtested_win_rate),
  )
  if (!valid.length) {
    return { avg_forward_wr: null, avg_backtest_wr: null, total_trades: null }
  }

  const totalTrades = valid.reduce((sum, r) => sum + (r.total_trades ?? 0), 0)
  const avg_forward_wr =
    totalTrades > 0
      ? valid.reduce((sum, r) => sum + (r.win_percentage ?? 0) * (r.total_trades ?? 0), 0) / totalTrades
      : valid.reduce((sum, r) => sum + (r.win_percentage ?? 0), 0) / valid.length
  const avg_backtest_wr =
    valid.reduce((sum, r) => sum + (r.avg_backtested_win_rate ?? 0), 0) / valid.length

  return {
    avg_forward_wr: round1(avg_forward_wr),
    avg_backtest_wr: round1(avg_backtest_wr),
    total_trades: totalTrades > 0 ? totalTrades : null,
  }
}

/** Claude shortlist / outstanding signals — forward_wr + backtest win_rate per row. */
export function computeWrAggregatesFromSignals(signals: Signal[]): WrAggregates {
  const valid = signals.filter(
    (s) => Number.isFinite(s.forward_wr) && Number.isFinite(s.win_rate),
  )
  if (!valid.length) {
    return { avg_forward_wr: null, avg_backtest_wr: null, total_trades: null }
  }

  const avg_forward_wr =
    valid.reduce((sum, s) => sum + (s.forward_wr ?? 0), 0) / valid.length
  const avg_backtest_wr =
    valid.reduce((sum, s) => sum + s.win_rate, 0) / valid.length
  const totalTrades = valid.reduce((sum, s) => sum + (s.num_trades ?? 0), 0)

  return {
    avg_forward_wr: round1(avg_forward_wr),
    avg_backtest_wr: round1(avg_backtest_wr),
    total_trades: totalTrades > 0 ? totalTrades : null,
  }
}

export function resolveWrAggregates(
  api: {
    avg_win_rate?: number | null
    avg_backtest_win_rate?: number | null
    total_trades?: number | null
  },
  fromRows: WrAggregates,
  fromSignals?: WrAggregates,
): WrAggregates & { source: 'api' | 'rows' | 'signals' } {
  const avg_forward_wr =
    api.avg_win_rate ?? fromRows.avg_forward_wr ?? fromSignals?.avg_forward_wr ?? null
  const avg_backtest_wr =
    api.avg_backtest_win_rate ?? fromRows.avg_backtest_wr ?? fromSignals?.avg_backtest_wr ?? null
  const total_trades =
    api.total_trades ?? fromRows.total_trades ?? fromSignals?.total_trades ?? null

  let source: 'api' | 'rows' | 'signals' = 'rows'
  if (api.avg_win_rate != null && api.avg_backtest_win_rate != null) {
    source = 'api'
  } else if (fromRows.avg_forward_wr != null && fromRows.avg_backtest_wr != null) {
    source = 'rows'
  } else if (fromSignals?.avg_forward_wr != null && fromSignals?.avg_backtest_wr != null) {
    source = 'signals'
  }

  return { avg_forward_wr, avg_backtest_wr, total_trades, source }
}
