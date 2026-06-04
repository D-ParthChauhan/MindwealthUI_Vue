import type {
  RunicAnalogResponse,
  RunicCancelTrackerResponse,
  RunicNightlyResponse,
  RunicVariablesResponse,
} from '~/types/api'

export function getMockRunicNightly(): RunicNightlyResponse {
  return {
    date: '2026-05-28',
    regime: {
      fed_cycle: 'CUTTING_EARLY',
      curve_regime: 'STEEPENING +43bps',
      geo_overlay: 'REGIONAL_WAR',
      val_regime: 'EXTREME',
      liquidity: 'GLOBAL_EASY',
    },
    dominant_signal: 'C',
    dominant_reason: 'STAGFLATION / ENERGY SHOCK',
    brave_fearful: 'TACTICAL_FEARFUL_STRATEGIC_BRAVE',
    active_combos: [
      { combo: 'C', wk: 11, bucket: 'MEDIUM' },
      { combo: 'E', status: 'CONFIRMED_2_OF_3' },
      { combo: 'F', wk: 8, mtm_pct: 21.8 },
    ],
    watch_combos: [{ combo: 'D', legs_confirmed: 2, pending: 'CFTC' }],
    cftc_status: 'PENDING_3DAY_LAG',
    cftc_est_pctile: '75–85th',
    combo_c_cancel_fri: 0,
    wti_4wk_pct: -17.2,
    vix_bypass_active: false,
    combo_e_status: 'CONFIRMED_2_OF_3',
    narrative:
      'Combo C remains dominant at MEDIUM duration wk 11. WTI 4wk Δ at −17% — below cancel gate. Fed cutting early with NFCI loose supports strategic BRAVE via Combo F (wk 8/26, +21.8% MTM). Combo E confirmed 2/3 (CAPE 42× + NFCI). Combo D watch 2/3 pending CFTC Friday. D+C+E = tactical caution; F+liquidity = medium-term constructive. Both horizons simultaneously valid.',
  }
}

