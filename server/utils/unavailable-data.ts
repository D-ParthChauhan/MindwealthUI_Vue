import { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH } from '~/constants/unavailable'
import type {
  ApiMeta,
  BreadthResponse,
  CombinedPerformanceReportResponse,
  DashboardResponse,
  HorizontalNewHighResponse,
  MonitoredTradesResponse,
  OverwatchResponse,
  PerformanceResponse,
  PortfolioResponse,
  MacroCombosResponse,
  MacroDataFreshnessResponse,
  MacroNarrativeResponse,
  MacroOverviewKpisResponse,
  MacroPersistenceResponse,
  MacroRegimeResponse,
  MacroSsiMultiplierResponse,
  MacroSsiSummaryResponse,
  MacroStatusResponse,
  RunicAnalogResponse,
  RunicCancelTrackerResponse,
  RunicNightlyResponse,
  RunicVariablesResponse,
  SentimentResponse,
  ShortlistResponse,
  SignalCountsResponse,
  SignalSummaryResponse,
  SignalSurfaceResponse,
  SignalsListResponse,
  StrategyHealthResponse,
} from '~/types/api'
import type { ConvictionResponse } from '~/types/conviction'

const emptyRegime = {
  fed_cycle: UNAVAILABLE_FETCH,
  curve_regime: UNAVAILABLE_FETCH,
  geo_overlay: UNAVAILABLE_FETCH,
  val_regime: UNAVAILABLE_FETCH,
  liquidity: UNAVAILABLE_FETCH,
}

export function getUnavailableMeta(): ApiMeta {
  return {}
}

export function getUnavailableSignalCounts(): SignalCountsResponse {
  return { outstanding: 0, new: 0, shortlisted: 0 }
}

export function getUnavailableDashboard(): DashboardResponse {
  return {
    kpis: {
      avg_win_rate: null,
      avg_win_rate_display: UNAVAILABLE_FETCH,
      win_rate_mom: null,
      win_rate_mom_display: UNAVAILABLE_FETCH,
      outstanding_count: 0,
      new_today: 0,
      sentiment_score: UNAVAILABLE_FETCH,
      sentiment_label: UNAVAILABLE_FETCH,
      overwatch_count: 0,
      overwatch_message: UNAVAILABLE_FETCH,
      sigma: UNAVAILABLE_FETCH,
    },
    top_signals: [],
    functions_sidebar: [],
    degraded_strategy: null,
    analyst_snippet: UNAVAILABLE_FETCH,
  }
}

function emptySignalsList(): SignalsListResponse {
  return {
    summary: {
      long: 0,
      short: 0,
      long_pct: 0,
      short_note: UNAVAILABLE_FETCH,
      new_long: 0,
      new_short: 0,
      shortlisted: 0,
    },
    signals: [],
    function_counts: [],
  }
}

export function getUnavailableSignalsOutstanding(): SignalsListResponse {
  return emptySignalsList()
}

export function getUnavailableSignalsNew(): SignalsListResponse {
  return emptySignalsList()
}

export function getUnavailableAllSignals(): SignalsListResponse {
  return emptySignalsList()
}

export function getUnavailableHorizontalNewHigh(): HorizontalNewHighResponse {
  return { row_count: 0, rows: [] }
}

export function getUnavailableCombinedPerformanceReport(): CombinedPerformanceReportResponse {
  return { forward_testing: [], latest_performance: [] }
}

export function getUnavailablePerformance(): PerformanceResponse {
  return { rows: [] }
}

export function getUnavailableOverwatch(): OverwatchResponse {
  return {
    alerts: [],
    count: 0,
    message: UNAVAILABLE_FETCH,
    kpis: {
      backtest_wr: 0,
      forward_wr: 0,
      forced_portfolio_ytd: 0,
    },
    function_health: [],
    system_logs: [],
  }
}

export function getUnavailableBreadth(): BreadthResponse {
  return {
    rows: [],
    sentiment: { score: UNAVAILABLE_FETCH, label: UNAVAILABLE_FETCH },
  }
}

