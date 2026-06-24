import { getUnavailablePortfolio } from './unavailable-data'
import { signalToRawFields } from './signal-parsers'
import type {
  ApiMeta,
  BreadthResponse,
  CombinedPerformanceReportResponse,
  CombinedPerformanceReportRow,
  DashboardResponse,
  HorizontalNewHighResponse,
  MonitoredTradesResponse,
  OverwatchResponse,
  PerformanceResponse,
  PortfolioResponse,
  SentimentResponse,
  ShortlistResponse,
  Signal,
  SignalCountsResponse,
  SignalsListResponse,
} from '~/types/api'

export const mockMeta: ApiMeta = {
  data_updated_at: {
    date: '2026-05-12',
    time: '09:21:00',
    datetime: '2026-05-12T09:21:00+05:30',
    timezone: 'IST',
  },
  market_label: 'US Market',
  source_files: {
    outstanding_signal: 'trade_store/US/2026-05-12_outstanding_signal.csv',
    combined_performance_report: 'trade_store/US/2026-05-12_combined_performance_report.csv',
  },
}

const mockSignals: Signal[] = [
  {
    symbol: 'AAPL',
    function: 'FRACTAL TRACK',
    interval: 'Monthly',
    signal_type: 'Long',
    signal_date: '2026-05-02',
    signal_price: 193.89,
    win_rate: 100,
    num_trades: 85,
    forward_wr: 96.2,
    spread: 0.42,
    strategy_cagr: 24.3,
    strategy_sharpe: 1.4,
    confirmation_status: 'Monthly, Confirmed',
    exit_status: 'N/A',
    current_mtm: '+4.2%',
  },
  {
    symbol: 'JPM',
    function: 'FRACTAL TRACK',
    interval: 'Monthly',
    signal_type: 'Long',
    signal_date: '2026-04-28',
    signal_price: 198.5,
    win_rate: 100,
    num_trades: 72,
    forward_wr: 96.2,
    spread: 0.42,
    strategy_cagr: 22.1,
    strategy_sharpe: 1.3,
    confirmation_status: 'Monthly, Confirmed',
    exit_status: 'N/A',
    current_mtm: '+3.1%',
  },
  {
    symbol: 'META',
    function: 'TRENDPULSE',
    interval: 'Weekly',
    signal_type: 'Long',
    signal_date: '2026-05-05',
    signal_price: 580.2,
    win_rate: 92.9,
    num_trades: 64,
    forward_wr: 89.4,
    spread: 0.15,
    strategy_cagr: 21.5,
    strategy_sharpe: 1.2,
    confirmation_status: 'Weekly, Confirmed',
    exit_status: 'N/A',
    current_mtm: '+2.8%',
  },
  {
    symbol: 'QQQ',
    function: 'SIGMASHELL',
    interval: 'Weekly',
    signal_type: 'Long',
    signal_date: '2026-05-06',
    signal_price: 512.4,
    win_rate: 87.4,
    num_trades: 58,
    forward_wr: 84.1,
    spread: 0.35,
    strategy_cagr: 19.8,
    strategy_sharpe: 1.1,
    confirmation_status: 'Weekly, stoch cross-50',
    exit_status: 'N/A',
    current_mtm: '+1.9%',
  },
  {
    symbol: 'TSLA',
    function: 'DELTADRIFT',
    interval: 'Daily',
    signal_type: 'Short',
    signal_date: '2026-05-09',
    signal_price: 245.3,
    win_rate: 88,
    num_trades: 9,
    forward_wr: 71.3,
    spread: 0.38,
    strategy_cagr: 18.2,
    strategy_sharpe: 0.9,
    confirmation_status: 'Daily, Active',
    exit_status: 'N/A',
    current_mtm: '-1.2%',
  },
  {
    symbol: 'BAC',
    function: 'FRACTAL TRACK',
    interval: 'Monthly',
    signal_type: 'Long',
    signal_date: '2026-05-10',
    signal_price: 38.2,
    win_rate: 94.3,
    num_trades: 41,
    forward_wr: 91.0,
    spread: 0.28,
    strategy_cagr: 20.1,
    strategy_sharpe: 1.0,
    confirmation_status: 'Monthly, New',
    exit_status: 'N/A',
    current_mtm: '+0.8%',
  },
  {
    symbol: 'ASML',
    function: 'TRENDPULSE',
    interval: 'Weekly',
    signal_type: 'Long',
    signal_date: '2026-05-11',
    signal_price: 920.5,
    win_rate: 91.2,
    num_trades: 33,
    forward_wr: 88.5,
    spread: 0.22,
    strategy_cagr: 23.4,
    strategy_sharpe: 1.15,
    confirmation_status: 'Weekly, New',
    exit_status: 'N/A',
    current_mtm: '+1.1%',
  },
]