export function getMockRunicVariables(): RunicVariablesResponse {
  return {
    date: '2026-05-28',
    heatmap: [
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
    ],
    variables: [
      { num: '01', name: 'NFCI', sub: 'Financial Conditions', source: 'FRED: NFCI<br>Weekly · Tue release', compute: 'Weekly level.<br>3yr pctile rank.', current: '−0.523', current_color: 'var(--amber)', rare_gate: '&gt;+0.3 (tight)<br>&lt;−0.3 (easy)', extreme_gate: '&gt;+0.8 or &lt;−0.6', tier: 'RARE EASY ✓', tier_class: 't-rare', combos: 'A, E', note: '−0.52 &lt; −0.3 → RARE easy. Triggers E leg.' },
      { num: '02', name: 'HY OAS', sub: 'Credit Spreads', source: 'FRED: BAMLH0A0HYM2<br>Daily', compute: 'Daily OAS bps.<br>3yr pctile rank.', current: '~305 bps', current_color: 'var(--t2)', rare_gate: '&gt;400bps OR<br>&gt;+1.0 SD 3yr', extreme_gate: '&gt;500bps OR<br>&gt;+2.0 SD', tier: 'NORMAL', tier_class: 't-norm', combos: 'A,B,F,G', note: '~20th pctile 3yr. B, G not firing on HY leg.' },
      { num: '03', name: 'WALCL', sub: 'Fed Balance Sheet', source: 'FRED: WALCL<br>Weekly Wed', compute: 'MoM % change.<br>3yr pctile rank.', current: '−0.3% MoM', current_color: 'var(--t2)', rare_gate: '±0.8% MoM', extreme_gate: '±1.5% MoM', tier: 'FLAT NORMAL', tier_class: 't-norm', combos: 'A, C', note: 'Flat/shrinking satisfies C leg.' },
      { num: '04', name: 'CNH', sub: 'USD/CNH FX', source: 'Yahoo: CNY=X<br>Daily', compute: '4wk % change.<br>3yr pctile rank.', current: '−0.4% 4wk', current_color: 'var(--t2)', rare_gate: '±2% in 4wks', extreme_gate: '±4% in 4wks', tier: 'NORMAL', tier_class: 't-norm', combos: 'A', note: 'Combo A leg not firing.' },
      { num: '05', name: 'WTI Oil', sub: '4-week rolling Δ%', source: 'Yahoo Finance: CL=F<br>NYMEX close ~14:30 ET', compute: '(today − 28cd ago)<br>÷ 28cd ago · daily.', current: '~$91<br><span style="font-size:8px">4wk Δ: −17%</span>', current_color: 'var(--green)', rare_gate: '±6% in 4wks<br>(fire: &gt;+10%)', extreme_gate: '±10% in 4wks', tier: 'CANCEL ZONE', tier_class: 't-watch', combos: 'C', note: '4wk Δ now −17% — below cancel gate (+5%).', note_color: 'var(--amber)', row_highlight: true },
      { num: '06', name: 'VIX', sub: 'Volatility Index', source: 'Yahoo: ^VIX<br>Daily', compute: 'Level + 20yr<br>pctile rank.', current: '16.7', current_color: 'var(--t2)', rare_gate: '>&gt;25 or &lt;12', extreme_gate: '>&gt;35 or &lt;10', tier: 'NORMAL', tier_class: 't-norm', combos: 'B, D, G', note: 'Below 18 satisfies D leg.', vix_bypass: false },
      { num: '07', name: 'VXTS Ratio', sub: 'VIX3M ÷ VIX', source: 'Yahoo: ^VIX3M ÷ ^VIX<br>Computed daily', compute: 'Ratio. Daily.', current: '~1.25', current_color: 'var(--red)', rare_gate: '&lt;0.95 or &gt;1.10', extreme_gate: '&lt;0.85 or &gt;1.20', tier: 'EXTREME CONTANGO', tier_class: 't-ext', combos: 'D, G', note: '1.25 &gt; 1.20 = EXTREME. D leg ✓ confirmed.', row_highlight: true },
      { num: '08', name: 'CFTC COT', sub: 'Net Spec Positioning', source: 'CFTC.gov TFF report<br>Fri ~15:30 ET', compute: 'Lev_Money + Asset_Mgr<br>3yr pctile.', current: 'PENDING<br><span style="font-size:8px">est. 75–85th pctile</span>', current_color: 'var(--amber)', rare_gate: '&lt;15th or<br>&gt;85th pctile', extreme_gate: '&lt;5th or<br>&gt;95th pctile', tier: 'PENDING · FRI', tier_class: 't-pend', combos: 'B,D,E,F', note: '⚠ 3-DAY LAG. D uses CFTC &gt;85th = complacency top.', note_color: 'var(--amber)' },
      { num: '09', name: 'Yield Curve', sub: '10Y − 2Y spread', source: 'FRED: T10Y2Y<br>Daily', compute: 'Spread bps.<br>3yr pctile rank.', current: '+43 bps', current_color: 'var(--blue)', rare_gate: 'Inverted &lt;0', extreme_gate: 'Deep inv &lt;−50bps', tier: 'STEEPENING', tier_class: 't-norm', combos: '—', note: 'Post-inversion steepening. Regime input.' },
      { num: '10', name: 'CPI Surprise', sub: 'Actual vs consensus', source: 'BLS.gov · Investing.com<br>Monthly', compute: 'Actual − consensus.<br>Surprise pp.', current: '−0.1pp Apr', current_color: 'var(--green)', rare_gate: '±0.2pp surprise', extreme_gate: '±0.4pp surprise', tier: 'NOT HOT ✓', tier_class: 't-norm', combos: 'C', note: 'C leg satisfied. Next CPI Jun 11.' },
      { num: '11', name: 'GSR', sub: 'Gold/Silver Ratio', source: 'Yahoo: GC=F ÷ SI=F<br>Friday pull', compute: 'Ratio level.<br>3yr pctile rank.', current: 'PENDING', current_color: 'var(--t4)', rare_gate: '>&gt;85th or &lt;15th', extreme_gate: '>&gt;95th or &lt;5th', tier: 'PENDING · FRI', tier_class: 't-pend', combos: 'A+ modifier', note: 'Friday data pull required.' },
      { num: '12', name: 'CAPE', sub: 'Shiller P/E', source: 'multpl.com scrape<br>Alt: FRED CAPE', compute: 'Absolute level.<br>Monthly.', current: '42.04×', current_color: 'var(--red)', rare_gate: '>&gt;28× or &lt;16×', extreme_gate: '>&gt;32× or &lt;12×', tier: 'EXTREME (&gt;32×)', tier_class: 't-ext', combos: 'E', note: '42.04× = highest since dot-com. E leg confirmed.', note_color: 'var(--red)', row_highlight: true },
    ],
  }
}

