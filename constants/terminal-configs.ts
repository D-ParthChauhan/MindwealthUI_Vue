import type { TabId } from '~/constants/navigation'
import {
  buildAgentItems,
  buildRegimeStrip,
  buildTopbarStatus,
} from '~/constants/regime-strip'
import type {
  DashboardResponse,
  MacroCombosResponse,
  MacroStatusResponse,
  OverwatchResponse,
  PortfolioResponse,
  RunicNightlyResponse,
  SentimentResponse,
  SignalCountsResponse,
} from '~/types/api'
import { SIGNAL_FUNCTION_FILTER_IDS } from '~/utils/signal-filters'
import { dashboardFunctionNavIds } from '~/utils/dashboard-functions'
import { findByFunctionName } from '~/utils/function-match'
import {
  buildMacroNavGroups,
  buildMacroNavGroupsFromCombos,
  defaultMacroNavId,
  defaultMacroNavIdFromCombos,
} from '~/utils/runic-nav'

export interface TerminalPageConfig {
  activeTab: TabId
  status?: { dot: string; label: string }
  navTitle?: string
  regime: {
    dotClass?: string
    headline: string
    labelColor?: string
    items?: string[]
    right?: string
  }
  navGroups: Array<{
    label: string
    items: Array<{
      id: string
      label: string
      sub?: string
      dot: string
      pulse?: boolean
      to?: string
      chips?: Array<{ id: string; label: string }>
    }>
    static?: string
    widget?: 'signals-display-mode' | 'portfolio-flags'
  }>
  navActiveId: string
  multiActiveIds?: string[]
  agentItems: Array<{ dot: string; label: string; right?: boolean }>
  claudeAutoTrigger?: boolean
}

