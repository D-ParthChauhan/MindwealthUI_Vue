export interface DataUpdatedAt {
  date?: string
  time?: string
  datetime?: string
  timezone?: string
}

export interface ApiMeta {
  data_updated_at?: DataUpdatedAt
  market_label?: string
  source_files?: Record<string, string>
}

export interface DashboardKpis {
  avg_win_rate: number | null
  avg_win_rate_display: string
  win_rate_mom: number | null
  win_rate_mom_display: string
  outstanding_count: number
  new_today: number
  sentiment_score: string
  sentiment_label: string
  overwatch_count: number
  overwatch_message: string
  sigma: string
}

export interface TopSignal {
  ticker: string
  function: string
  interval: string
  function_interval: string
  direction: string
  win_rate: number
  win_rate_display: string
  sentiment: 'bullish' | 'neutral' | 'cautious'
}

export interface FunctionSidebarItem {
  name: string
  subtitle: string
  status: 'green' | 'red'
}

export interface DashboardResponse {
  meta?: ApiMeta
  kpis: DashboardKpis
  top_signals: TopSignal[]
  functions_sidebar: FunctionSidebarItem[]
  degraded_strategy: string | null
  analyst_snippet: string
  win_rate_chart?: {
    properties: {
      x_axis: string
      y_axis: string
      metric: string
      row_count: number
      source_file?: string
      scope?: string
      reading_hint?: string
    }
    scale: {
      y_min: number
      y_max: number
      y_ticks: number[]
    }
    series: Array<{
      name: string
      color: string
      stroke_width?: number
      opacity?: number
      strategy?: string
      points: Array<{ x: string; y: number }>
    }>
  }
  regime?: {
    items: Array<{ label: string; pct: number }>
  }
}

export interface Signal {
  symbol: string
  function: string
  interval: string
  signal_type: string
  signal_date: string
  signal_price: number
  win_rate: number
  num_trades: number
  forward_wr: number | null
  spread: number | null
  sentiment_display?: string
  status?: 'active' | 'degraded'
  strategy_cagr?: number
  strategy_sharpe?: number
  confirmation_status?: string
  exit_status?: string
  current_mtm?: string
}

export interface SignalsSummary {
  long: number
  short: number
  long_pct: number
  short_note: string
  new_long: number
  new_short: number
  shortlisted?: number
}

export interface SignalsListResponse {
  meta?: ApiMeta
  summary: SignalsSummary
  signals: Signal[]
  function_counts?: Array<{ name: string; count: number }>
}

export interface SignalCountsResponse {
  outstanding: number
  new: number
  shortlisted: number
  pages?: Record<string, string>
}

export interface PerformanceRow {
  function: string
  strategy: string
  interval: string
  signal_type: string
  total_trades: number
  win_percentage: number
  max_holding_days?: number
  min_holding_days?: number
  avg_holding_days?: number
  best_profit: number
  worst_profit: number
  avg_profit: number
  avg_backtested_win_rate: number
  avg_backtested_holding_days?: number
}

export interface PerformanceResponse {
  meta?: ApiMeta
  rows: PerformanceRow[]
  aggregates?: {
    avg_win_rate: number
    total_trades: number
    avg_sharpe: number
  }
}

export interface OverwatchAlert {
  strategy: string
  interval: string
  signal_type: string
  win: number
  backtest: number
  gap: number
}

export type OverwatchAlertType = 'degradation' | 'runic' | 'system'

export interface OverwatchPanelAlert {
  id: string
  type: OverwatchAlertType
  label: string
  html: string
  recommendation?: string
  /** Four weekly FWD rate readings for degradation trend bars */
  fwd_trend?: number[]
  footer?: string
  created_at: string
}

export interface OverwatchSystemCheck {
  name: string
  status: 'ok' | 'warn' | 'fail'
  detail: string
}

export interface OverwatchResponse {
  meta?: ApiMeta
  alerts: OverwatchAlert[]
  count: number
  message: string
  panel_alerts?: OverwatchPanelAlert[]
  system_checks?: OverwatchSystemCheck[]
  kpis?: {
    backtest_wr: number
    forward_wr: number
    forced_portfolio_ytd: number
  }
  function_health?: Array<{
    name: string
    status: 'healthy' | 'degrading'
    bt_wr: number
    fwd_wr: number
    trades: number
    note?: string
  }>
  system_logs?: Array<{
    id: string
    type: 'ok' | 'delay' | 'warn'
    text: string
    time: string
    tag: string
  }>
}

export interface BreadthRow {
  function: string
  bullish_asset_percentage: number
  bullish_signal_percentage: number
}

export interface BreadthResponse {
  meta?: ApiMeta
  rows: BreadthRow[]
  sentiment: {
    score: string
    label: string
  }
}

export interface SentimentResponse {
  meta?: ApiMeta
  composite: {
    score: string
    label: string
  }
  signals: Signal[]
  layers?: {
    weekly: { score: number; label: string; items: SentimentLayerItem[] }
    daily: { score: number; label: string; items: SentimentLayerItem[] }
    positioning: { score: number; label: string; items: SentimentLayerItem[] }
  }
}