export function getMockMeta(): ApiMeta {
  return mockMeta
}

export function getMockSignalCounts(): SignalCountsResponse {
  return {
    outstanding: 63,
    new: 7,
    shortlisted: 7,
    pages: mockMeta.source_files,
  }
}

export function getMockDashboard(): DashboardResponse {
  const performance = getMockPerformance()
  return {
    meta: mockMeta,
    kpis: {
      avg_win_rate: 89.9,
      avg_win_rate_display: '89.9%',
      win_rate_mom: 2.1,
      win_rate_mom_display: '+2.1% MoM · all functions',
      outstanding_count: 63,
      new_today: 7,
      sentiment_score: '+0.4',
      sentiment_label: 'neutral · no trigger',
      overwatch_count: 1,
      overwatch_message: 'DeltaDrift short degradation',
      sigma: '−1.2σ',
    },
    top_signals: [
      {
        ticker: 'AAPL',
        function: 'Fractal Track',
        interval: 'Monthly',
        function_interval: 'Fractal Track · Monthly',
        direction: 'Long',
        win_rate: 100,
        win_rate_display: '100%',
        sentiment: 'bullish',
      },
      {
        ticker: 'QQQ',
        function: 'SigmaShell',
        interval: 'Weekly',
        function_interval: 'SigmaShell · Weekly',
        direction: 'Long',
        win_rate: 87.4,
        win_rate_display: '87.4%',
        sentiment: 'neutral',
      },
      {
        ticker: 'TSLA',
        function: 'DeltaDrift',
        interval: 'Daily',
        function_interval: 'DeltaDrift · Daily',
        direction: 'Short',
        win_rate: 71.3,
        win_rate_display: '71.3%',
        sentiment: 'cautious',
      },
    ],
    functions_sidebar: [
      { name: 'Fractal Track', subtitle: 'fib_ret · 100% WR', status: 'green' },
      { name: 'TrendPulse', subtitle: 'trendline · 92.9%', status: 'green' },
      { name: 'DeltaDrift', subtitle: 'distance · ⚠ shorts', status: 'red' },
      { name: 'Band Matrix', subtitle: 'bollinger · 83%', status: 'green' },
      { name: 'SigmaShell', subtitle: 'sigma · z-score gated', status: 'green' },
      { name: 'PulseGauge', subtitle: 'sentiment · AAII+rules', status: 'green' },
      { name: 'Altitude Alpha', subtitle: 'new_high', status: 'green' },
      { name: 'Oscillator Delta', subtitle: 'divergence_comp', status: 'green' },
      { name: 'Baseline Divergence', subtitle: 'general_divergence', status: 'green' },
      { name: 'SBI', subtitle: 'signal breadth indicator', status: 'green' },
    ],
    degraded_strategy: 'DeltaDrift',
    analyst_snippet:
      'Fractal Track JPM+BAC Monthly confirming. DeltaDrift shorts showing forward test degradation — pause new shorts. SSI +0.4 neutral — no long/short trigger.',
    win_rate_chart: buildWinRateChart(performance.rows, performance.meta),
    regime: {
      items: [
        { label: 'Trending', pct: 38 },
        { label: 'Breakout', pct: 24 },
        { label: 'Mean Reversion', pct: 18 },
        { label: 'Other', pct: 20 },
      ],
    },
  }
}

