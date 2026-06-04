export type RunicMacroTab =
  | 'overview'
  | 'variables'
  | 'combos'
  | 'cancel'
  | 'analog'
  | 'brief'

export const RUNIC_MACRO_TABS: Array<{ id: RunicMacroTab; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'variables', label: '12 VARIABLES' },
  { id: 'combos', label: '7 NAMED COMBOS' },
  { id: 'cancel', label: 'COMBO TRACKER' },
  { id: 'analog', label: 'ANALOG TABLES' },
  { id: 'brief', label: 'NIGHTLY BRIEF' },
]

export interface RunicComboCard {
  letter: string
  cardClass?: string
  letterClass?: string
  name: string
  nameClass?: string
  badges: Array<{ text: string; class: string }>
  vars: string
  legs: Array<{ text: string; class: string }>
  right?: { text: string; class?: string }
  note: string
}

export const RUNIC_OVERVIEW_KPIS = [
  { label: 'Dominant Signal', value: 'COMBO C', delta: 'Bearish 83% · 3m horizon', accent: 'r', deltaClass: 'r', valueClass: 'kv-sm' },
  { label: 'C Duration', value: 'Wk 11', delta: 'MEDIUM (6–16 wks)', accent: 'amber', deltaClass: 'amber' },
  { label: 'Combo F Window', value: 'Wk 8', delta: 'of 26 · +22% from fire date', accent: 'g', deltaClass: 'g' },
  { label: 'CAPE · Combo E', value: '42.0×', delta: 'CONFIRMED 2/3 (CAPE+NFCI)', accent: 'r', deltaClass: 'r' },
  { label: 'WTI 4-Wk Δ', value: '−17%', delta: 'Below +5% cancel gate · wk 1', accent: 'b', deltaClass: 'g' },
]

export const RUNIC_HEATMAP = [
  { label: 'NFCI', class: 'heat-rare', title: 'NFCI −0.52 · RARE (easy)' },
  { label: 'HY', class: 'heat-norm', title: 'HY OAS 305bps · NORMAL' },
  { label: 'WALCL', class: 'heat-norm', title: 'WALCL −0.3% MoM · FLAT NORMAL' },
  { label: 'CNH', class: 'heat-norm', title: 'CNH 4wk −0.4% · NORMAL' },
  { label: 'WTI', class: 'heat-cancel', title: 'WTI 4wk −17% · C CANCEL ZONE' },
  { label: 'VIX', class: 'heat-norm', title: 'VIX 16.7 · ~20th pctile 20yr' },
  { label: 'VXTS', class: 'heat-ext', title: 'VXTS 1.25 · EXTREME contango · D gate' },
  { label: 'CFTC', class: 'heat-pend', title: 'CFTC: est. 75–85th pctile · PENDING TFF' },
  { label: 'CURVE', class: 'heat-norm', title: '10Y-2Y +43bps · STEEPENING NORMAL' },
  { label: 'CPI', class: 'heat-norm', title: 'CPI Apr: −0.1pp · NOT HOT' },
  { label: 'GSR', class: 'heat-pend', title: 'GSR: PENDING Friday · A+ modifier' },
  { label: 'CAPE', class: 'heat-ext', title: 'CAPE 42.04× · EXTREME >32×' },
]

