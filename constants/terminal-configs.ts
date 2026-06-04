import type { TabId } from '~/constants/navigation'
import type { SignalCountsResponse } from '~/types/api'

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

const configs: Record<string, Omit<TerminalPageConfig, 'navActiveId'> & { defaultNavId: string }> = {
  '/dashboard': {
    activeTab: 'dashboard',
    defaultNavId: 'dashboard',
    regime: {
      dotClass: 'warn',
      headline: 'EUPHORIA / RECOVERY TENSION',
      items: [
        'REGIME <span style="color:var(--gold)">D+F PARTIAL</span>',
        'SIGMA <span>−1.2σ</span>',
        'SENTIMENT SCORE <span style="color:var(--teal)">+0.4</span>',
        'VIX <span>16.4</span>',
        'VIX REGIME <span>NORMAL · 80% DEPLOY</span>',
      ],
      right: '<span style="color:var(--red)">TACTICAL FEARFUL</span> · <span style="color:var(--green)">STRATEGIC BRAVE</span>',
    },
    navGroups: [
      {
        label: 'Overview',
        items: [
          { id: 'dashboard', label: 'Dashboard', dot: 'gold' },
          { id: 'outstanding', label: 'Outstanding Signals', sub: '63 active', dot: 'g', to: '/signals' },
          { id: 'new', label: 'New Signals', sub: '7 today', dot: 'g', to: '/signals' },
          { id: 'shortlist', label: 'Claude Shortlisted', sub: '7', dot: 'gold', to: '/signals' },
        ],
      },
      {
        label: 'Functions (10)',
        items: [
          { id: 'fractal', label: 'Fractal Track', sub: 'fib_ret · 100% WR', dot: 'g' },
          { id: 'trend', label: 'TrendPulse', sub: 'trendline · 92.9%', dot: 'g' },
          { id: 'delta', label: 'DeltaDrift', sub: 'distance · ⚠ shorts', dot: 'gold' },
          { id: 'band', label: 'Band Matrix', sub: 'bollinger · 83%', dot: 'gold' },
          { id: 'sigma', label: 'SigmaShell', sub: 'sigma · z-score gated', dot: 'b' },
          { id: 'pulse', label: 'PulseGauge', sub: 'sentiment · AAII+rules', dot: 'p' },
          { id: 'alt', label: 'Altitude Alpha', sub: 'new_high', dot: 't' },
          { id: 'osc', label: 'Oscillator Delta', sub: 'divergence_comp', dot: 'off' },
          { id: 'base', label: 'Baseline Divergence', sub: 'general_divergence', dot: 'off' },
          { id: 'sbi', label: 'SBI', sub: 'signal breadth indicator', dot: 'off' },
        ],
      },
      {
        label: 'Agents',
        items: [
          { id: 'runic', label: 'Macro · Runic', sub: 'D+F partial', dot: 'gold', pulse: true, to: '/macro' },
          { id: 'conv', label: 'Conviction Engine', dot: 'p', to: '/conviction' },
          { id: 'ow', label: 'Overwatch', sub: '1 degradation alert', dot: 'b', pulse: true, to: '/overwatch' },
        ],
      },
    ],
    agentItems: [
      { dot: 'on', label: 'SIGNAL ENGINE · 63' },
      { dot: 'wa', label: 'REGIME · D+F tension' },
      { dot: 'on', label: 'SSI +0.4 neutral' },
      { dot: 'er', label: 'DEGRADATION · DeltaDrift short' },
      { dot: 'on', label: 'AWS · live', right: true },
    ],
  },
  '/signals': {
    activeTab: 'signals',
    defaultNavId: 'outstanding',
    status: { dot: 'g', label: '63 ACTIVE' },
    regime: {
      dotClass: 'warn',
      headline: 'EUPHORIA / RECOVERY TENSION',
      items: ['SENTIMENT SCORE <span style="color:var(--teal)">+0.4 · NEUTRAL</span>'],
      right: '<span style="color:var(--red)">TACTICAL FEARFUL</span> · <span style="color:var(--green)">STRATEGIC BRAVE</span>',
    },
    navGroups: [
      {
        label: 'Signals',
        items: [
          { id: 'outstanding', label: 'Outstanding · 63', dot: 'g' },
          { id: 'new', label: 'New Signals · 7', dot: 'g' },
          { id: 'shortlist', label: 'Claude Shortlisted · 7', dot: 'gold' },
          { id: 'report', label: 'All Signal Report', dot: 'off' },
          { id: 'sbi', label: 'SBI — Breadth', dot: 'off' },
          { id: 'high', label: 'Horizontal & New High', dot: 'off' },
          { id: 'perf', label: 'Combined Performance', dot: 'off' },
        ],
      },
      {
        label: 'Filter',
        items: [
          { id: 'fractal-f', label: 'Fractal Track · 28', dot: 'off' },
          { id: 'trend-f', label: 'TrendPulse · 19', dot: 'off' },
          { id: 'delta-f', label: 'DeltaDrift · 9 ⚠', dot: 'off' },
          { id: 'interval-f', label: 'Monthly · 12 · Weekly · 27', dot: 'off' },
        ],
      },
    ],
    agentItems: [
      { dot: 'on', label: '63 SIGNALS' },
      { dot: 'wa', label: 'Combo D · caution' },
      { dot: 'on', label: 'AWS · live', right: true },
    ],
  },
  '/macro': {
    activeTab: 'macro',
    defaultNavId: 'combo-c',
    status: { dot: 'r', label: 'C WK 11 · E CONFIRMED · D WATCH' },
    regime: {
      dotClass: 'er',
      headline: 'TACTICAL FEARFUL · STRATEGIC BRAVE',
      items: [
        'ACTIVE <span style="color:var(--red)">C(wk11) · E(confirmed 2/3) · F(wk8)</span>',
        'WATCH <span style="color:var(--amber)">D · VXTS 1.25 · CFTC PENDING</span>',
        'DOMINANT <span style="color:var(--red)">C · BEARISH 83% · 3M</span>',
        'C CANCEL <span style="color:var(--amber)">WTI −17% · 0/4 FRIDAYS</span>',
      ],
      right: 'CFTC <span style="color:var(--amber)">3-DAY LAG · PENDING FRI</span>',
    },
    navGroups: [
      {
        label: 'Active Combos',
        items: [
          { id: 'combo-c', label: 'Combo C · Stagflation', sub: 'Wk 11 MEDIUM · 83% bearish', dot: 'r' },
          { id: 'combo-e', label: 'Combo E · Valuation', sub: 'CONFIRMED 2/3 · CAPE 42× + NFCI', dot: 'gold' },
          { id: 'combo-f', label: 'Combo F · Recovery', sub: 'Wk 8 of 26 · bullish 78%', dot: 'g' },
        ],
      },
      {
        label: 'Watch',
        items: [
          { id: 'combo-d', label: 'Combo D · FOMO Top', sub: '2/3 legs · CFTC pending Fri', dot: 'amber' },
        ],
      },
      {
        label: 'Recently Resolved',
        items: [
          { id: 'combo-b', label: 'Combo B · Capitulation', sub: 'Apr 2025 · SPX +25%', dot: 'off' },
          { id: 'combo-g', label: 'Combo G · Hidden Stress', sub: 'Apr 2025 resolved', dot: 'off' },
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
    agentItems: [
      { dot: 'er', label: 'COMBO C · MEDIUM wk 11 · dominant bearish' },
      { dot: 'wa', label: 'D WATCH · 2/3 · CFTC pending Fri' },
      { dot: 'on', label: 'E CONFIRMED 2/3 · CAPE 42× + NFCI' },
      { dot: 'on', label: '298 combos nightly · ≥80% hit rate · percentile rank', right: true },
    ],
  },
  '/sentiment': {
    activeTab: 'sentiment',
    defaultNavId: 'l1',
    status: { dot: 'p', label: 'SSI · 13 SIGNALS' },
    regime: {
      dotClass: 'purple',
      headline: 'SUPER SENTIMENT INDEX (SSI)',
      labelColor: 'var(--purple)',
      items: [
        'SCORE <span style="color:var(--teal)">+0.4 · NEUTRAL</span>',
        'LONG TRIGGER <span>&lt;−0.60</span>',
        'SHORT TRIGGER <span>&gt;+0.60</span>',
        'PULSEGAUGE FUNCTION <span style="color:var(--t3)">SEPARATE — see Functions left nav</span>',
      ],
    },
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
    agentItems: [
      { dot: 'on', label: 'SSI +0.4 neutral · no trigger' },
      { dot: 'on', label: 'Layer 2: 3/6 confirming' },
      { dot: 'on', label: 'positioning.json → C++ 08:00 ET · missing data auto-reweighted', right: true },
    ],
  },
  '/conviction': {
    activeTab: 'conviction',
    defaultNavId: 'signals',
    status: { dot: 'p', label: 'FUNDAMENTAL AGENT' },
    regime: {
      dotClass: 'purple',
      headline: 'CONVICTION ENGINE v5',
      labelColor: 'var(--purple)',
      items: [
        'KXS.TO <span style="color:var(--green)">+12 · MAX CONVICTION</span>',
        'T.TO <span style="color:var(--red)">−6 · YIELD TRAP</span>',
        'NVDA <span style="color:var(--green)">+6 · TACTICAL 85%</span>',
      ],
    },
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
    agentItems: [
      { dot: 'on', label: 'CONVICTION ENGINE · daily run' },
      { dot: 'er', label: 'YIELD TRAP active · T.TO' },
      { dot: 'on', label: 'KXS.TO +6 · TACTICAL 75%' },
      { dot: 'on', label: 'AWS · live', right: true },
    ],
  },
  '/portfolio': {
    activeTab: 'portfolio',
    defaultNavId: 'sized',
    status: { dot: 'g', label: 'SIZER ACTIVE' },
    regime: {
      dotClass: 'ok',
      headline: 'VIX REGIME: NORMAL',
      items: [
        'MAX DEPLOY <span style="color:var(--green)">80%</span>',
        'SSI MULTIPLIER <span>1.00×</span>',
        'CREDIT ADJ <span>0.90×</span>',
        'FINAL CEILING <span style="color:var(--gold)">72%</span>',
        'CASH <span style="color:var(--teal)">28%</span>',
      ],
    },
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
        static: 'VIX 16.4 → 48th pct<br>→ NORMAL regime<br>Base deploy: 80%<br><br>VIX mult: 1.00×<br>Trend mult: 1.00×<br>Credit mult: 0.90×<br>Final: 80% × 0.90 = 72%<br><br><span style="color:var(--gold)">User can override ↓</span>',
        items: [],
      },
    ],
    agentItems: [
      { dot: 'on', label: 'VIX NORMAL · 72% ceiling' },
      { dot: 'on', label: 'SSI mult 1.00× · credit adj 0.90×' },
      { dot: 'er', label: 'TSLA short excluded · degraded' },
      { dot: 'on', label: 'portfolio_sizer.py · daily run', right: true },
    ],
  },
  '/overwatch': {
    activeTab: 'overwatch',
    defaultNavId: 'health',
    claudeAutoTrigger: true,
    status: { dot: 'b', label: 'PERF + SYSTEM · CLAUDE TRIGGERED' },
    regime: {
      dotClass: 'er',
      headline: 'OVERWATCH ALERT · DELTADRIFT SHORT DEGRADING · CLAUDE AUTO-TRIGGERED',
      labelColor: 'var(--red)',
      right: '<div class="lp"><div class="ld b"></div>TAVILY + INTERNAL DATA · ON DEMAND</div>',
    },
    navGroups: [
      {
        label: 'Layer 1 · Performance',
        items: [
          { id: 'health', label: 'Function Health', sub: 'BT vs FWD vs Live', dot: 'b' },
          { id: 'forced', label: 'Forced Portfolio', sub: '+18.4% YTD', dot: 'g' },
          { id: 'alerts', label: 'Degradation Alerts', sub: '1 active', dot: 'r', pulse: true },
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
          { id: 'pipeline', label: 'Data Pipeline', sub: 'Yahoo · FRED · CFTC', dot: 't' },
          { id: 'autofix', label: 'Auto-Correction Log', sub: '1 fixed · 0 open', dot: 't' },
          { id: 'version', label: 'Version Monitor', sub: 'all current', dot: 't' },
        ],
      },
    ],
    agentItems: [
      { dot: 'on', label: 'OVERWATCH · 2 layers' },
      { dot: 'wa', label: 'DEGRADATION · DeltaDrift shorts · amber (above 60%)' },
      { dot: 'on', label: '1 auto-fix · CFTC delay handled' },
      { dot: 'wa', label: 'CLAUDE auto-triggered · see explanation above', right: true },
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
  overwatch: 'Overwatch · Claude triggered',
}

export function useTerminalLayout() {
  const route = useRoute()
  const navActiveId = useState<string>('terminal-nav-id', () => 'dashboard')
  const { counts } = useSignalCounts()
  const { data: convictionData } = useConviction()

  const cfg = computed(() => {
    const base = configs[route.path]
    if (!base) return null
    let navGroups = base.navGroups
    let status = base.status
    let regime = base.regime
    if (counts.value) {
      navGroups = patchNavWithCounts(navGroups, counts.value, route.path)
      if (route.path === '/signals') {
        status = { dot: 'g', label: `${counts.value.outstanding} ACTIVE` }
      }
    }
    if (route.path === '/conviction' && convictionData.value) {
      const { storeLive, asOf } = convictionData.value
      const liveLabel = storeLive ? 'conviction_store live' : 'mock data'
      const liveColor = storeLive ? 'var(--green)' : 'var(--t3)'
      regime = {
        ...regime,
        right: `<span style="color:${liveColor}">${liveLabel}</span> · as of ${asOf}`,
      }
    }
    return {
      ...base,
      navGroups,
      status,
      regime,
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

  const { setContext, maybeAutoOpen } = useClaudePanel()

  watch(
    cfg,
    (c) => {
      if (!c) return
      setContext(tabLabels[c.activeTab])
      maybeAutoOpen(c.activeTab, !!c.claudeAutoTrigger)
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