const mockSignalsEnriched: Signal[] = mockSignals.map((s) => ({
  ...s,
  raw_fields: signalToRawFields(s),
}))

export function getMockSignalsOutstanding(): SignalsListResponse {
  return {
    meta: mockMeta,
    summary: {
      long: 48,
      short: 15,
      long_pct: 76,
      short_note: 'review DeltaDrift',
      new_long: 5,
      new_short: 2,
      shortlisted: 7,
    },
    signals: mockSignalsEnriched,
    function_counts: [
      { name: 'FRACTAL TRACK', count: 28 },
      { name: 'TRENDPULSE', count: 19 },
      { name: 'DELTADRIFT', count: 9 },
      { name: 'SIGMASHELL', count: 6 },
    ],
  }
}

export function getMockSignalsNew(): SignalsListResponse {
  const newSignals = mockSignalsEnriched.filter((s) =>
    ['2026-05-09', '2026-05-10', '2026-05-11'].includes(s.signal_date),
  )
  return {
    meta: mockMeta,
    summary: {
      long: 5,
      short: 2,
      long_pct: 82,
      short_note: 'review DeltaDrift',
      new_long: 5,
      new_short: 2,
      shortlisted: 7,
    },
    signals: newSignals,
    function_counts: getMockSignalsOutstanding().function_counts,
  }
}

export function getMockAllSignals(): SignalsListResponse {
  return {
    ...getMockSignalsOutstanding(),
    summary: {
      ...getMockSignalsOutstanding().summary,
      long: 120,
      short: 33,
      long_pct: 78,
      new_long: 0,
      new_short: 0,
      shortlisted: 0,
    },
    signals: [
      ...mockSignalsEnriched,
      ...mockSignalsEnriched.map((s, i) => ({ ...s, symbol: `${s.symbol}_${i}` })),
    ],
  }
}

export function getMockHorizontalNewHigh(): HorizontalNewHighResponse {
  return {
    meta: mockMeta,
    report_date: '2026-05-12',
    row_count: 3,
    rows: [
      {
        report_type: 'New High',
        symbol: 'AAPL',
        today_price: '$210.50',
        new_highest: '√ $212.00',
      },
      {
        report_type: 'Horizontal',
        symbol: 'MSFT',
        today_price: '$425.10',
        new_highest: '—',
      },
      {
        report_type: 'New High',
        symbol: 'NVDA',
        today_price: '$118.20',
        new_highest: '√ $119.80',
      },
    ],
  }
}

export function getMockCombinedPerformanceReport(): CombinedPerformanceReportResponse {
  const forward_testing: CombinedPerformanceReportRow[] = [
    {
      section: 'forward_testing',
      strategy: 'FRACTAL TRACK',
      interval: 'Monthly',
      signal_type: 'Long',
      total_trades: 85,
      win_percentage: 100,
      avg_backtested_win_rate: 88,
      best_profit: 32.5,
      worst_profit: -8.2,
      avg_profit: 12.1,
    },
    {
      section: 'forward_testing',
      strategy: 'DELTADRIFT',
      interval: 'Daily',
      signal_type: 'Short',
      total_trades: 9,
      win_percentage: 71.3,
      avg_backtested_win_rate: 88,
      best_profit: 18.2,
      worst_profit: -12.4,
      avg_profit: 6.8,
    },
    {
      section: 'forward_testing',
      strategy: 'TRENDPULSE',
      interval: 'Weekly',
      signal_type: 'Long',
      total_trades: 64,
      win_percentage: 92.9,
      avg_backtested_win_rate: 86,
      best_profit: 28.1,
      worst_profit: -9.5,
      avg_profit: 10.4,
    },
  ]
  const latest_performance: CombinedPerformanceReportRow[] = [
    {
      section: 'latest_performance',
      strategy: 'LATEST PERFORMANCE',
      interval: 'Weekly',
      signal_type: 'Long',
      total_trades: 48,
      win_percentage: 89.9,
      avg_backtested_win_rate: 88,
    },
  ]
  return {
    meta: mockMeta,
    report_date: '2026-05-12',
    forward_testing,
    latest_performance,
    aggregates: {
      avg_forward_wr: 88.1,
      avg_backtest_wr: 87.3,
      total_trades: 158,
      degrading_count: 1,
    },
  }
}

