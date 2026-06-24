export type ApiDataSource = 'live' | 'mock' | 'unavailable'

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
  data_source?: ApiDataSource
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
  /** Full overlay CSV row as returned by the API (all columns). */
  raw_fields?: Record<string, unknown>
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
  report_date?: string | null
  outstanding_detail?: SignalCountBucket
  new_detail?: SignalCountBucket
  shortlist_detail?: { total: number }
  pages?: Record<string, string>
}

export interface SignalTierCounts {
  tA?: number
  best?: number
  tierc?: number
  exit?: number
}

export interface SignalCountBucket {
  total: number
  long: number
  short: number
  exited?: number
  tier_counts?: SignalTierCounts
}

export interface SignalSurfaceRecord {
  symbol: string
  function?: string
  Function?: string
  interval?: string
  direction?: string
  composite_score?: number
  window_remaining_pct?: number
  tier?: string
  exit_fired?: boolean
  er?: number
  er_annualized?: number
  signal_alpha?: number
  signal_alpha_annualized?: number
  mtm_pct?: number
  days_elapsed?: number
  avg_hold_days?: number
  timeliness_score?: number
  rr_static?: number
  rr_dynamic?: number
  fwd_wr?: number
  cagr_diff?: number
  asset_class?: string
  alpha_interpretation?: {
    type: 'fail' | 'warn' | 'info' | null
    label: string
    detail: string
  } | null
  conviction_score?: number | null
  conviction_bq_score?: number | null
  conviction_fs_class?: string | null
  [key: string]: unknown
}

export interface SignalSurfaceResponse {
  report: string
  report_date?: string
  source_file?: string
  row_count: number
  records: SignalSurfaceRecord[]
}

export interface SignalSummaryResponse {
  report: string
  report_date?: string
  total: number
  long: number
  short: number
  exited: number
  tier_counts: SignalTierCounts
  function_counts: Record<string, number>
}

export interface StrategyHealthRow {
  strategy: string
  interval: string
  fwd_wr: number
  bt_wr: number
  delta_vs_bt: number
  trades: number
  gate_a2b: string
  status: string
}

export interface StrategyHealthResponse {
  report_date?: string
  source_file?: string
  strategy_health: StrategyHealthRow[]
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
    avg_win_rate: number | null
    avg_win_rate_source?: 'api' | 'computed'
    avg_cagr?: number
    total_trades: number
    avg_sharpe: number
    function_count?: number
  }
}

export interface HorizontalNewHighRow {
  report_type: string
  symbol: string
  today_price: string
  new_highest: string
}

export interface HorizontalNewHighResponse {
  meta?: ApiMeta
  report_date?: string
  row_count: number
  rows: HorizontalNewHighRow[]
}

export interface CombinedPerformanceReportRow {
  section: 'forward_testing' | 'latest_performance'
  strategy: string
  interval: string
  signal_type: string
  total_trades: number
  win_percentage: number
  avg_backtested_win_rate: number
  best_profit?: number
  worst_profit?: number
  avg_profit?: number
  max_holding_days?: number
  min_holding_days?: number
  avg_holding_days?: number
}

