import { analystMarkdownToHtml } from '~/utils/analyst-markdown'

export interface ClaudeMessage {
  id: string
  role: 'agent' | 'user'
  label: string
  html: string
  pending?: boolean
  timestamp?: string
}

const SESSION_STORAGE_KEY = 'analyst-session-id'

export const ANALYST_SUGGESTED_PROMPTS = [
  "Summarize today's outstanding signals",
  "What's the current macro regime?",
  'Which functions are degrading?',
  'Review AAPL open positions',
] as const

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function replyToHtml(reply: string) {
  return analystMarkdownToHtml(reply)
}

function historyToMessages(
  rows: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>,
): ClaudeMessage[] {
  return rows.map((row, i) => ({
    id: `hist-${row.timestamp ?? i}`,
    role: row.role === 'user' ? 'user' : 'agent',
    label: row.role === 'user' ? 'YOU' : 'AI ANALYST',
    html: row.role === 'user' ? escapeHtml(row.content) : replyToHtml(row.content),
    timestamp: row.timestamp,
  }))
}

export function useClaudePanel() {
  const isOpen = useState('claude-open', () => false)
  const chatMessages = useState<ClaudeMessage[]>('claude-chat-messages', () => [])
  const draft = useState('claude-draft', () => '')
  const pageContext = useState('claude-context', () => 'Dashboard')
  const sessionId = useState<string | null>('claude-session-id', () => null)
  const sending = useState('claude-sending', () => false)
  const historyLoading = useState('claude-history-loading', () => false)
  const pendingAlert = useState('ow-pending-alert', () => false)
  const chatScrollTick = useState('claude-scroll-tick', () => 0)
  const chatNotice = useState<string | null>('claude-chat-notice', () => null)

  let noticeTimer: ReturnType<typeof setTimeout> | null = null

  function showChatNotice(message: string) {
    chatNotice.value = message
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      chatNotice.value = null
    }, 2800)
  }

  function bumpScroll() {
    chatScrollTick.value += 1
  }

  function persistSession(id: string | null) {
    sessionId.value = id
    if (import.meta.client) {
      if (id) localStorage.setItem(SESSION_STORAGE_KEY, id)
      else localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  function restoreSessionFromStorage() {
    if (!import.meta.client || sessionId.value) return
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) sessionId.value = stored
  }

  async function loadSessionHistory() {
    if (!sessionId.value || chatMessages.value.length > 0) return
    historyLoading.value = true
    try {
      const res = await $fetch<{ messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }> }>(
        '/api/chat/history',
        { query: { session_id: sessionId.value } },
      )
      if (res.messages?.length) {
        chatMessages.value = historyToMessages(res.messages)
        bumpScroll()
      }
    } catch {
      persistSession(null)
    } finally {
      historyLoading.value = false
    }
  }

  function switchToChatTab() {
    const activeTab = useState<import('~/composables/useOverwatch').AnalystTab>('ow-active-tab', () => 'chat')
    activeTab.value = 'chat'
    if (import.meta.client) localStorage.setItem('analyst-active-tab', 'chat')
  }

  function toggle() {
    if (isOpen.value) {
      isOpen.value = false
      return
    }

    switchToChatTab()
    restoreSessionFromStorage()
    isOpen.value = true
    pendingAlert.value = false
    bumpScroll()
    void loadSessionHistory()
  }

  function close() {
    isOpen.value = false
  }

  function setContext(ctx: string) {
    pageContext.value = ctx
  }

  function startNewChat() {
    chatMessages.value = []
    persistSession(null)
    draft.value = ''
    bumpScroll()
    showChatNotice('New chat started · previous session saved on server')
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? draft.value).trim()
    if (!text || sending.value) return

    switchToChatTab()

    const userId = `user-${Date.now()}`
    chatMessages.value = [
      ...chatMessages.value,
      {
        id: userId,
        role: 'user',
        label: 'YOU',
        html: escapeHtml(text),
        timestamp: new Date().toISOString(),
      },
    ]
    if (!textOverride) draft.value = ''
    bumpScroll()

    const pendingId = `agent-${Date.now()}`
    chatMessages.value = [
      ...chatMessages.value,
      {
        id: pendingId,
        role: 'agent',
        label: 'AI ANALYST',
        html: '<span class="ach-typing"><span /><span /><span /></span>',
        pending: true,
      },
    ]
    bumpScroll()

    sending.value = true
    try {
      const { postChat } = useApi()
      const res = await postChat({
        message: text,
        session_id: sessionId.value,
      })
      persistSession(res.session_id)
      const html = res.error
        ? `<span class="wa">${escapeHtml(res.error)}</span>`
        : replyToHtml(res.reply)
      chatMessages.value = chatMessages.value.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              html,
              label: 'AI ANALYST',
              pending: false,
              timestamp: new Date().toISOString(),
            }
          : m,
      )
    } catch {
      chatMessages.value = chatMessages.value.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              pending: false,
              html: '<span class="wa">Could not reach the analyst. Check your connection or try again.</span>',
            }
          : m,
      )
    } finally {
      sending.value = false
      bumpScroll()
    }
  }

  function sendSuggestedPrompt(prompt: string) {
    sendMessage(prompt)
  }

  return {
    isOpen,
    chatMessages,
    draft,
    pageContext,
    sessionId,
    sending,
    historyLoading,
    pendingAlert,
    chatScrollTick,
    chatNotice,
    suggestedPrompts: ANALYST_SUGGESTED_PROMPTS,
    toggle,
    close,
    setContext,
    sendMessage,
    sendSuggestedPrompt,
    startNewChat,
    loadSessionHistory,
    bumpScroll,
  }
}