export function getUnavailableSentiment(): SentimentResponse {
  return {
    composite: { score: UNAVAILABLE_FETCH, label: UNAVAILABLE_FETCH },
    signals: [],
  }
}

export function getUnavailableShortlist(): ShortlistResponse {
  return { count: 0, report_text: UNAVAILABLE_FETCH, rows: [] }
}

export function getUnavailableMonitoredTrades(): MonitoredTradesResponse {
  return { last_updated: UNAVAILABLE_FETCH, trades: [] }
}

export function getUnavailablePortfolio(): PortfolioResponse {
  const emptyCeiling = {
    vix: null,
    vix_pct: null,
    vix_regime: null,
    val_regime: null,
    geo_overlay: null,
    regime_max_pct: null,
    ssi_multiplier: null,
    vix_level_mult: null,
    spx_trend_mult: null,
    hy_credit_mult: null,
    final_ceiling_pct: null,
    formula_text: null,
    note: null,
    portfolio_notional: null,
    idle_cash_yield_pct: null,
    steps: [],
  }
  return {
    ceiling: emptyCeiling,
    clusters: [],
    pnl_rows: [],
    summary: {
      deployed_usd: null,
      deployed_pct: null,
      cash_usd: null,
      cash_pct: null,
      idle_income_usd: null,
      open_position_count: 0,
    },
    constraints: [],
    active_combos: [],
    macro_override: null,
    risk: {
      available: false,
      message: UNAVAILABLE_FETCH,
    },
    scenarios_available: false,
  }
}

export function getUnavailableConviction(): ConvictionResponse {
  return {
    asOf: UNAVAILABLE_FETCH,
    storeLive: false,
    health: {
      breakdown: {
        max: { count: 0, pct: 0 },
        tactical: { count: 0, pct: 0 },
        reduced: { count: 0, pct: 0 },
        cancel: { count: 0, pct: 0 },
      },
      yieldTraps: 0,
      yieldTrapTickers: [],
      avgConviction: 0,
      avgRange: { min: 0, max: 0 },
      businessTypes: [],
      equityCount: 0,
    },
    signals: [],
    portfolio: [],
    contradictions: [],
  }
}

export function getUnavailableRunicNightly(): RunicNightlyResponse {
  return {
    date: UNAVAILABLE_FETCH,
    regime: emptyRegime,
    dominant_signal: '—',
    dominant_reason: UNAVAILABLE_FETCH,
    brave_fearful: UNAVAILABLE_FETCH,
    active_combos: [],
    watch_combos: [],
    cftc_status: 'PENDING_3DAY_LAG',
    combo_c_cancel_fri: 0,
    wti_4wk_pct: 0,
    vix_bypass_active: false,
    combo_e_status: 'CONFIRMED_2_OF_3',
    narrative: UNAVAILABLE_FETCH,
  }
}

export function getUnavailableRunicVariables(): RunicVariablesResponse {
  return { date: UNAVAILABLE_FETCH, heatmap: [], variables: [] }
}

export function getUnavailableRunicAnalog(combo: string): RunicAnalogResponse {
  return {
    combo,
    title: `Combo ${combo}`,
    subtitle: UNAVAILABLE_FETCH,
    title_color: 'var(--t3)',
    columns: [],
    rows: [],
    footnote: UNAVAILABLE_FETCH,
  }
}

export function getUnavailableRunicCancelTracker(): RunicCancelTrackerResponse {
  return {
    combo_c_cancel_fri: 0,
    wti_4wk_pct: 0,
    friday_rows: [],
    cancel_fridays: [],
    f_window: {
      fire_date: UNAVAILABLE_FETCH,
      expires: UNAVAILABLE_FETCH,
      weeks_elapsed: 0,
      weeks_total: 26,
      mtm_pct: 0,
    },
  }
}

function emptyOverviewKpis(): MacroOverviewKpisResponse {
  return {
    date: UNAVAILABLE_FETCH,
    dominant_signal: { combo: '—' },
    combo_c_duration: { combo: 'C', active: false },
    combo_f_window: { combo: 'F', active: false },
    cape: { variable: 'CAPE' },
    wti_4wk: { variable: 'WTI' },
  }
}