const configs: Record<string, Omit<TerminalPageConfig, 'navActiveId' | 'regime' | 'agentItems' | 'status'> & { defaultNavId: string }> = {
  '/dashboard': {
    activeTab: 'dashboard',
    defaultNavId: 'dashboard',
    navGroups: [
      {
        label: 'Overview',
        items: [
          { id: 'dashboard', label: 'Dashboard', dot: 'gold' },
          { id: 'outstanding', label: 'Outstanding Signals', dot: 'g', to: '/signals' },
          { id: 'new', label: 'New Signals', dot: 'g', to: '/signals' },
          { id: 'shortlist', label: 'Claude Shortlisted', dot: 'gold', to: '/signals' },
        ],
      },
      {
        label: 'Functions (10)',
        items: [
          { id: 'fractal', label: 'Fractal Track', dot: 'g' },
          { id: 'trend', label: 'TrendPulse', dot: 'g' },
          { id: 'delta', label: 'DeltaDrift', dot: 'gold' },
          { id: 'band', label: 'Band Matrix', dot: 'gold' },
          { id: 'sigma', label: 'SigmaShell', dot: 'b' },
          { id: 'pulse', label: 'PulseGauge', dot: 'p' },
          { id: 'alt', label: 'Altitude Alpha', dot: 't' },
          { id: 'osc', label: 'Oscillator Delta', dot: 'off' },
          { id: 'base', label: 'Baseline Divergence', dot: 'off' },
          { id: 'sbi', label: 'SBI', dot: 'off' },
        ],
      },
      {
        label: 'Agents',
        items: [
          { id: 'runic', label: 'Macro · Runic', dot: 'gold', to: '/macro' },
          { id: 'conv', label: 'Conviction Engine', dot: 'p', to: '/conviction' },
          { id: 'ow', label: 'Overwatch', dot: 'b', to: '/overwatch' },
        ],
      },
    ],
  },
  '/signals': {
    activeTab: 'signals',
    defaultNavId: 'outstanding',
    navGroups: [
      {
        label: 'Signals',
        items: [
          { id: 'outstanding', label: 'Outstanding', dot: 'g' },
          { id: 'new', label: 'New Signals', dot: 'g' },
          { id: 'shortlist', label: 'Claude Shortlisted', dot: 'gold' },
          { id: 'report', label: 'All Signal Report', dot: 'off' },
          { id: 'sbi', label: 'SBI — Breadth', dot: 'off' },
          { id: 'high', label: 'Horizontal & New High', dot: 'off' },
          { id: 'perf', label: 'Combined Performance', dot: 'off' },
        ],
      },
      {
        label: 'Filter · Functions',
        items: [
          { id: 'fractal-f', label: 'Fractal Track', dot: 'off' },
          { id: 'trend-f', label: 'TrendPulse', dot: 'off' },
          { id: 'delta-f', label: 'DeltaDrift', dot: 'off' },
          { id: 'band-f', label: 'Band Matrix', dot: 'off' },
          { id: 'sigma-f', label: 'SigmaShell', dot: 'off' },
          { id: 'pulse-f', label: 'PulseGauge', dot: 'off' },
          { id: 'alt-f', label: 'Altitude Alpha', dot: 'off' },
          { id: 'osc-f', label: 'Oscillator Delta', dot: 'off' },
          { id: 'base-f', label: 'Baseline Divergence', dot: 'off' },
          { id: 'sbi-f', label: 'SBI', dot: 'off' },
        ],
        widget: 'signals-display-mode',
      },
    ],
  },
  '/macro': {
    activeTab: 'macro',
    defaultNavId: 'combo-c',
    navGroups: [
      {
        label: 'Active Combos',
        items: [
          { id: 'combo-c', label: 'Combo C · Stagflation', dot: 'r' },
          { id: 'combo-e', label: 'Combo E · Valuation', dot: 'gold' },
          { id: 'combo-f', label: 'Combo F · Recovery', dot: 'g' },
        ],
      },
      {
        label: 'Watch',
        items: [
          { id: 'combo-d', label: 'Combo D · FOMO Top', dot: 'amber' },
        ],
      },
      {
        label: 'Recently Resolved',
        items: [
          { id: 'combo-b', label: 'Combo B · Capitulation', dot: 'off' },
          { id: 'combo-g', label: 'Combo G · Hidden Stress', dot: 'off' },
        ],
      },
    ],
  },
  '/sentiment': {
    activeTab: 'sentiment',
    defaultNavId: 'l1',
    navGroups: [
      {
        label: 'SSI Layers',
        items: [
          { id: 'l1', label: 'Layer 1 · Weekly Pulse', sub: '40% · AAII/NAAIM/P:C/CNN', dot: 'p' },
          { id: 'l2', label: 'Layer 2 · Daily Timing', sub: '35% · 6 signals · ≥2 gate', dot: 'b' },
          { id: 'l3', label: 'Layer 3 · COT Positioning', sub: '25% · Real vs Fast Money', dot: 'gold' },
          { id: 'l4', label: 'Layer 4 · Regime Multiplier', sub: 'VIX/trend/credit · not a signal', dot: 't' },
        ],
      },
    ],
  },
  '/conviction': {
    activeTab: 'conviction',
    defaultNavId: 'signals',
    navGroups: [
      {
        label: 'Views',
        items: [
          {
            id: 'depth',
            label: 'Signal status & depth',
            dot: 'p',
            chips: [
              { id: 'bq', label: 'BQ' },
              { id: 'fs', label: 'FS' },
              { id: 'fd', label: 'fd' },
            ],
          },
          { id: 'signals', label: 'New signals', sub: 'Claude report', dot: 'g' },
          { id: 'portfolio', label: 'Portfolio positions', sub: 'held + conviction', dot: 'g' },
          { id: 'contradictions', label: 'Contradictions', sub: 'quant vs conviction', dot: 'amber' },
        ],
      },
      {
        label: 'Engine Layers',
        items: [
          { id: 'bq', label: 'BQ Score · 15 dims', sub: '7 auto + 8 manual', dot: 'p' },
          { id: 'val', label: 'Valuation Tax', sub: 'sector-calibrated', dot: 'p' },
          { id: 'fs', label: 'FS Cap', sub: 'graduated sizing', dot: 'p' },
          { id: 'yt', label: 'Yield Trap', sub: '2-condition hard gate', dot: 'r' },
        ],
      },
      {
        label: 'Sizing Output',
        static: '≥+8 → MAX 100%<br>≥+5 → TACTICAL 75%<br>≥+2 → REDUCED 40%<br>&lt;+2 → CANCEL 0%<br><span style="color:var(--gold)">fd_positive → +10%pp</span><br><span style="color:var(--red)">fd_negative → −15%pp</span>',
        items: [],
      },
    ],
  },
  '/portfolio': {
    activeTab: 'portfolio',
    defaultNavId: 'sized',
    navGroups: [
      {
        label: 'Portfolio',
        items: [
          { id: 'sized', label: 'Sized Allocations', sub: 'regime-aware sizing', dot: 'g' },
          { id: 'risk', label: 'Portfolio Risk', sub: 'correlation · holdings', dot: 'r' },
          { id: 'pnl', label: 'Live P&L', sub: 'open positions', dot: 'gold' },
        ],
      },
      {
        label: 'Flag guide',
        widget: 'portfolio-flags',
        items: [],
      },
    ],
  },
  '/overwatch': {
    activeTab: 'overwatch',
    defaultNavId: 'health',
    claudeAutoTrigger: true,
    navGroups: [
      {
        label: 'Layer 1 · Performance',
        items: [
          { id: 'health', label: 'Function Health', sub: 'BT vs FWD', dot: 'b' },
          { id: 'alerts', label: 'Degradation Alerts', dot: 'r' },
        ],
      },
      {
        label: 'Layer 2 · System',
        items: [
          { id: 'pipeline', label: 'Data Pipeline', dot: 't' },
          { id: 'autofix', label: 'Auto-Correction Log', dot: 't' },
          { id: 'version', label: 'Version Monitor', dot: 't' },
        ],
      },
    ],
  },
}

