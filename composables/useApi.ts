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
  SentimentResponse,
  ShortlistResponse,
  SignalCountsResponse,
  SignalsListResponse,
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

  const fetchPerformance = () =>
    useFetch<PerformanceResponse>('/api/performance', { key: 'api-performance' })

  const fetchBreadth = () => useFetch<BreadthResponse>('/api/breadth', { key: 'api-breadth' })

  const fetchSentiment = () => useFetch<SentimentResponse>('/api/sentiment', { key: 'api-sentiment' })

  const fetchOverwatch = () => useFetch<OverwatchResponse>('/api/overwatch', { key: 'api-overwatch' })

  const fetchShortlist = () => useFetch<ShortlistResponse>('/api/shortlist', { key: 'api-shortlist' })

  const fetchMonitoredTrades = () =>
    useFetch<MonitoredTradesResponse>('/api/monitored-trades', { key: 'api-monitored-trades' })

  const fetchPortfolio = () => useFetch<PortfolioResponse>('/api/portfolio', { key: 'api-portfolio' })

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
    fetchPerformance,
    fetchBreadth,
    fetchSentiment,
    fetchOverwatch,
    fetchShortlist,
    fetchMonitoredTrades,
    fetchPortfolio,
    fetchMeta,
    postChat,
    fetchChatSessions,
    fetchRunicNightly,
  }
}
