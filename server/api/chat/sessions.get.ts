import { loadChatSessions } from '../../utils/mindwealth-data'

export default defineEventHandler(async () => {
  const fromBackend = await loadChatSessions()
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
