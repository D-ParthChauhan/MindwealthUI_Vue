import { loadChatSessions } from '../../utils/mindwealth-data'
import { isMockDataEnabled } from '../../utils/data-resolution'

export default defineEventHandler(async () => {
  const fromBackend = await loadChatSessions()
  if (fromBackend) return { ...fromBackend, data_source: 'live' as const }

  if (isMockDataEnabled()) {
    return {
      data_source: 'mock' as const,
      sessions: [
        {
          session_id: 'mock-session-1',
          title: 'AAPL TRENDPULSE analysis',
          last_updated: '2026-05-12T10:00:00',
          message_count: 4,
        },
      ],
    }
  }

  return { data_source: 'unavailable' as const, sessions: [] }
})
