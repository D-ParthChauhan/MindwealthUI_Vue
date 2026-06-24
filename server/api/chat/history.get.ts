import { loadChatHistory } from '../../utils/mindwealth-data'
import { isMockDataEnabled } from '../../utils/data-resolution'

export default defineEventHandler(async (event) => {
  const sessionId = getQuery(event).session_id
  if (!sessionId || typeof sessionId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'session_id is required' })
  }

  const fromBackend = await loadChatHistory(sessionId)
  if (fromBackend) return { ...fromBackend, data_source: 'live' as const }

  if (isMockDataEnabled()) {
    return {
      data_source: 'mock' as const,
      messages: [
        { role: 'assistant' as const, content: 'Mock analyst ready. Connect the backend for live answers.' },
      ],
    }
  }

  return { data_source: 'unavailable' as const, messages: [] }
})
