import { fetchFromBackend } from '../../utils/backend'

export default defineEventHandler(async () => {
  const fromBackend = await fetchFromBackend<{ sessions: unknown[] }>('/api/chat/sessions')
  if (fromBackend) return fromBackend

  return {
    sessions: [
      {
        session_id: 'mock-session-1',
        title: 'AAPL TRENDPULSE analysis',
        last_updated: '2026-05-12T10:00:00',
        message_count: 4,
      },
    ],
  }
})
