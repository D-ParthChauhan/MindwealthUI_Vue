import type {
  BreadthResponse,
  ChatRequest,
  ChatResponse,
  ChatSessionsResponse,
  CombinedPerformanceReportResponse,
  DashboardResponse,
  HorizontalNewHighResponse,
  MonitoredTradesResponse,
  OverwatchResponse,
  PerformanceResponse,
  PortfolioResponse,
  PortfolioRiskResponse,
  PortfolioAnalyzeRequest,
  PortfolioAnalyzeResponse,
  PortfolioScenario,
  PortfolioTickerSearchResult,
  SentimentResponse,
  ShortlistResponse,
  SignalCountsResponse,
  CheckDegradationResponse,
  SignalSurfaceResponse,
  SignalSummaryResponse,
  SignalsListResponse,
  StrategyHealthResponse,
} from '~/types/api'
import type { ApiMeta } from '~/types/api'

export function useApi() {
  const fetchDashboard = () => useFetch<DashboardResponse>('/api/dashboard', { key: 'api-dashboard' })

  const fetchSignalsOutstanding = (query?: Record<string, string>) =>
    useFetch<SignalsListResponse>('/api/signals/outstanding', {
      key: `api-signals-outstanding-${JSON.stringify(query ?? {})}`,
      query,
    })

  const fetchSignalsNew = (query?: Record<string, string>) =>
    useFetch<SignalsListResponse>('/api/signals/new', {
      key: `api-signals-new-${JSON.stringify(query ?? {})}`,
      query,
    })

  const fetchAllSignals = () =>
    useFetch<SignalsListResponse>('/api/signals/all', { key: 'api-signals-all' })

  const fetchHorizontalNewHigh = () =>
    useFetch<HorizontalNewHighResponse>('/api/signals/horizontal-new-high', {
      key: 'api-signals-horizontal-new-high',
    })

  const fetchCombinedPerformanceReport = () =>
    useFetch<CombinedPerformanceReportResponse>('/api/signals/combined-performance', {
      key: 'api-signals-combined-performance',
    })

  const fetchSignalCounts = () =>
    useFetch<SignalCountsResponse>('/api/signals/counts', { key: 'api-signal-counts' })

  const fetchSignalSurface = (report: MaybeRef<string>) =>
    useFetch<SignalSurfaceResponse>('/api/signals/surface', {
      key: computed(() => `api-signals-surface-${toValue(report)}`),
      query: computed(() => ({ report: toValue(report) })),
    })

  const fetchSignalSummary = (report: MaybeRef<string>) =>
    useFetch<SignalSummaryResponse>('/api/signals/summary', {
      key: computed(() => `api-signals-summary-${toValue(report)}`),
      query: computed(() => ({ report: toValue(report) })),
    })

  const fetchStrategyHealth = () =>
    useFetch<StrategyHealthResponse>('/api/signals/strategy-health', {
      key: 'api-signals-strategy-health',
    })

  const fetchCheckDegradation = () =>
    useFetch<CheckDegradationResponse>('/api/signals/check-degradation', {
      key: 'api-signals-check-degradation',
    })

  const fetchPerformance = () =>
    useFetch<PerformanceResponse>('/api/performance', { key: 'api-performance' })

  const fetchBreadth = () => useFetch<BreadthResponse>('/api/breadth', { key: 'api-breadth' })

  const fetchSentiment = () => useFetch<SentimentResponse>('/api/sentiment', { key: 'api-sentiment' })

  const fetchOverwatch = () => useFetch<OverwatchResponse>('/api/overwatch', { key: 'api-overwatch' })

  const fetchShortlist = () => useFetch<ShortlistResponse>('/api/shortlist', { key: 'api-shortlist' })

  const fetchMonitoredTrades = () =>
    useFetch<MonitoredTradesResponse>('/api/monitored-trades', { key: 'api-monitored-trades' })

  const fetchPortfolio = (scenario: MaybeRef<PortfolioScenario> = 'normal') =>
    useFetch<PortfolioResponse>('/api/portfolio', {
      key: computed(() => `api-portfolio-${toValue(scenario)}`),
      query: computed(() => ({ scenario: toValue(scenario) })),
    })

  const fetchPortfolioRisk = (scenario: MaybeRef<PortfolioScenario> = 'normal') =>
    useFetch<PortfolioRiskResponse>('/api/portfolio/risk', {
      key: computed(() => `api-portfolio-risk-${toValue(scenario)}`),
      query: computed(() => ({ scenario: toValue(scenario) })),
    })

  async function searchPortfolioTickers(q: string, limit = 20): Promise<PortfolioTickerSearchResult[]> {
    return $fetch<PortfolioTickerSearchResult[]>('/api/portfolio/risk/search', {
      query: { q, limit },
    })
  }

  async function analyzePortfolioHoldings(
    body: PortfolioAnalyzeRequest,
  ): Promise<PortfolioAnalyzeResponse> {
    return $fetch<PortfolioAnalyzeResponse>('/api/portfolio/risk/analyze', {
      method: 'POST',
      body,
    })
  }

  const fetchMeta = () => useFetch<ApiMeta>('/api/meta', { key: 'api-meta' })

  async function postChat(body: ChatRequest): Promise<ChatResponse> {
    return $fetch<ChatResponse>('/api/chat', { method: 'POST', body })
  }

  const fetchChatSessions = () =>
    useFetch<ChatSessionsResponse>('/api/chat/sessions', { key: 'api-chat-sessions' })

  const fetchRunicNightly = () =>
    useFetch<import('~/types/api').RunicNightlyResponse>('/api/runic/nightly', { key: 'runic-nightly' })

  return {
    fetchDashboard,
    fetchSignalsOutstanding,
    fetchSignalsNew,
    fetchAllSignals,
    fetchHorizontalNewHigh,
    fetchCombinedPerformanceReport,
    fetchSignalCounts,
    fetchSignalSurface,
    fetchSignalSummary,
    fetchStrategyHealth,
    fetchCheckDegradation,
    fetchPerformance,
    fetchBreadth,
    fetchSentiment,
    fetchOverwatch,
    fetchShortlist,
    fetchMonitoredTrades,
    fetchPortfolio,
    fetchPortfolioRisk,
    searchPortfolioTickers,
    analyzePortfolioHoldings,
    fetchMeta,
    postChat,
    fetchChatSessions,
    fetchRunicNightly,
  }
}