export interface CombinedPerformanceReportResponse {
  meta?: ApiMeta
  report_date?: string
  forward_testing: CombinedPerformanceReportRow[]
  latest_performance: CombinedPerformanceReportRow[]
  aggregates?: {
    avg_forward_wr: number
    avg_backtest_wr: number
    total_trades: number
    degrading_count: number
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

export interface OverwatchPanelSignalDetail {
  strategy: string
  interval: string
  signal_type: string
  fwd_wr: number
  backtest_wr: number
  gap: number
  pattern: string
  above_floor: boolean
}

export interface OverwatchPanelMacroDetail {
  combo?: string
  reason?: string
  narrative?: string
  brave_fearful?: string
  variant: 'ssi' | 'dominant'
}

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
  signal?: OverwatchPanelSignalDetail
  macro?: OverwatchPanelMacroDetail
}

export interface OverwatchSystemCheck {
  name: string
  status: 'ok' | 'warn' | 'fail'
  detail: string
}

export interface OverwatchResponse {
  data_source?: ApiDataSource
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
  rows?: Array<Record<string, string | number | boolean | null>>
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

export type PortfolioFlagId = 'MULTI-SIG' | 'FD+' | 'FD−' | 'YIELD TRAP' | 'DRAWDOWN'

export interface PortfolioFlag {
  id: PortfolioFlagId
  label: string
}

export interface PortfolioCeilingStep {
  label: string
  value: string
  tone?: 'green' | 'amber' | 'gold' | 'teal' | 'default'
}

export interface PortfolioCeiling {
  vix: number | null
  vix_pct: number | null
  vix_regime: string | null
  val_regime: string | null
  geo_overlay: string | null
  regime_max_pct: number | null
  ssi_multiplier: number | null
  vix_level_mult: number | null
  spx_trend_mult: number | null
  hy_credit_mult: number | null
  final_ceiling_pct: number | null
  formula_text: string | null
  note: string | null
  portfolio_notional: number | null
  idle_cash_yield_pct: number | null
  steps: PortfolioCeilingStep[]
}

export interface PortfolioAllocationRow {
  ticker: string
  name: string | null
  investment_type: string | null
  function: string
  interval: string
  direction: 'Long' | 'Short'
  bq_score: number | null
  size_tier: string | null
  allocation_usd: number | null
  allocation_pct: number | null
  flags: PortfolioFlag[]
  blocked: boolean
}

export interface PortfolioClusterGroup {
  id: string
  label: string
  budget_usd: number | null
  budget_pct: number | null
  deployed_usd: number | null
  deployed_pct: number | null
  max_pct: number | null
  positions: PortfolioAllocationRow[]
}

export interface PortfolioPnlRow {
  ticker: string
  investment_type: string | null
  function: string
  interval: string
  direction: 'Long' | 'Short'
  entry_price: number | null
  current_price: number | null
  shares: number | null
  market_value: number | null
  pnl_usd: number | null
  pnl_pct: number | null
  bq_score: number | null
  size_tier: string | null
  flags: PortfolioFlag[]
  status: string
  blocked: boolean
}

export interface PortfolioConstraintCheck {
  level: 'ok' | 'warn' | 'bad'
  title: string
  body: string
}

export interface PortfolioComboStripItem {
  id: string
  label: string
  detail: string | null
}

export interface PortfolioMacroOverride {
  active: boolean
  reasons: string[]
}

export interface PortfolioSummary {
  deployed_usd: number | null
  deployed_pct: number | null
  cash_usd: number | null
  cash_pct: number | null
  idle_income_usd: number | null
  open_position_count: number
}

export interface PortfolioRiskState {
  available: boolean
  message: string
}

/** @deprecated Legacy flat row — kept for mock fallback compatibility */
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
  data_source?: ApiDataSource
  ceiling: PortfolioCeiling
  clusters: PortfolioClusterGroup[]
  pnl_rows: PortfolioPnlRow[]
  summary: PortfolioSummary
  constraints: PortfolioConstraintCheck[]
  active_combos: PortfolioComboStripItem[]
  macro_override: PortfolioMacroOverride | null
  risk: PortfolioRiskState
  scenarios_available: boolean
}

export type ChatPreset = 'freeform' | 'analyze_asset' | 'signal_insights' | 'breadth_analysis'

export interface ChatRequest {
  message: string
  session_id?: string | null
  preset?: ChatPreset
  selected_signal_types?: string[]
  asset?: string
  assets?: string[]
  from_date?: string
  to_date?: string
  functions?: string[]
  deep_research_enabled?: boolean
}

export interface ChatResponse {
  session_id: string
  reply: string
  metadata?: Record<string, unknown>
  error?: string
  data_source?: ApiDataSource
}

export interface ChatSessionsResponse {
  sessions: Array<{
    session_id: string
    title: string
    last_updated: string
    message_count: number
  }>
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  metadata?: Record<string, unknown> | null
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[]
  data_source?: ApiDataSource
}

export interface RunicRegime {
  fed_cycle: string
  curve_regime: string
  geo_overlay: string
  val_regime: string
  liquidity: string
  fed_cycle_source?: string
  curve_regime_source?: string
  val_regime_source?: string
  liquidity_source?: string
}

export interface RunicActiveCombo {
  combo: string
  duration_weeks?: number
  wk?: number
  bucket?: string
  status?: string
  mtm_pct?: number
  episode_start?: string
  confirmed_legs?: string[]
  primary_label?: string
  hit_rate_primary?: number
  avg_return_primary?: number
  n_obs_primary?: number
  secondary_label?: string
  hit_rate_secondary?: number
  avg_return_secondary?: number
  n_obs_secondary?: number
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
  duration?: string
  hit_rate_3m?: string
  avg_return_3m?: string
}

export interface RunicNightlyResponse {
  data_source?: ApiDataSource
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
  lag_days?: number | null
  source_date?: string | null
  expected_source_date?: string | null
  stale?: boolean
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
  combo_c_cancelled?: boolean
  combo_c_cancel_date?: string
  combo_f_active?: boolean
  dominant_signal?: string
  dominant_reason?: string
  combo_c_status?: string
  combo_c_duration?: string
  combo_f_status?: string
  combo_f_duration?: string
  combo_c_active?: boolean
  probability_model?: {
    model_cancel_prob: number
    model_wti_leg_prob: number
    model_cpi_leg_prob: number
  }
  upcoming_releases?: Array<{
    release_date: string
    release_type: string
    consensus?: number
  }>
  if_cancelled?: {
    f_becomes_dominant: boolean
    e_warning_persists: boolean
    note: string
  }
  cancel_condition?: string
  d_f_tension?: string
  progress_pct?: number
  weeks_remaining?: number
  hit_rate_primary?: number
  avg_return_6m?: number
  ppi_cooling?: boolean
  cancel_gate_pct?: number
  current_cpi_print?: {
    release_date: string
    actual: number
    consensus: number
    surprise_pp?: number
    not_hot?: boolean
  }
}

export interface MacroVariableFreshness {
  variable: string
  source_date?: string | null
  lag_days?: number | null
  expected_source_date?: string | null
  source_note?: string | null
  tier?: string
  stale?: boolean
}

export interface MacroDataFreshnessResponse {
  data_source?: ApiDataSource
  date: string
  cftc_status: string
  pending_cpi_release: boolean
  any_stale_after_refresh?: boolean
  variables_dashboard: MacroVariableFreshness[]
}

export interface MacroSsiInput {
  raw: number
  vote: boolean | null
  signal: string | null
  pctile: number | null
}

export interface MacroSsiSummaryResponse {
  data_source?: ApiDataSource
  date: string
  ssi_level: number
  ssi_percentile_5y?: number | null
  ssi_multiplier: number
  layer2_status: string
  layer2_confirmed_count: number
  layer2_required: number
  posture: string
  long_signal_active: boolean
  short_signal_active: boolean
  inputs: Record<string, MacroSsiInput>
}

export interface MacroSsiMultiplierResponse {
  data_source?: ApiDataSource
  date: string
  ssi_multiplier: number
  ssi_level: number
  layer2_status: string
  layer2_confirmed_count: number
  long_size_mult: number
  short_size_mult: number
  long_active: boolean
  short_active: boolean
  long_entry_threshold: number
  short_entry_threshold: number
}

export interface MacroOverviewKpisResponse {
  data_source?: ApiDataSource
  date: string
  dominant_signal: {
    combo: string
    brave_fearful_display?: string
    hit_rate?: number | null
    avg_return?: number | null
  }
  combo_c_duration: {
    combo: string
    duration_weeks?: number | null
    duration_bucket?: string | null
    active: boolean
  }
  combo_f_window: {
    combo: string
    weeks_elapsed?: number | null
    active: boolean
    mtm_pct?: number | null
  }
  cape: {
    variable: string
    current?: number | null
    tier?: string
    combo_e_status?: string
  }
  wti_4wk: {
    variable: string
    current?: number | null
    tier?: string
    cancel_week?: number | null
  }
}

export interface MacroRegimeResponse {
  data_source?: ApiDataSource
  date: string
  regime: RunicRegime
  brave_fearful: string
  brave_fearful_display: string
  dominant_signal: string
  dominant_reason: string
  narrative: string
  system_recommendation: string
  vix_bypass: boolean
  ssi_layer2_status?: string
  ssi_multiplier?: number
  regime_grid?: Array<[string, string]>
}

export interface MacroNamedCombo {
  combo: string
  name: string
  direction: string
  horizon: string
  legs_required: number
  total_legs: number
  variables: string[]
  description: string
  status: string
  is_active: boolean
  is_watch: boolean
  duration_weeks?: number | null
  duration_bucket?: string | null
  confirmed_legs?: string[] | null
  episode_start?: string | null
  hit_rate_primary?: number | null
  avg_return_primary?: number | null
  combo_status_row?: RunicComboStatusRow | null
}

export interface MacroCombosResponse {
  data_source?: ApiDataSource
  date: string
  active_count: number
  watch_count: number
  combos: MacroNamedCombo[]
}

export interface MacroNarrativeResponse {
  data_source?: ApiDataSource
  date: string
  narrative: string
  system_recommendation: string
  brave_fearful_display: string
  dominant_signal: string
  dominant_reason: string
  regime: RunicRegime
  cftc_status: string
}

export interface MacroStatusResponse {
  data_source?: ApiDataSource
  date: string
  dominant_signal: string
  brave_fearful: string
  brave_fearful_display: string
  active_combos: string[]
  watch_combos: string[]
  cftc_status: string
  vix_bypass: boolean
  combo_c_cancel_week: number
  combo_c_cancelled: boolean
  pending_cpi_release: boolean
}

export interface MacroPersistenceResponse {
  data_source?: ApiDataSource
  date: string
  persistence_signals: Array<{
    signal_type: string
    weeks?: number
    description: string
  }>
  generic_combo_watch: Array<{
    vars: string[]
    status: string
    gate: string
  }>
  source_freshness?: { last_audit?: string }
}
