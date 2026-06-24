import type { OverwatchPanelAlert, OverwatchResponse, OverwatchSystemCheck } from '~/types/api'

export type AnalystTab = 'chat' | 'all' | 'signals' | 'macro' | 'system'

const POLL_MS = 60_000
const TAB_STORAGE_KEY = 'analyst-active-tab'

function tabFromStorage(): AnalystTab {
  if (!import.meta.client) return 'chat'
  const v = localStorage.getItem(TAB_STORAGE_KEY)
  if (v === 'chat' || v === 'signals' || v === 'macro' || v === 'system' || v === 'all') return v
  return 'chat'
}

function autoTabForType(type: OverwatchPanelAlert['type']): AnalystTab | null {
  if (type === 'degradation') return 'signals'
  if (type === 'runic') return 'macro'
  return null
}

export function useOverwatch() {
  const route = useRoute()
  const { isAdmin } = useAuth()

  const panelAlerts = useState<OverwatchPanelAlert[]>('ow-panel-alerts', () => [])
  const systemChecks = useState<OverwatchSystemCheck[]>('ow-system-checks', () => [])
  const activeTab = useState<AnalystTab>('ow-active-tab', tabFromStorage)
  const pendingAlert = useState('ow-pending-alert', () => false)
  const seenAlertIds = useState<Set<string>>('ow-seen-alert-ids', () => new Set())
  const dismissedAlertIds = useState<Set<string>>('ow-dismissed-alert-ids', () => new Set())
  const runicShownOnPath = useState<Record<string, string[]>>('ow-runic-shown-path', () => ({}))
  const polling = useState('ow-polling', () => false)
  const lastPollAt = useState<string | null>('ow-last-poll', () => null)

  const signalAlerts = computed(() => panelAlerts.value.filter((a) => a.type === 'degradation'))
  const macroAlerts = computed(() => panelAlerts.value.filter((a) => a.type === 'runic'))
  const activeAlertCount = computed(() => signalAlerts.value.length + macroAlerts.value.length)

  const badgeText = computed(() => {
    const map: Record<AnalystTab, string> = {
      chat: 'On-demand · signals · macro · web',
      all: 'Overwatch · Claude triggered',
      signals: `Overwatch · ${signalAlerts.value.length} watch active`,
      macro: `Overwatch · ${macroAlerts.value.length} runic active`,
      system: 'System monitor · admin',
    }
    return map[activeTab.value]
  })

  const visibleTabs = computed(() => {
    const tabs: Array<{ id: AnalystTab; label: string }> = [
      { id: 'chat', label: 'CHAT' },
      { id: 'all', label: `ALERTS (${activeAlertCount.value})` },
      { id: 'signals', label: 'SIGNALS' },
      { id: 'macro', label: 'MACRO' },
    ]
    if (isAdmin.value) tabs.push({ id: 'system', label: 'SYSTEM' })
    return tabs
  })

  const tabAlerts = computed(() => {
    if (activeTab.value === 'chat') return []
    switch (activeTab.value) {
      case 'signals':
        return signalAlerts.value
      case 'macro':
        return macroAlerts.value
      case 'all':
        return panelAlerts.value.filter((a) => a.type !== 'system')
      default:
        return []
    }
  })

  function setActiveTab(tab: AnalystTab) {
    if (tab === 'system' && !isAdmin.value) return
    activeTab.value = tab
    if (import.meta.client) localStorage.setItem(TAB_STORAGE_KEY, tab)
  }

  const pollStarted = useState('ow-poll-started', () => false)
  const isOpen = useState('claude-open', () => false)

  const bootstrapped = useState('ow-bootstrapped', () => false)

  function ingestPoll(data: OverwatchResponse) {
    const incoming = data.panel_alerts ?? []
    panelAlerts.value = incoming
    systemChecks.value = data.system_checks ?? []

    if (!bootstrapped.value) {
      for (const a of incoming) seenAlertIds.value.add(a.id)
      bootstrapped.value = true
      if (incoming.some((a) => a.type !== 'system')) pendingAlert.value = true
      return undefined
    }

    const prevSeen = new Set(seenAlertIds.value)
    const fresh = incoming.filter((a) => !prevSeen.has(a.id) && !dismissedAlertIds.value.has(a.id))

    for (const a of incoming) seenAlertIds.value.add(a.id)

    if (fresh.length === 0) return undefined

    pendingAlert.value = true

    const pushAlert = fresh.find((a) => a.type !== 'system') ?? fresh[0]
    if (!pushAlert || pushAlert.type === 'system') return undefined

    if (pushAlert.type === 'runic') {
      const path = route.path
      const shown = runicShownOnPath.value[path] ?? []
      if (shown.includes(pushAlert.id)) return undefined
      runicShownOnPath.value = { ...runicShownOnPath.value, [path]: [...shown, pushAlert.id] }
    }

    const tab = autoTabForType(pushAlert.type)
    if (tab) {
      setActiveTab(tab)
      isOpen.value = true
      clearPending()
      return { autoOpen: true, tab }
    }

    return undefined
  }

  async function poll() {
    polling.value = true
    try {
      const data = await $fetch<OverwatchResponse>('/api/overwatch')
      lastPollAt.value = new Date().toISOString()
      return ingestPoll(data)
    } finally {
      polling.value = false
    }
  }

  function clearPending() {
    pendingAlert.value = false
  }

  function dismissAlert(id: string) {
    dismissedAlertIds.value.add(id)
  }

  function openManualDefaultTab() {
    setActiveTab('chat')
    clearPending()
  }

  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    if (pollStarted.value) return
    pollStarted.value = true
    poll()
    timer = setInterval(poll, POLL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    panelAlerts,
    systemChecks,
    activeTab,
    pendingAlert,
    polling,
    lastPollAt,
    signalAlerts,
    macroAlerts,
    activeAlertCount,
    badgeText,
    visibleTabs,
    tabAlerts,
    isAdmin,
    setActiveTab,
    poll,
    clearPending,
    dismissAlert,
    openManualDefaultTab,
  }
}