export function getMockPerformance(): PerformanceResponse {
  return {
    meta: mockMeta,
    rows: [
      {
        function: 'FRACTAL TRACK',
        strategy: 'FRACTAL_TRACK',
        interval: 'Monthly',
        signal_type: 'Long',
        total_trades: 85,
        win_percentage: 100,
        avg_backtested_win_rate: 88,
        best_profit: 32.5,
        worst_profit: -8.2,
        avg_profit: 12.1,
      },
      {
        function: 'DELTADRIFT',
        strategy: 'DELTADRIFT',
        interval: 'Daily',
        signal_type: 'Short',
        total_trades: 9,
        win_percentage: 71.3,
        avg_backtested_win_rate: 88,
        best_profit: 18.2,
        worst_profit: -12.4,
        avg_profit: 6.8,
      },
      {
        function: 'TRENDPULSE',
        strategy: 'TRENDPULSE',
        interval: 'Weekly',
        signal_type: 'Long',
        total_trades: 64,
        win_percentage: 92.9,
        avg_backtested_win_rate: 86,
        best_profit: 28.1,
        worst_profit: -9.5,
        avg_profit: 10.4,
      },
    ],
    aggregates: {
      avg_win_rate: 89.9,
      avg_cagr: 24.3,
      total_trades: 3821,
      avg_sharpe: 1.08,
    },
  }
}

export function getMockOverwatch(): OverwatchResponse {
  return {
    meta: mockMeta,
    alerts: [
      {
        strategy: 'DeltaDrift',
        interval: 'Daily',
        signal_type: 'Short',
        win: 71.3,
        backtest: 88,
        gap: -16.7,
      },
    ],
    count: 1,
    message: 'DeltaDrift short degradation',
    kpis: {
      backtest_wr: 87.3,
      forward_wr: 88.1,
    },
    function_health: [
      { name: 'FRACTAL TRACK', status: 'healthy', bt_wr: 100, fwd_wr: 96.2, trades: 85 },
      {
        name: 'DELTADRIFT · SHORT',
        status: 'degrading',
        bt_wr: 88,
        fwd_wr: 71.3,
        trades: 9,
        note: '71.3% is ABOVE 60% minimum threshold. Gap vs backtest exceeds 15pp watchpoint.',
      },
    ],
    system_logs: [
      {
        id: '1',
        type: 'ok',
        text: 'Yahoo Finance + FRED + CFTC: all resolved. SSI data: AAII+NAAIM+Put/Call+CNN loaded.',
        time: '18:10 ET today',
        tag: 'DATA',
      },
      {
        id: '2',
        type: 'delay',
        text: 'CFTC COT delayed — Friday release pending. Auto-retry 16:30 ET Fri. SSI reweighting Layer 3 accordingly.',
        time: '18:08 ET today',
        tag: 'DELAY',
      },
      {
        id: '3',
        type: 'ok',
        text: 'AUTO-FIX: pandas 2.3 warning on Band Matrix — patched .copy(). Conviction Engine daily_update() complete.',
        time: 'Yesterday 03:12 + 18:15 ET',
        tag: 'FIXED',
      },
    ],
  }
}

