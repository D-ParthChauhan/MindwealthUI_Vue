export interface ClaudeMessage {
  id: string
  role: 'agent' | 'user'
  label: string
  html: string
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function replyToHtml(reply: string) {
  const escaped = escapeHtml(reply)
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

export function useClaudePanel() {
  const isOpen = useState('claude-open', () => false)
  const chatMessages = useState<ClaudeMessage[]>('claude-chat-messages', () => [])
  const draft = useState('claude-draft', () => '')
  const pageContext = useState('claude-context', () => 'Dashboard')
  const sessionId = useState<string | null>('claude-session-id', () => null)
  const sending = useState('claude-sending', () => false)
  const pendingAlert = useState('ow-pending-alert', () => false)

  function toggle() {
    if (!isOpen.value) {
      const activeTab = useState<import('~/composables/useOverwatch').AnalystTab>('ow-active-tab', () => 'all')
      activeTab.value = 'all'
      if (import.meta.client) localStorage.setItem('analyst-active-tab', 'all')
    }
    isOpen.value = !isOpen.value
    if (isOpen.value) pendingAlert.value = false
  }

  function close() {
    isOpen.value = false
  }

  function setContext(ctx: string) {
    pageContext.value = ctx
  }

  async function sendMessage() {
    const text = draft.value.trim()
    if (!text || sending.value) return

    const userId = `user-${Date.now()}`
    chatMessages.value = [
      ...chatMessages.value,
      {
        id: userId,
        role: 'user',
        label: 'YOU',
        html: escapeHtml(text),
      },
    ]
    draft.value = ''

    const pendingId = `agent-${Date.now()}`
    chatMessages.value = [
      ...chatMessages.value,
      {
        id: pendingId,
        role: 'agent',
        label: 'AI ANALYST · ON DEMAND',
        html: 'Analyzing…',
      },
    ]

    sending.value = true
    try {
      const { postChat } = useApi()
      const res = await postChat({
        message: text,
        session_id: sessionId.value,
      })
      sessionId.value = res.session_id
      const html = res.error ? `<span class="wa">${escapeHtml(res.error)}</span>` : replyToHtml(res.reply)
      chatMessages.value = chatMessages.value.map((m) =>
        m.id === pendingId ? { ...m, html, label: 'AI ANALYST · ON DEMAND' } : m,
      )
    } catch {
      chatMessages.value = chatMessages.value.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              html: '<span class="wa">Could not reach the analyst. Check your connection or try again.</span>',
            }
          : m,
      )
    } finally {
      sending.value = false
    }
  }

  return {
    isOpen,
    chatMessages,
    draft,
    pageContext,
    sending,
    pendingAlert,
    toggle,
    close,
    setContext,
    sendMessage,
  }
}