export function getMockRunicAnalog(combo: string): RunicAnalogResponse | null {
  if (combo === 'C') {
    return {
      combo: 'C',
      title: 'Combo C · Stagflation / Energy Shock · SPX Forward Returns from Fire Date',
      subtitle: '83% neg 3m · est. ~4–5 instances',
      title_color: 'var(--red)',
      columns: ['1M', '3M', '6M', '9M', '12M'],
      rows: [
        { date: 'Jun 16, 2008', context: 'Oil $147 peak. Core CPI hot. Pre-GFC.', wti: '$132 (+38% 4wk)', duration: 'LONG >16wks', max_dd: '−48.0%', bottom_timing: 'Oct 2008', returns: [{ val: '−8.1%', cls: 'neg' }, { val: '−28.6%', cls: 'neg' }, { val: '−41.0%', cls: 'neg' }, { val: '−38.2%', cls: 'neg' }, { val: '−35.0%', cls: 'neg' }], verdict: 'SEVERE · GFC', verdict_class: 'b-act' },
        { date: 'Jun 9, 2022', context: 'Russia-Ukraine. WTI +60% from Jan. Fed hiking 75bp.', wti: '$119 (+55% 4wk)', duration: 'MEDIUM 8wks', max_dd: '−22.0%', bottom_timing: 'Oct 2022', returns: [{ val: '−8.4%', cls: 'neg' }, { val: '−16.0%', cls: 'neg' }, { val: '−12.0%', cls: 'neg' }, { val: '−8.5%', cls: 'neg' }, { val: '−5.2%', cls: 'neg' }], verdict: 'MODERATE', verdict_class: 'b-watch' },
        { date: 'Median', context: '2/2 instances negative 3m', wti: '+47% avg', duration: 'MEDIUM', max_dd: '−35%', bottom_timing: '—', returns: [{ val: '−8.3%', cls: 'neg' }, { val: '−22.3%', cls: 'neg' }, { val: '−26.5%', cls: 'neg' }, { val: '−23.4%', cls: 'neg' }, { val: '−20.1%', cls: 'neg' }], verdict: '83% BEARISH 3M', verdict_class: 'b-act', row_class: 'med' },
        { date: 'NOW · May 28, 2026', context: 'Iran WTI +50% peak $117, now $91. CUTTING_EARLY. F simultaneously active.', wti: '$117 peak · $91 now', duration: 'MEDIUM WK 11', max_dd: '?', bottom_timing: 'TBD', returns: [{ val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }], verdict: 'CUTTING CONTEXT', verdict_class: 'b-conf', row_class: 'now', date_color: 'var(--gold)' },
      ],
    }
  }
  if (combo === 'F') {
    return {
      combo: 'F',
      title: 'Combo F · Recovery Signal · Forward Returns · Key Instances',
      subtitle: '~78% hit rate (91% QE) · +9.46% avg 6m',
      title_color: 'var(--green)',
      columns: ['1M', '3M', '6M', '9M', '12M'],
      rows: [
        { date: 'Jun 8, 2020', context: 'COVID recovery. QE max. Short squeeze.', cftc: '≤50th ✓', cftc_color: 'var(--green)', mtm: 'Completed', mtm_style: { color: 'var(--t4)' }, max_dd: '−5.4%', max_dd_cls: 'neg', bottom_timing: 'Mar 2020', returns: [{ val: '+6.2%', cls: 'pos' }, { val: '+12.1%', cls: 'pos' }, { val: '+18.3%', cls: 'pos' }, { val: '+22.4%', cls: 'pos' }, { val: '+36.2%', cls: 'pos' }], verdict: 'STRONG QE', verdict_class: 'b-ok' },
        { date: 'Nov 6, 2023', context: 'Post-rate-peak. Yellen issuance cut. Disinflation.', cftc: '≤50th ✓', cftc_color: 'var(--green)', mtm: 'Completed', mtm_style: { color: 'var(--t4)' }, max_dd: '−3.2%', max_dd_cls: 'neg', bottom_timing: 'Oct 2023', returns: [{ val: '+4.8%', cls: 'pos' }, { val: '+9.2%', cls: 'pos' }, { val: '+17.0%', cls: 'pos' }, { val: '+19.8%', cls: 'pos' }, { val: '+24.1%', cls: 'pos' }], verdict: 'STRONG', verdict_class: 'b-ok' },
        { date: 'Avg key instances', context: '78% hit rate · 91% QE', cftc: '≤50th pctile', cftc_color: 'var(--t4)', mtm: '–', max_dd: '−5.2%', max_dd_cls: 'neg', bottom_timing: '—', returns: [{ val: '+5.1%', cls: 'pos' }, { val: '+9.5%', cls: 'pos' }, { val: '+9.5%', cls: 'pos' }, { val: '+11.8%', cls: 'pos' }, { val: '+13.2%', cls: 'pos' }], verdict: '78% BULLISH 6M', verdict_class: 'b-ok', row_class: 'med' },
        { date: 'NOW · Mar 30, 2026', context: 'Post-tariff recovery. Cutting cycle. Iran C simultaneously MEDIUM.', cftc: '≤50th ✓ (moderate)', cftc_color: 'var(--green)', mtm: '+21.8% (wk 8)', mtm_style: { fontWeight: '600', color: 'var(--green)' }, max_dd: '?', max_dd_cls: 'tbd', bottom_timing: 'TBD', returns: [{ val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }, { val: '?', cls: 'tbd' }], verdict: 'C+F TENSION', verdict_class: 'b-conf', row_class: 'now', date_color: 'var(--gold)' },
      ],
      footnote: 'Current instance already +21.8% at wk 8 vs historical avg +5.1% at 1M. Combo C MEDIUM duration simultaneously active = contested signal.',
    }
  }
  return null
}