export interface SentimentLayerItem {
  label: string
  value: string
  sub?: string
  color?: string
  highlight?: boolean
}

export interface ShortlistResponse {
  meta?: ApiMeta
  count: number
  report_text: string
  rows?: Record<string, string>[]
}

export interface MonitoredTrade {
  trade_id: string
  symbol: string
  function: string
  interval: string
  signal_type: string
  signal_date: string
  signal_price: number
  current_price: number
  price_change_pct: number
  holding_period_days: number
  mark_to_market: number
  status: string
}

export interface MonitoredTradesResponse {
  meta?: ApiMeta
  last_updated: string
  trades: MonitoredTrade[]
}

export interface PortfolioPosition {
  cluster: string
  ticker: string
  direction: 'Long' | 'Short'
  meta: string
  dollar: number
  pct: number
  excluded?: boolean
}

export interface PortfolioResponse {
  meta?: ApiMeta
  regime: {
    vix: number
    vix_pct: number
    regime: string
    max_deploy: number
    ssi_multiplier: number
    credit_adj: number
    final_ceiling: number
    cash_pct: number
  }
  clusters: Array<{ id: string; pct: number; color: string }>
  positions: PortfolioPosition[]
  totals: {
    deployed: number
    deployed_pct: number
    cash: number
    cash_pct: number
    idle_cash_yield: number
  }
}

export interface ChatRequest {
  message: string
  session_id?: string | null
  signal_types?: string[]
  assets?: string[]
  from_date?: string
  to_date?: string
  functions?: string[]
  is_followup?: boolean
}

export interface ChatResponse {
  session_id: string
  reply: string
  metadata?: Record<string, unknown>
  error?: string
}

export interface ChatSessionsResponse {
  sessions: Array<{
    session_id: string
    title: string
    last_updated: string
    message_count: number
  }>
}

export interface RunicRegime {
  fed_cycle: string
  curve_regime: string
  geo_overlay: string
  val_regime: string
  liquidity: string
}

export interface RunicActiveCombo {
  combo: string
  duration_weeks?: number
  wk?: number
  bucket?: string
  status?: string
  mtm_pct?: number
}

export interface RunicWatchCombo {
  combo: string
  legs_confirmed: number
  pending: string
}

export interface RunicComboStatusRow {
  combo: string
  name: string
  status: string
  direction?: string
}

export interface RunicNightlyResponse {
  date: string
  regime: RunicRegime
  dominant_signal: string
  dominant_reason: string
  brave_fearful: string
  active_combos: RunicActiveCombo[]
  watch_combos: RunicWatchCombo[]
  cftc_status: 'CONFIRMED' | 'PENDING_3DAY_LAG'
  cftc_est_pctile?: string
  combo_c_cancel_fri: number
  wti_4wk_pct: number
  vix_bypass_active: boolean
  combo_e_status: 'CONFIRMED_2_OF_3' | 'CONFIRMED_3_OF_3'
  narrative: string
  vix?: number
  nfci_sigma?: string
  max_deploy_pct?: number
  regime_label?: string
  persistence_signals?: string[]
  combo_status_rows?: RunicComboStatusRow[]
  brave_fearful_display?: string
  tactical_position?: string
  strategic_position?: string
}

export interface RunicVariableRow {
  num: string
  name: string
  sub: string
  source: string
  compute: string
  current: string
  current_color?: string
  rare_gate: string
  extreme_gate: string
  tier: string
  tier_class: 't-norm' | 't-rare' | 't-ext' | 't-watch' | 't-pend'
  combos: string
  note: string
  note_color?: string
  row_highlight?: boolean
  vix_bypass?: boolean
}

export interface RunicVariablesResponse {
  date: string
  heatmap: Array<{ label: string; class: string; title: string }>
  variables: RunicVariableRow[]
}

export interface RunicAnalogReturn {
  val: string
  cls: 'pos' | 'neg' | 'tbd'
}

export interface RunicAnalogRow {
  date: string
  context: string
  wti?: string
  duration?: string
  cftc?: string
  cftc_color?: string
  mtm?: string
  mtm_style?: Record<string, string>
  max_dd: string
  max_dd_cls?: 'neg' | 'tbd'
  bottom_timing?: string
  returns: RunicAnalogReturn[]
  verdict: string
  verdict_class: string
  row_class?: 'now' | 'med' | ''
  date_color?: string
}

export interface RunicAnalogResponse {
  combo: string
  title: string
  subtitle: string
  title_color: string
  columns: string[]
  rows: RunicAnalogRow[]
  footnote?: string
}

export interface RunicCancelFridayRow {
  num: string
  date: string
  wti: string
  wti_leg: string
  data: string
  data_leg: string
  status: string
  badge_class: string
  highlight?: boolean
}

export interface RunicCancelTrackerResponse {
  combo_c_cancel_fri: number
  wti_4wk_pct: number
  friday_rows: RunicCancelFridayRow[]
  cancel_fridays: Array<{ label: string; filled: boolean; critical?: boolean }>
  f_window: {
    fire_date: string
    expires: string
    weeks_elapsed: number
    weeks_total: number
    mtm_pct: number
  }
}