export function getUnavailableMacroOverviewKpis(): MacroOverviewKpisResponse {
  return emptyOverviewKpis()
}

export function getUnavailableMacroRegime(): MacroRegimeResponse {
  return {
    date: UNAVAILABLE_FETCH,
    regime: emptyRegime,
    brave_fearful: UNAVAILABLE_FETCH,
    brave_fearful_display: UNAVAILABLE_FETCH,
    dominant_signal: '—',
    dominant_reason: UNAVAILABLE_FETCH,
    narrative: UNAVAILABLE_FETCH,
    system_recommendation: UNAVAILABLE_FETCH,
    vix_bypass: false,
  }
}

export function getUnavailableMacroCombos(): MacroCombosResponse {
  return { date: UNAVAILABLE_FETCH, active_count: 0, watch_count: 0, combos: [] }
}

export function getUnavailableMacroNarrative(): MacroNarrativeResponse {
  return {
    date: UNAVAILABLE_FETCH,
    narrative: UNAVAILABLE_FETCH,
    system_recommendation: UNAVAILABLE_FETCH,
    brave_fearful_display: UNAVAILABLE_FETCH,
    dominant_signal: '—',
    dominant_reason: UNAVAILABLE_FETCH,
    regime: emptyRegime,
    cftc_status: UNAVAILABLE_FETCH,
  }
}

export function getUnavailableMacroStatus(): MacroStatusResponse {
  return {
    date: UNAVAILABLE_FETCH,
    dominant_signal: '—',
    brave_fearful: UNAVAILABLE_FETCH,
    brave_fearful_display: UNAVAILABLE_FETCH,
    active_combos: [],
    watch_combos: [],
    cftc_status: UNAVAILABLE_FETCH,
    vix_bypass: false,
    combo_c_cancel_week: 0,
    combo_c_cancelled: false,
    pending_cpi_release: false,
  }
}

export function getUnavailableMacroPersistence(): MacroPersistenceResponse {
  return { date: UNAVAILABLE_FETCH, persistence_signals: [], generic_combo_watch: [] }
}

export function getUnavailableMacroDataFreshness(): MacroDataFreshnessResponse {
  return {
    date: UNAVAILABLE_FETCH,
    cftc_status: UNAVAILABLE_FETCH,
    pending_cpi_release: false,
    variables_dashboard: [],
  }
}

export function getUnavailableMacroSsiSummary(): MacroSsiSummaryResponse {
  return {
    date: UNAVAILABLE_FETCH,
    ssi_level: 0,
    ssi_multiplier: 1,
    layer2_status: UNAVAILABLE_FETCH,
    layer2_confirmed_count: 0,
    layer2_required: 3,
    posture: UNAVAILABLE_FETCH,
    long_signal_active: false,
    short_signal_active: false,
    inputs: {},
  }
}

export function getUnavailableMacroSsiMultiplier(): MacroSsiMultiplierResponse {
  return {
    date: UNAVAILABLE_FETCH,
    ssi_multiplier: 1,
    ssi_level: 0,
    layer2_status: UNAVAILABLE_FETCH,
    layer2_confirmed_count: 0,
    long_size_mult: 1,
    short_size_mult: 1,
    long_active: false,
    short_active: false,
    long_entry_threshold: -0.6,
    short_entry_threshold: 0.85,
  }
}

export function getUnavailableSignalSurface(report = 'outstanding-signals'): SignalSurfaceResponse {
  return { report, row_count: 0, records: [] }
}

export function getUnavailableSignalSummary(report = 'outstanding-signals'): SignalSummaryResponse {
  return {
    report,
    total: 0,
    long: 0,
    short: 0,
    exited: 0,
    tier_counts: {},
    function_counts: {},
  }
}

export function getUnavailableStrategyHealth(): StrategyHealthResponse {
  return { strategy_health: [] }
}

export { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH }
