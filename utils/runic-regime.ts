import type { RunicNightlyResponse, RunicRegime } from '~/types/api'

export function fedCyclePillClass(value: string): string {
  const v = value.toUpperCase()
  if (v.includes('CUTTING') || v.includes('QE')) return 'rp-cut'
  if (v.includes('HIKING_LATE') || v.includes('QT')) return 'rp-ext'
  return 'rp-steep'
}

export function curvePillClass(value: string): string {
  const v = value.toUpperCase()
  if (v.includes('INVERTED')) return 'rp-ext'
  if (v.includes('STEEPENING')) return 'rp-steep'
  if (v.includes('NORMAL')) return 'rp-cut'
  return 'rp-steep'
}

export function geoPillClass(value: string): string {
  const v = value.toUpperCase()
  if (['REGIONAL_WAR', 'PANDEMIC', 'FINANCIAL_CRISIS'].some((x) => v.includes(x))) return 'rp-war'
  if (['TRADE_WAR', 'SANCTIONS'].some((x) => v.includes(x))) return 'rp-steep'
  return 'rp-cut'
}

export function valPillClass(value: string): string {
  const v = value.toUpperCase()
  if (v.includes('EXTREME')) return 'rp-ext'
  if (v.includes('ELEVATED')) return 'rp-steep'
  return 'rp-cut'
}

export function liquidityPillClass(value: string): string {
  const v = value.toUpperCase()
  if (v.includes('EASY')) return 'rp-easy'
  if (v.includes('TIGHT')) return 'rp-ext'
  return 'rp-steep'
}

export function formatBraveFearful(value: string): string {
  if (value === 'TACTICAL_FEARFUL_STRATEGIC_BRAVE') {
    return '<span style="color:var(--red)">TACTICAL FEARFUL</span><br><span style="color:var(--green)">STRATEGIC BRAVE</span>'
  }
  if (value.includes('FEARFUL')) {
    return `<span style="color:var(--red)">${value.replace(/_/g, ' ')}</span>`
  }
  if (value.includes('BRAVE')) {
    return `<span style="color:var(--green)">${value.replace(/_/g, ' ')}</span>`
  }
  return value.replace(/_/g, ' ')
}

export function dominantBannerText(data: RunicNightlyResponse): string {
  const active = data.active_combos.find((c) => c.combo === data.dominant_signal)
  const wk = active?.wk ?? active?.duration_weeks
  const bucket = active?.bucket
  const duration = bucket && wk ? ` (${bucket}, WK ${wk})` : ''
  return `DOMINANT: COMBO ${data.dominant_signal} — ${data.dominant_reason}${duration}`
}

export function comboEBadge(status: RunicNightlyResponse['combo_e_status']): string {
  return status === 'CONFIRMED_3_OF_3' ? 'CONFIRMED 3/3' : 'CONFIRMED 2/3'
}

export interface RegimePill {
  label: string
  value: string
  class: string
}

export function buildRegimePills(regime: RunicRegime): RegimePill[] {
  return [
    { label: 'FED CYCLE', value: regime.fed_cycle, class: fedCyclePillClass(regime.fed_cycle) },
    { label: 'YIELD CURVE', value: regime.curve_regime, class: curvePillClass(regime.curve_regime) },
    { label: 'GEOPOLITICAL', value: regime.geo_overlay, class: geoPillClass(regime.geo_overlay) },
    { label: 'VALUATION', value: regime.val_regime, class: valPillClass(regime.val_regime) },
    { label: 'LIQUIDITY', value: regime.liquidity, class: liquidityPillClass(regime.liquidity) },
  ]
}

export function regimePillSource(label: string): string {
  switch (label) {
    case 'YIELD CURVE': return 'FRED:T10Y2Y'
    case 'VALUATION': return 'CAPE'
    case 'LIQUIDITY': return 'FRED:NFCI'
    case 'GEOPOLITICAL': return 'Claude API'
    default: return ''
  }
}