export function getMockBreadth(): BreadthResponse {
  return {
    meta: mockMeta,
    rows: [
      { function: 'Combined', bullish_asset_percentage: 62.5, bullish_signal_percentage: 58 },
      { function: 'Fractal Track', bullish_asset_percentage: 68, bullish_signal_percentage: 65 },
      { function: 'TrendPulse', bullish_asset_percentage: 55, bullish_signal_percentage: 52 },
    ],
    sentiment: {
      score: '+0.4',
      label: 'neutral · no trigger',
    },
  }
}

export function getMockSentiment(): SentimentResponse {
  return {
    meta: mockMeta,
    composite: { score: '+0.4', label: 'neutral · no trigger' },
    signals: mockSignals.slice(0, 4),
    layers: {
      weekly: {
        score: 0.6,
        label: 'AAII+NAAIM slightly bull',
        items: [
          { label: 'AAII Bull-Bear Spread · 30% weight', value: '+8.4', sub: 'Bulls 41% − Bears 33% · above BUY_THRESHOLD=10', color: 'var(--green)' },
          { label: 'NAAIM Exposure · 35% weight', value: '68%', sub: 'Actual equity exposure. Real money managers.', color: 'var(--green)' },
          { label: 'Put/Call 10wk EMA · 20% weight', value: '0.82', sub: 'Fear not fully absent.', color: 'var(--teal)' },
          { label: 'CNN Fear & Greed · 15% weight', value: '54', sub: 'Neutral. <20 = fear, >80 = greed.', color: 'var(--green)' },
        ],
      },
      daily: {
        score: 0.3,
        label: '3/6 confirming',
        items: [
          { label: 'VIX Term Structure', value: '1.08 ✓ contango', color: 'var(--green)' },
          { label: '%200DMA (^SPXA200R)', value: '62% ✓', color: 'var(--green)' },
          { label: 'McClellan (^NYMO)', value: '+24 ✓', color: 'var(--green)' },
          { label: 'HY Spreads (OAS)', value: '318bp · neutral', color: 'var(--teal)' },
          { label: 'Gate check (need ≥2)', value: '3 of 6 ✓ passing', color: 'var(--gold)', highlight: true },
        ],
      },
      positioning: {
        score: 0.2,
        label: 'FM 42nd · no squeeze',
        items: [
          { label: 'REAL MONEY (Asset Mgrs) · 3yr pct', value: '58th pct', sub: 'Pensions buying. Floor intact.', color: 'var(--green)' },
          { label: 'FAST MONEY (Lev Funds) · 3yr pct', value: '42nd pct', sub: 'Neutral. Squeeze = FM <30th.', color: 'var(--teal)' },
          { label: 'DBMF RBSA · Intraday CTA est', value: '+0.3 long eq', sub: 'Lasso regression · CTAs net long', color: 'var(--green)' },
        ],
      },
    },
  }
}

export function getMockShortlist(): ShortlistResponse {
  return {
    meta: mockMeta,
    count: 7,
    report_text:
      'Claude shortlisted 7 signals with cross-function confirmation. AAPL and JPM Fractal Track Monthly align with breadth +0.4. DeltaDrift shorts flagged for degradation review.',
    rows: mockSignals.slice(0, 3).map((s) => ({ symbol: s.symbol, function: s.function })),
  }
}

export function getMockMonitoredTrades(): MonitoredTradesResponse {
  return {
    meta: mockMeta,
    last_updated: '2026-05-12T14:30:00',
    trades: [
      {
        trade_id: 'AAPL_2026-01-16_Daily_Long_FRACTAL_TRACK',
        symbol: 'AAPL',
        function: 'FRACTAL TRACK',
        interval: 'Daily',
        signal_type: 'Long',
        signal_date: '2026-01-16',
        signal_price: 193.89,
        current_price: 210.5,
        price_change_pct: 8.6,
        holding_period_days: 116,
        mark_to_market: 16.61,
        status: 'open',
      },
    ],
  }
}

export function getMockPortfolio(): PortfolioResponse {
  return getUnavailablePortfolio()
}
