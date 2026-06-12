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

export function pillClassToColor(pillClass: string): string {
  switch (pillClass) {
    case 'rp-war':
    case 'rp-ext':
      return 'var(--red)'
    case 'rp-cut':
      return 'var(--green)'
    case 'rp-steep':
      return 'var(--blue)'
    case 'rp-easy':
      return 'var(--teal)'
    default:
      return 'var(--gold)'
  }
}

export function regimeValColor(regimeValue: string): string {
  return pillClassToColor(valPillClass(regimeValue))
}

export function sigmaStripColor(sigma: string): string {
  const normalized = sigma.replace(/[−–]/g, '-')
  const m = normalized.match(/([-+]?\d*\.?\d+)/)
  if (!m) return 'var(--blue)'
  const n = Number(m[1])
  if (n < 0) return 'var(--green)'
  if (n > 0) return 'var(--red)'
  return 'var(--blue)'
}

export function vixStripColor(vix: number, valRegime?: string): string {
  if (valRegime) return regimeValColor(valRegime)
  if (vix >= 30) return 'var(--red)'
  if (vix >= 20) return 'var(--amber)'
  return 'var(--green)'
}

export function deployStripColor(pct: number): string {
  if (pct >= 65) return 'var(--green)'
  if (pct >= 40) return 'var(--gold)'
  return 'var(--amber)'
}

export function sentimentStripColor(score: string): string {
  const m = score.replace(/[−–]/g, '-').match(/([-+]?\d*\.?\d+)/)
  if (!m) return 'var(--teal)'
  const n = Number(m[1])
  if (n < -0.6) return 'var(--green)'
  if (n > 0.85) return 'var(--red)'
  return 'var(--teal)'
}

export function braveFearfulHorizonColor(): string {
  return 'var(--gold)'
}

export function braveFearfulStanceColor(stance: string): string {
  const v = stance.toUpperCase()
  if (v.includes('FEARFUL') || v.includes('TIGHT') || v.includes('HARD') || v.includes('WAR')) {
    return 'var(--red)'
  }
  if (v.includes('BRAVE') || v.includes('EASY') || v.includes('MONEY') || v.includes('CUT')) {
    return 'var(--green)'
  }
  return 'var(--amber)'
}

export function parseBraveFearfulParts(
  raw: string,
  display?: string,
): [string, string] | null {
  const tokens = raw.split('_').filter(Boolean)
  const strategicIdx = tokens.indexOf('STRATEGIC')
  const tacticalIdx = tokens.indexOf('TACTICAL')

  if (tacticalIdx >= 0 && strategicIdx > tacticalIdx) {
    return [
      tokens.slice(tacticalIdx, strategicIdx).join(' '),
      tokens.slice(strategicIdx).join(' '),
    ]
  }

  const horizonIdx = tacticalIdx >= 0 ? tacticalIdx : strategicIdx
  if (horizonIdx >= 0) {
    const horizon = tokens[horizonIdx]
    const stance = tokens.slice(horizonIdx + 1).join(' ')
    if (stance) return [horizon, stance]
  }

  const text = (display ?? raw.replace(/_/g, ' ')).trim()
  const m = text.match(/^(TACTICAL|STRATEGIC)\s+(.+)$/i)
  if (m) return [m[1].toUpperCase(), m[2].toUpperCase()]

  return null
}

export function directionStripColor(direction: string): string {
  const v = direction.toUpperCase()
  if (v.includes('BULLISH') || v.includes('BRAVE')) return 'var(--green)'
  if (v.includes('BEARISH') || v.includes('FEARFUL')) return 'var(--red)'
  return 'var(--amber)'
}

function comboRowDirection(
  nightly: RunicNightlyResponse,
  comboId: string,
): string | undefined {
  return nightly.combo_status_rows
    ?.find((r) => r.combo === comboId)
    ?.direction
    ?.trim()
}

function resolveStrategicComboRow(nightly: RunicNightlyResponse) {
  const rows = nightly.combo_status_rows ?? []
  const dominant = nightly.dominant_signal
  const active = nightly.active_combos ?? []

  const ranked = active
    .filter((c) => c.combo && c.combo !== dominant)
    .map((c) => {
      const row = rows.find((r) => r.combo === c.combo)
      const status = (c.status ?? row?.status ?? '').toUpperCase()
      const rank = status.includes('CONFIRMED') ? 0 : status.includes('ACTIVE') ? 1 : 2
      return { row, rank }
    })
    .filter((x) => x.row?.direction)
    .sort((a, b) => a.rank - b.rank)

  if (ranked[0]?.row) return ranked[0].row

  return rows.find(
    (r) =>
      r.combo !== dominant
      && r.direction
      && r.status.toUpperCase().includes('CONFIRMED'),
  )
}

function normalizePositionLabel(
  horizon: 'TACTICAL' | 'STRATEGIC',
  value: string,
): string {
  const v = value.trim().toUpperCase().replace(/_/g, ' ')
  if (v.startsWith(horizon)) return v
  if (v === 'BULLISH' || v === 'BEARISH' || v === 'BRAVE' || v === 'FEARFUL') {
    return `${horizon} ${v}`
  }
  return v.includes(' ') ? v : `${horizon} ${v}`
}

export function resolveTacticalStrategicLabels(
  nightly: RunicNightlyResponse,
): { tactical?: string; strategic?: string } {
  if (nightly.tactical_position || nightly.strategic_position) {
    return {
      tactical: nightly.tactical_position
        ? normalizePositionLabel('TACTICAL', nightly.tactical_position)
        : undefined,
      strategic: nightly.strategic_position
        ? normalizePositionLabel('STRATEGIC', nightly.strategic_position)
        : undefined,
    }
  }

  const dominant = nightly.dominant_signal
  const domDirection = dominant ? comboRowDirection(nightly, dominant) : undefined
  const tactical = domDirection
    ? normalizePositionLabel('TACTICAL', domDirection)
    : undefined

  const strategicRow = resolveStrategicComboRow(nightly)
  const strategic = strategicRow?.direction
    ? normalizePositionLabel('STRATEGIC', strategicRow.direction)
    : undefined

  if (tactical || strategic) return { tactical, strategic }

  const raw = nightly.brave_fearful?.trim()
  if (!raw) return {}

  const parts = parseBraveFearfulParts(raw, nightly.brave_fearful_display)
  if (parts) {
    const [a, b] = parts
    const firstIsStrategic = a.toUpperCase().startsWith('STRATEGIC')
    return {
      tactical: (firstIsStrategic ? b : a).toUpperCase(),
      strategic: (firstIsStrategic ? a : b).toUpperCase(),
    }
  }

  const display = nightly.brave_fearful_display?.trim() || raw.replace(/_/g, ' ')
  if (display.toUpperCase().startsWith('TACTICAL')) {
    return { tactical: display.toUpperCase() }
  }
  if (display.toUpperCase().startsWith('STRATEGIC')) {
    return { strategic: display.toUpperCase() }
  }

  return {}
}

export function formatRegimeStripRight(nightly: RunicNightlyResponse): string | undefined {
  const { tactical, strategic } = resolveTacticalStrategicLabels(nightly)
  const segments: string[] = []

  if (tactical) {
    segments.push(
      `<span class="rsv" style="color:${directionStripColor(tactical)}">${tactical}</span>`,
    )
  }
  if (strategic) {
    segments.push(
      `<span class="rsv" style="color:${directionStripColor(strategic)}">${strategic}</span>`,
    )
  }

  return segments.length ? segments.join(' · ') : undefined
}

/** @deprecated Use formatRegimeStripRight */
export function formatBraveFearfulStrip(nightly: RunicNightlyResponse): string | undefined {
  return formatRegimeStripRight(nightly)
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

export function formatPersistenceSignals(signals?: string[]): string {
  if (!signals?.length) return ''
  return signals.join(' · ')
}

/** Regime strip headline — e.g. RECOVERY TENSION, EUPHORIA / RECOVERY TENSION */
export function deriveRegimeLabel(nightly: RunicNightlyResponse): string {
  if (nightly.regime_label?.trim()) return nightly.regime_label.trim()

  if (nightly.persistence_signals?.length) {
    const parts: string[] = []
    const joined = nightly.persistence_signals.join(' ').toUpperCase()
    if (joined.includes('FOMO') || joined.includes('EUPHORIA')) parts.push('EUPHORIA')
    if (
      joined.includes('3WK_SURGE')
      || joined.includes('FCI_EASING')
      || joined.includes('RECOVERY')
      || joined.includes('SURGE')
    ) {
      parts.push('RECOVERY TENSION')
    }
    if (parts.length) return parts.join(' / ')
    return nightly.persistence_signals.join(' · ')
  }

  const labelParts: string[] = []
  const watchIds = nightly.watch_combos.map((w) => w.combo)
  const fomoWatch = watchIds.includes('D')
    || nightly.combo_status_rows?.some(
      (r) => r.combo === 'D' && r.status === 'WATCH',
    )
  if (fomoWatch) labelParts.push('EUPHORIA')

  const dominantRow = nightly.combo_status_rows?.find((r) => r.combo === nightly.dominant_signal)
  const dominantTheme = (dominantRow?.name ?? '').split('/')[0].trim()
  const recoveryDominant =
    nightly.dominant_signal === 'F'
    || dominantTheme.toLowerCase().includes('recovery')
  const hasTension =
    nightly.watch_combos.length > 0
    || (nightly.active_combos?.length ?? 0) > 1

  if (recoveryDominant) {
    labelParts.push(hasTension ? 'RECOVERY TENSION' : 'RECOVERY')
  } else if (dominantTheme) {
    const theme = dominantTheme.toUpperCase()
    labelParts.push(hasTension ? `${theme} TENSION` : theme)
  } else if (nightly.dominant_signal && nightly.dominant_signal !== '—') {
    labelParts.push(
      hasTension
        ? `${nightly.dominant_signal} TENSION`
        : nightly.dominant_signal,
    )
  }

  return labelParts.length ? labelParts.join(' / ') : 'MACRO REGIME'
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