export function getMockRunicCancelTracker(): RunicCancelTrackerResponse {
  return {
    combo_c_cancel_fri: 0,
    wti_4wk_pct: -17.2,
    friday_rows: [
      { num: '1 / 4', date: 'May 30', wti: 'TBD · est. −17%', wti_leg: 'POTENTIAL', data: 'No CPI/PPI this week → passes by default', data_leg: 'PASS (dflt)', status: 'PENDING', badge_class: 'b-watch' },
      { num: '2 / 4', date: 'Jun 6', wti: 'TBD', wti_leg: 'FUTURE', data: 'No CPI/PPI scheduled → passes by default', data_leg: 'FUTURE', status: 'FUTURE', badge_class: 'b-off' },
      { num: '3 / 4 ⚡', date: 'Jun 13', wti: 'TBD', wti_leg: 'FUTURE', data: 'CPI: Wed Jun 11 · PPI: Thu Jun 12 → CRITICAL WEEK.', data_leg: 'CRITICAL', status: 'CPI WEEK', badge_class: 'b-watch', highlight: true },
      { num: '4 / 4', date: 'Jun 20', wti: 'TBD', wti_leg: 'FUTURE', data: 'No CPI/PPI scheduled → passes by default', data_leg: 'FUTURE', status: 'FUTURE', badge_class: 'b-off' },
    ],
    cancel_fridays: [
      { label: 'FRI 1\nPENDING', filled: false },
      { label: 'FRI 2\nFUTURE', filled: false },
      { label: 'FRI 3\nCPI WK', filled: false, critical: true },
      { label: 'FRI 4\nFUTURE', filled: false },
    ],
    f_window: {
      fire_date: 'Mar 30, 2026',
      expires: 'Sep 22, 2026',
      weeks_elapsed: 8,
      weeks_total: 26,
      mtm_pct: 21.8,
    },
  }
}
