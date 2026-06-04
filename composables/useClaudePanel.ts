export interface ClaudeMessage {
  id: string
  role: 'agent' | 'user'
  label: string
  html: string
}

const defaultMessages: ClaudeMessage[] = [
  {
    id: 'deg',
    role: 'agent',
    label: 'AI ANALYST · AUTO-TRIGGERED · DEGRADATION ALERT',
    html:
      '<span class="wa">DeltaDrift short</span> gap: BT 88% vs FWD 71.3%. Above 60% floor — <span class="hi">not failed, monitored</span>. Combo D FOMO partially firing reduces short conviction further. Recommend pause new shorts.',
  },
  {
    id: 'ssi',
    role: 'agent',
    label: 'AI ANALYST · SSI + PATTERN CONTEXT',
    html:
      'QQQ RSI 82.83 + 14.5% above 50DMA: <span class="wa">3/3 negative 1M historically</span>. Tavily confirms Burry calling top, BTIG SOX extreme. SSI +0.4 neutral — no long trigger. Hold core, reduce new entries.',
  },
]

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
  const showBadge = useState('claude-badge', () => true)
  const dismissedAuto = useState('claude-dismissed-auto', () => false)
  const messages = useState<ClaudeMessage[]>('claude-messages', () => [...defaultMessages])
  const draft = useState('claude-draft', () => '')
  const pageContext = useState('claude-context', () => 'Dashboard')
  const sessionId = useState<string | null>('claude-session-id', () => null)
  const sending = useState('claude-sending', () => false)

  function toggle() {
    isOpen.value = !isOpen.value
    if (isOpen.value) showBadge.value = false
  }

  function close() {
    isOpen.value = false
  }

  function setContext(ctx: string) {
    pageContext.value = ctx
  }

  function maybeAutoOpen(page: string, autoTrigger: boolean) {
    if (autoTrigger && !dismissedAuto.value) {
      showBadge.value = true
      setTimeout(() => {
        if (!dismissedAuto.value) {
          isOpen.value = true
          showBadge.value = false
        }
      }, 1600)
    } else if (!isOpen.value) {
      showBadge.value = true
    }
  }

  function dismissAutoForSession() {
    dismissedAuto.value = true
    close()
  }

  async function sendMessage() {
    const text = draft.value.trim()
    if (!text || sending.value) return

    const userId = `user-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        id: userId,
        role: 'user',
        label: 'YOU',
        html: escapeHtml(text),
      },
    ]
    draft.value = ''

    const pendingId = `agent-${Date.now()}`
    messages.value = [
      ...messages.value,
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
      messages.value = messages.value.map((m) =>
        m.id === pendingId ? { ...m, html, label: 'AI ANALYST · ON DEMAND' } : m,
      )
    } catch {
      messages.value = messages.value.map((m) =>
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
    showBadge,
    messages,
    draft,
    pageContext,
    sending,
    toggle,
    close,
    setContext,
    maybeAutoOpen,
    dismissAutoForSession,
    sendMessage,
  }
}
