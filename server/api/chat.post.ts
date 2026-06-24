import type { ChatRequest, ChatResponse } from '~/types/api'
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'
import { sendChatMessage } from '../utils/mindwealth-data'
import { isMockDataEnabled } from '../utils/data-resolution'
import { isBackendConfigured } from '../utils/mindwealth-client'

function mockChatReply(body: ChatRequest): ChatResponse {
  const sessionId = body.session_id || `mock-${Date.now()}`
  return {
    session_id: sessionId,
    reply: `**AI Analyst (mock)** — Received your question about *${body.message.slice(0, 80)}${body.message.length > 80 ? '…' : ''}*.\n\nBackend unreachable; showing mock response.`,
    metadata: { mock: true },
    data_source: 'mock',
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)
  if (!body?.message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }

  const fromBackend = await sendChatMessage(body)
  if (fromBackend) {
    if (fromBackend.error && !fromBackend.reply) {
      return {
        session_id: fromBackend.session_id || body.session_id || `err-${Date.now()}`,
        reply: fromBackend.error,
        metadata: fromBackend.metadata,
        error: fromBackend.error,
        data_source: 'live',
      }
    }
    return { ...fromBackend, data_source: 'live' }
  }

  if (!isBackendConfigured()) {
    if (isMockDataEnabled()) return mockChatReply(body)
    return {
      session_id: body.session_id || `unavail-${Date.now()}`,
      reply: UNAVAILABLE_FETCH,
      metadata: { unavailable: true },
      data_source: 'unavailable',
    }
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'AI analyst unavailable — backend unreachable or job timed out',
  })
})
