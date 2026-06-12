import type { TabId } from '~/constants/navigation'
import {
  buildAgentItems,
  buildRegimeStrip,
  buildTopbarStatus,
} from '~/constants/regime-strip'
import type {
  DashboardResponse,
  OverwatchResponse,
  PortfolioResponse,
  RunicNightlyResponse,
  SentimentResponse,
  SignalCountsResponse,
} from '~/types/api'

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
  }>
  navActiveId: string
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
        label: 'Filter',
        items: [
          { id: 'fractal-f', label: 'Fractal Track', dot: 'off' },
          { id: 'trend-f', label: 'TrendPulse', dot: 'off' },
          { id: 'delta-f', label: 'DeltaDrift', dot: 'off' },
          { id: 'interval-f', label: 'By interval', dot: 'off' },
        ],
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
      {
        label: 'Extrema Gate',
        static: '≥80% HIT RATE<br>≥5 INSTANCES MIN<br>PCTL ≥85th OR ≤15th<br>OR RARE (≤8 inst, 80%+)<br><span style="color:var(--gold);font-weight:600">BACKTEST DECIDES.</span><br><span style="color:var(--t3)">Not z-score. Percentile rank.</span><br><span style="color:var(--t3)">Every threshold empirically validated.</span>',
        items: [],
      },
      {
        label: 'Runic Scope — Macro Only',
        static: 'S&P 500 / Nasdaq 100<br>VIX + Term Structure (VXTS)<br>HY Credit Spreads (OAS)<br>CFTC COT Flow (TFF report)<br>Gold/Silver Ratio (GSR)<br>WTI Oil 4-week change<br>CAPE / Shiller PE<br>Fed Balance Sheet (WALCL)<br>USD/CNH exchange rate<br>CPI Surprise vs consensus<br>10Y–2Y Yield Curve<br><span style="color:var(--t4)">Not individual stocks</span>',
        items: [],
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
      {
        label: 'Note on PulseGauge',
        static: 'PulseGauge = the <span style="color:var(--gold)">function</span> with AAII-based long/short entry rules (sentiment.py).<br><br>Super Sentiment Index = the <span style="color:var(--purple)">13-signal composite</span>. Expanded version. May replace or extend PulseGauge function rules once backtested.<br><br>Both sit in Functions left panel.<br>SSI sits on its own page here.',
        items: [],
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
          { id: 'sized', label: 'Sized Allocations', sub: 'regime-aware', dot: 'g' },
          { id: 'forced', label: 'Forced Portfolio', sub: 'Ahil · constrained opt', dot: 'b' },
          { id: 'pnl', label: 'Live P&L', sub: 'open positions', dot: 'gold' },
          { id: 'risk', label: 'Portfolio Risk', sub: 'cluster correlation', dot: 'off' },
        ],
      },
      {
        label: 'Regime Inputs',
        static: 'VIX regime, SSI multiplier, and credit adjustment are computed from live macro variables and sentiment layers when positions are open.',
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
          { id: 'forced', label: 'Forced Portfolio', dot: 'g' },
          { id: 'alerts', label: 'Degradation Alerts', dot: 'r' },
        ],
      },
      {
        label: 'Degradation Thresholds',
        static: 'Live position loss &gt;10% → alert<br>(pod shop rule)<br><br>FWD test WR &lt;60% → alert<br>(absolute floor)<br><br><span style="color:var(--t4)">Not: "lower than backtest"</span><br><span style="color:var(--t4)">That\'s always expected.</span>',
        items: [],
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
  const { data: convictionData } = useConviction()
  const { data: dashboardData } = useFetch<DashboardResponse>('/api/dashboard', { key: 'api-dashboard' })
  const { data: sentimentData } = useFetch<SentimentResponse>('/api/sentiment', { key: 'api-sentiment' })
  const { data: portfolioData } = useFetch<PortfolioResponse>('/api/portfolio', { key: 'api-portfolio' })
  const { data: overwatchData } = useFetch<OverwatchResponse>('/api/overwatch', { key: 'api-overwatch' })
  const { data: nightlyData } = useFetch<RunicNightlyResponse>('/api/runic/nightly', { key: 'runic-nightly' })

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
          if (item.id === 'forced' && ow.kpis?.forced_portfolio_ytd != null) {
            return { ...item, sub: `+${ow.kpis.forced_portfolio_ytd}% YTD` }
          }
          return item
        }),
      }))
    }

    const stripCtx = {
      counts: counts.value,
      dashboard: dashboardData.value,
      sentiment: sentimentData.value,
      nightly: nightlyData.value,
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
    } satisfies TerminalPageConfig
  })

  watch(
    () => route.path,
    (path) => {
      const base = configs[path]
      if (!base) return
      const navIds = base.navGroups.flatMap((g) => g.items).map((i) => i.id)
      if (!navIds.includes(navActiveId.value)) {
        navActiveId.value = base.defaultNavId
      }
    },
    { immediate: true },
  )

  const { setContext } = useClaudePanel()

  watch(
    cfg,
    (c) => {
      if (!c) return
      setContext(tabLabels[c.activeTab])
    },
    { immediate: true },
  )

  function onNavSelect(id: string) {
    navActiveId.value = id
    const item = cfg.value?.navGroups.flatMap((g) => g.items).find((i) => i.id === id)
    if (item?.to) navigateTo(item.to)
  }

  return { cfg, onNavSelect, navActiveId }
}