export const RUNIC_COMBOS: RunicComboCard[] = [
  {
    letter: 'A',
    name: 'Global Liquidity / FCI Regime',
    badges: [
      { text: 'INACTIVE · 0/4 LEGS', class: 'b-off' },
      { text: 'BRAVE OR FEARFUL', class: 'b-warn' },
    ],
    vars: 'NFCI + HY direction + WALCL + CNH · ≥2 of 4 required simultaneously · 3–6m horizon · ~78% hit rate',
    legs: [
      { text: 'NFCI −0.52: at RARE easy (satisfies A easing leg)', class: 'leg-ok' },
      { text: 'HY 305bps: NORMAL (not RARE tight or easy)', class: 'leg-fail' },
      { text: 'WALCL −0.3% MoM: FLAT (not RARE)', class: 'leg-fail' },
      { text: 'CNH −0.4% 4wk: NORMAL', class: 'leg-fail' },
    ],
    right: { text: '1 OF 4\nneed ≥2' },
    note: '4 validated instances: GFC QE 2009 · COVID QE Mar 2020 · Fed pivot Jan 2019 · Hike onset Mar 2022. Currently only 1 of 4 legs firing (NFCI). A is not active.',
  },
  {
    letter: 'B',
    name: 'Maximum Capitulation / Blood in Streets',
    badges: [
      { text: 'RESOLVED · Apr 2025', class: 'b-off' },
      { text: 'BULLISH CONTRARIAN', class: 'b-bull' },
    ],
    vars: 'VIX >25 AND >80th pctile AND HY >400bps AND CFTC <15th pctile · ALL 3 simultaneously · 3m horizon',
    legs: [
      { text: 'VIX 16.7: NORMAL (gate >25 ✗)', class: 'leg-fail' },
      { text: 'HY 305bps: NORMAL (gate >400 ✗)', class: 'leg-fail' },
      { text: 'CFTC: PENDING · est. extreme long (gate <15th ✗)', class: 'leg-fail' },
    ],
    right: { text: '0 OF 3\nresolved' },
    note: 'Hit rate: 7/8 fires positive SPX 3m later = 87.5%. CRITICAL: When B confirmed → VIX size multiplier BYPASSED. If B fires while F is active, F window cancels immediately.',
  },
  {
    letter: 'C',
    cardClass: 'active-c',
    letterClass: 'active-c',
    name: 'Stagflation / Energy Shock',
    nameClass: 'color:red',
    badges: [
      { text: 'ACTIVE · WK 11 MEDIUM', class: 'b-act' },
      { text: 'BEARISH 83%', class: 'b-bear' },
    ],
    vars: 'WTI >+10% rolling 28-day change AND CPI actual ≤ consensus AND WALCL flat or shrinking · 1–6m · 83% neg 1–6m',
    legs: [
      { text: 'WALCL −0.3% MoM: FLAT ✓ (within ±0.8%)', class: 'leg-ok' },
      { text: 'CPI Apr: −0.1pp vs consensus · NOT HOT ✓', class: 'leg-ok' },
      { text: 'WTI 4wk: −17% · cancel approaching (fire was +50%)', class: 'leg-pend' },
    ],
    right: { text: 'ACTIVE\nWK 11', class: 'color:red' },
    note: 'Fired ~Mar 10, 2026 (Iran conflict WTI +50% peak). Duration MEDIUM wk 11. Cancel requires 4 consecutive Friday assessments where BOTH WTI 4wk Δ <+5% AND CPI/PPI not hot.',
  },
  {
    letter: 'D',
    cardClass: 'watch-c',
    letterClass: 'watch-c',
    name: 'FOMO Top / Euphoria Tactical',
    nameClass: 'color:amber',
    badges: [
      { text: 'WATCH · 2/3 LEGS · CFTC PENDING', class: 'b-watch' },
      { text: 'BEARISH TACTICAL', class: 'b-bear' },
    ],
    vars: 'VXTS ratio >1.10 AND CFTC >85th pctile AND VIX <18 · 3–10 days to 4 weeks · 72–85% · −3 to −5% avg over 5 days',
    legs: [
      { text: 'VXTS 1.25: EXTREME contango ✓✓ (>1.20)', class: 'leg-ext' },
      { text: 'VIX 16.7: strictly <18 ✓', class: 'leg-ok' },
      { text: 'CFTC: est. 75–85th pctile · PENDING Friday TFF', class: 'leg-pend' },
    ],
    right: { text: '2 OF 3\nCFTC pend', class: 'color:amber' },
    note: 'D = Complacency Top signal. When D fires while E is confirmed → E multiplies D conviction. D+F tension: no new longs (D), no capitulation on core (F), tighten stops.',
  },
  {
    letter: 'E',
    cardClass: 'conf-c',
    letterClass: 'conf-c',
    name: 'Valuation Extreme / Slow Burn Top',
    nameClass: 'color:gold',
    badges: [
      { text: 'CONFIRMED · 2 OF 3', class: 'b-conf' },
      { text: 'BEARISH STRUCTURAL', class: 'b-bear' },
    ],
    vars: 'CAPE >28× AND NFCI easy (<−0.3) AND CFTC >80th pctile · 2 of 3 required · 6–18m · ~73% neg fwd 12m',
    legs: [
      { text: 'CAPE 42.04×: EXTREME ✓ (gate >28× · extreme >32×)', class: 'leg-ext' },
      { text: 'NFCI −0.52: RARE easy ✓ (<−0.3 gate)', class: 'leg-ok' },
      { text: 'CFTC: PENDING Fri · 2/3 already met but 3/3 = stronger conviction', class: 'leg-pend' },
    ],
    right: { text: 'CONFIRMED\n2 OF 3', class: 'color:gold' },
    note: 'E is CONFIRMED (2 of 3), not partial. Acts as a MULTIPLIER on Combo D conviction. CAPE 42× = highest since dot-com (~44 in Mar 2000). Long-horizon warning (6–18m).',
  },
  {
    letter: 'F',
    cardClass: 'active-c',
    name: 'Recovery / Re-entry Signal',
    nameClass: 'color:green',
    badges: [
      { text: 'ACTIVE · WK 8 OF 26', class: 'b-ok' },
      { text: 'BULLISH 78%', class: 'b-bull' },
    ],
    vars: 'SPX reclaims 50-Week MA with ≥+3% weekly gain WHILE CFTC ≤50th pctile · 3–6m window (26 weeks)',
    legs: [
      { text: '50WMA reclaim: Mar 30, 2026 · +4.2% weekly ✓', class: 'leg-ok' },
      { text: 'CFTC at reclaim: ≤50th pctile ✓ (short-covering fuel)', class: 'leg-ok' },
      { text: 'Prior break: confirmed (Apr 2025 drawdown) ✓', class: 'leg-ok' },
    ],
    right: { text: 'ACTIVE\nWK 8/26', class: 'color:green' },
    note: 'SPX ~7,550 from fire ~6,200 = +21.8% MTD from fire date. Active until Sep 22, 2026. Only Combo B cancels F early — Combo D does NOT cancel F.',
  },
  {
    letter: 'G',
    name: 'Hidden Stress / Credit-Vol Divergence',
    badges: [
      { text: 'RESOLVED · Apr 2025', class: 'b-off' },
      { text: 'WARNING LEADING', class: 'b-warn' },
    ],
    vars: 'VXTS <1.0 (backwardation) AND HY widening >+30bps in 4 weeks WHILE VIX <20 · leads vol spike 3–6 weeks',
    legs: [
      { text: 'VXTS 1.25: CONTANGO (gate <1.0 backwardation ✗)', class: 'leg-fail' },
      { text: 'HY: not widening >30bps in 4wks ✗', class: 'leg-fail' },
      { text: 'VIX 16.7: below 20 ✓ (one leg only)', class: 'leg-ok' },
    ],
    right: { text: '0 OF 3\nresolved' },
    note: 'Fires BEFORE the event (3–6 week lead). Apr 2025: G fired Feb 2025, B fired Apr 7, SPX −25% then +25%. Now resolved.',
  },
]