function patchNavWithCounts(
  groups: TerminalPageConfig['navGroups'],
  counts: SignalCountsResponse,
  path: string,
): TerminalPageConfig['navGroups'] {
  return groups.map((g) => ({
    ...g,
    items: g.items.map((item) => {
      if (item.id === 'outstanding') {
        if (path === '/signals') {
          return { ...item, label: `Outstanding · ${counts.outstanding}` }
        }
        return { ...item, sub: `${counts.outstanding} active` }
      }
      if (item.id === 'new') {
        if (path === '/signals') {
          return { ...item, label: `New Signals · ${counts.new}` }
        }
        return { ...item, sub: `${counts.new} today` }
      }
      if (item.id === 'shortlist') {
        if (path === '/signals') {
          return { ...item, label: `Claude Shortlisted · ${counts.shortlisted}` }
        }
        return { ...item, sub: String(counts.shortlisted) }
      }
      return item
    }),
  }))
}

const tabLabels: Record<TabId, string> = {
  dashboard: 'Dashboard',
  signals: 'Signals',
  macro: 'Runic Macro Combo Engine',
  sentiment: 'Super Sentiment Index',
  conviction: 'Conviction Engine',
  portfolio: 'Portfolio Sizer',
  overwatch: 'Overwatch',
}

export function useTerminalLayout() {
  const route = useRoute()
  const navActiveId = useState<string>('terminal-nav-id', () => 'dashboard')
  const { counts } = useSignalCounts()
  const { toggleFunctionFilter, multiActiveIds, ensureSignalViewNav } = useSignalFilters()
  const { data: convictionData } = useConviction()
  const { data: dashboardData } = useFetch<DashboardResponse>('/api/dashboard', { key: 'api-dashboard' })
  const { data: sentimentData } = useFetch<SentimentResponse>('/api/sentiment', { key: 'api-sentiment' })
  const { data: portfolioData } = useFetch<PortfolioResponse>('/api/portfolio', { key: 'api-portfolio' })
  const { data: overwatchData } = useFetch<OverwatchResponse>('/api/overwatch', { key: 'api-overwatch' })
  const { data: nightlyData } = useFetch<RunicNightlyResponse>('/api/runic/nightly', { key: 'runic-nightly' })
  const { data: macroCombosData } = useFetch<MacroCombosResponse>('/api/macro/combos', { key: 'macro-combos' })
  const { data: macroStatusData } = useFetch<MacroStatusResponse>('/api/macro/status', { key: 'macro-status' })

  const cfg = computed(() => {
    const base = configs[route.path]
    if (!base) return null
    let navGroups = base.navGroups
    if (counts.value) {
      navGroups = patchNavWithCounts(navGroups, counts.value, route.path)
    }
    if (route.path === '/overwatch' && overwatchData.value) {
      const ow = overwatchData.value
      navGroups = navGroups.map((g) => ({
        ...g,
        items: g.items.map((item) => {
          if (item.id === 'alerts' && ow.count > 0) {
            return { ...item, sub: `${ow.count} active`, pulse: true }
          }
          return item
        }),
      }))
    }
    if (route.path === '/dashboard' && dashboardData.value?.functions_sidebar?.length) {
      const sidebar = dashboardData.value.functions_sidebar
      navGroups = navGroups.map((g) => {
        if (!/functions/i.test(g.label)) return g
        return {
          ...g,
          items: g.items.map((item) => {
            const apiItem = findByFunctionName(sidebar, item.label, 'name')
            if (!apiItem) return item
            return {
              ...item,
              sub: apiItem.subtitle,
              dot: apiItem.status === 'green' ? 'g' : 'r',
            }
          }),
        }
      })
    }
    if (route.path === '/macro' && macroCombosData.value?.combos?.length) {
      navGroups = buildMacroNavGroupsFromCombos(base.navGroups, macroCombosData.value)
    } else if (route.path === '/macro' && nightlyData.value?.combo_status_rows?.length) {
      navGroups = buildMacroNavGroups(base.navGroups, nightlyData.value)
    }

    const stripCtx = {
      counts: counts.value,
      dashboard: dashboardData.value,
      sentiment: sentimentData.value,
      nightly: nightlyData.value,
      macroStatus: macroStatusData.value,
      macroCombos: macroCombosData.value,
      conviction: convictionData.value,
      portfolio: portfolioData.value,
      overwatch: overwatchData.value,
    }

    return {
      ...base,
      navGroups,
      status: buildTopbarStatus(route.path, stripCtx),
      regime: buildRegimeStrip(route.path, stripCtx),
      agentItems: buildAgentItems(route.path, stripCtx),
      navActiveId: navActiveId.value,
      multiActiveIds: route.path === '/signals' ? multiActiveIds.value : undefined,
    } satisfies TerminalPageConfig
  })

  watch(
    () => route.path,
    (path) => {
      const base = configs[path]
      if (!base) return
      if (path === '/signals') ensureSignalViewNav(navActiveId)
      if (path === '/macro' && macroCombosData.value?.combos?.length) {
        syncMacroNavFromCombos(base, macroCombosData.value)
        return
      }
      if (path === '/macro' && nightlyData.value?.combo_status_rows?.length) {
        syncMacroNav(base, nightlyData.value)
        return
      }
      const navIds = base.navGroups.flatMap((g) => g.items).map((i) => i.id)
      if (!navIds.includes(navActiveId.value)) {
        navActiveId.value = base.defaultNavId
      }
    },
    { immediate: true },
  )

  watch(macroCombosData, (combos) => {
    if (route.path !== '/macro' || !combos?.combos?.length) return
    const base = configs['/macro']
    if (!base) return
    syncMacroNavFromCombos(base, combos)
  })

  watch(nightlyData, (nightly) => {
    if (route.path !== '/macro' || macroCombosData.value?.combos?.length) return
    if (!nightly?.combo_status_rows?.length) return
    const base = configs['/macro']
    if (!base) return
    syncMacroNav(base, nightly)
  })

  function syncMacroNavFromCombos(
    base: (typeof configs)['/macro'],
    combos: MacroCombosResponse,
  ) {
    const navIds = buildMacroNavGroupsFromCombos(base.navGroups, combos)
      .flatMap((g) => g.items)
      .map((i) => i.id)
    if (!navIds.includes(navActiveId.value)) {
      navActiveId.value = defaultMacroNavIdFromCombos(combos)
    }
  }

  function syncMacroNav(
    base: (typeof configs)['/macro'],
    nightly: RunicNightlyResponse,
  ) {
    const navIds = buildMacroNavGroups(base.navGroups, nightly)
      .flatMap((g) => g.items)
      .map((i) => i.id)
    if (!navIds.includes(navActiveId.value)) {
      navActiveId.value = defaultMacroNavId(nightly)
    }
  }

  const { setContext } = useClaudePanel()
  const { show: showFunctionPopup } = useFunctionPopup()

  watch(
    cfg,
    (c) => {
      if (!c) return
      setContext(tabLabels[c.activeTab])
    },
    { immediate: true },
  )

  function onNavSelect(id: string) {
    if (route.path === '/signals' && SIGNAL_FUNCTION_FILTER_IDS.has(id)) {
      toggleFunctionFilter(id)
      return
    }
    if (route.path === '/dashboard') {
      const functionIds = dashboardFunctionNavIds(cfg.value?.navGroups ?? [])
      if (functionIds.has(id)) {
        const item = cfg.value?.navGroups.flatMap((g) => g.items).find((i) => i.id === id)
        if (item) {
          showFunctionPopup(item.label)
          navActiveId.value = id
          return
        }
      }
    }
    navActiveId.value = id
    const item = cfg.value?.navGroups.flatMap((g) => g.items).find((i) => i.id === id)
    if (item?.to) navigateTo(item.to)
  }

  return { cfg, onNavSelect, navActiveId }
}
