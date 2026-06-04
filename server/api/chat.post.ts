import type { ChatRequest, ChatResponse } from '~/types/api'
import { fetchFromBackend } from '../utils/backend'

function mockChatReply(body: ChatRequest): ChatResponse {
  const sessionId = body.session_id || `mock-${Date.now()}`
  return {
    session_id: sessionId,
    reply: `**AI Analyst (mock)** — Received your question about *${body.message.slice(0, 80)}${body.message.length > 80 ? '…' : ''}*.\n\nConnect \`NUXT_API_BASE_URL\` to the Python FastAPI service for live answers from \`ChatbotEngine.smart_query()\`.`,
    metadata: {
      tokens_used: { input: 0, output: 0, total: 0 },
      signal_types: body.signal_types ?? [],
      tickers: body.assets ?? [],
      functions: body.functions ?? [],
      rows_returned: 0,
      batched: false,
      error: null,
      mock: true,
    },
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)
  if (!body?.message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }

  const fromBackend = await fetchFromBackend<ChatResponse>('/api/chat', {
    method: 'POST',
    body,
  })

  if (fromBackend) {
    if (fromBackend.error && !fromBackend.reply) {
      return {
        session_id: fromBackend.session_id || body.session_id || `err-${Date.now()}`,
        reply: fromBackend.error,
        metadata: fromBackend.metadata,
        error: fromBackend.error,
      }
    }
    return fromBackend
  }

  const config = useRuntimeConfig()
  if (!config.apiBaseUrl) {
    return mockChatReply(body)
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'AI analyst unavailable — backend unreachable',
  })
})
