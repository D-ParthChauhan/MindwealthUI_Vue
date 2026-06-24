import type {
  MacroCombosResponse,
  MacroDataFreshnessResponse,
  MacroNamedCombo,
  MacroNarrativeResponse,
  MacroOverviewKpisResponse,
  MacroPersistenceResponse,
  MacroRegimeResponse,
  MacroSsiInput,
  MacroSsiMultiplierResponse,
  MacroSsiSummaryResponse,
  MacroStatusResponse,
  RunicAnalogResponse,
  RunicAnalogReturn,
  RunicCancelTrackerResponse,
  RunicComboStatusRow,
  RunicNightlyResponse,
  RunicRegime,
  RunicVariableRow,
  RunicVariablesResponse,
} from '~/types/api'

type ApiVariable = {
  num?: number
  variable?: string
  current?: number | string
  tier?: string
  pctile_3yr?: number
  regime_pctile?: number
  direction?: string | null
  source_date?: string | null
  lag_days?: number | null
}

type ApiNightly = Record<string, unknown>

const TIER_CLASS: Record<string, RunicVariableRow['tier_class']> = {
  NORMAL: 't-norm',
  RARE: 't-rare',
  'RARE EASY': 't-rare',
  EXTREME: 't-ext',
  PENDING: 't-pend',
  'CANCEL ZONE': 't-watch',
}

const HEAT_CLASS: Record<string, string> = {
  NORMAL: 'heat-norm',
  RARE: 'heat-rare',
  'RARE EASY': 'heat-rare',
  EXTREME: 'heat-ext',
  PENDING: 'heat-pend',
  'CANCEL ZONE': 'heat-cancel',
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function variableDashboard(raw: ApiNightly): ApiVariable[] {
  const list = raw.variables_dashboard
  return Array.isArray(list) ? (list as ApiVariable[]) : []
}

function findVariable(raw: ApiNightly, name: string): ApiVariable | undefined {
  const key = name.toUpperCase()
  return variableDashboard(raw).find((v) => String(v.variable ?? '').toUpperCase() === key)
}

function mapRegime(raw: unknown): RunicRegime {
  const r = asRecord(raw) ?? {}
  return {
    fed_cycle: String(r.fed_cycle ?? '—'),
    curve_regime: String(r.curve_regime ?? '—'),
    geo_overlay: String(r.geo_overlay ?? '—'),
    val_regime: String(r.val_regime ?? '—'),
    liquidity: String(r.liquidity ?? '—'),
    fed_cycle_source: r.fed_cycle_source != null ? String(r.fed_cycle_source) : undefined,
    curve_regime_source: r.curve_regime_source != null ? String(r.curve_regime_source) : undefined,
    val_regime_source: r.val_regime_source != null ? String(r.val_regime_source) : undefined,
    liquidity_source: r.liquidity_source != null ? String(r.liquidity_source) : undefined,
  }
}

function comboEStatus(raw: ApiNightly): RunicNightlyResponse['combo_e_status'] {
  const e = (raw.active_combos as Array<Record<string, unknown>> | undefined)?.find(
    (c) => String(c.combo) === 'E',
  )
  if (!e) {
    const row = (raw.combo_status_rows as Array<Record<string, unknown>> | undefined)?.find(
      (r) => String(r.combo) === 'E',
    )
    if (!row) return 'CONFIRMED_2_OF_3'
    const legs = row.confirmed_legs as string[] | undefined
    if (Array.isArray(legs) && legs.length >= 3) return 'CONFIRMED_3_OF_3'
    if (String(row.status).toUpperCase() === 'CONFIRMED') return 'CONFIRMED_2_OF_3'
    return 'CONFIRMED_2_OF_3'
  }
  const legs = e.confirmed_legs as string[] | undefined
  if (Array.isArray(legs) && legs.length >= 3) return 'CONFIRMED_3_OF_3'
  if (e.status === 'CONFIRMED') return 'CONFIRMED_2_OF_3'
  return 'CONFIRMED_2_OF_3'
}

function mapActiveCombo(c: Record<string, unknown>): RunicNightlyResponse['active_combos'][number] {
  const legs = c.confirmed_legs
  return {
    combo: String(c.combo ?? ''),
    wk: c.duration_weeks != null ? Number(c.duration_weeks) : undefined,
    duration_weeks: c.duration_weeks != null ? Number(c.duration_weeks) : undefined,
    bucket: c.duration_bucket != null ? String(c.duration_bucket) : undefined,
    status: c.status != null ? String(c.status) : undefined,
    mtm_pct: c.mtm_pct != null
      ? Math.round(Number(c.mtm_pct) * 10) / 10
      : c.avg_return_3m != null
        ? Math.round(Number(c.avg_return_3m) * 10) / 10
        : undefined,
    episode_start: c.episode_start != null ? String(c.episode_start) : undefined,
    confirmed_legs: Array.isArray(legs) ? legs.map(String) : undefined,
    primary_label: c.primary_label != null ? String(c.primary_label) : undefined,
    hit_rate_primary: c.hit_rate_primary != null ? Number(c.hit_rate_primary) : undefined,
    avg_return_primary: c.avg_return_primary != null ? Number(c.avg_return_primary) : undefined,
    n_obs_primary: c.n_obs_primary != null ? Number(c.n_obs_primary) : undefined,
    secondary_label: c.secondary_label != null ? String(c.secondary_label) : undefined,
    hit_rate_secondary: c.hit_rate_secondary != null ? Number(c.hit_rate_secondary) : undefined,
    avg_return_secondary: c.avg_return_secondary != null ? Number(c.avg_return_secondary) : undefined,
  }
}

export function mapRunicNightly(raw: ApiNightly): RunicNightlyResponse {
  const activeRaw = (raw.active_combos as Array<Record<string, unknown>> | undefined) ?? []
  const active_combos = activeRaw.map(mapActiveCombo)

  const watchRaw = (raw.watch_combos as unknown[] | undefined) ?? []
  const watch_combos = watchRaw.map((w) => {
    if (typeof w === 'string') {
      const statusRows = (raw.combo_status_rows as Array<Record<string, unknown>> | undefined) ?? []
      const row = statusRows.find((r) => String(r.combo) === w)
      const legs = row?.confirmed_legs
      return {
        combo: w,
        legs_confirmed: Array.isArray(legs) ? legs.length : 0,
        pending: String(row?.pending ?? 'CFTC'),
      }
    }
    const obj = asRecord(w) ?? {}
    const legs = obj.confirmed_legs
    return {
      combo: String(obj.combo ?? ''),
      legs_confirmed: Array.isArray(legs) ? legs.length : Number(obj.legs_confirmed ?? 0),
      pending: String(obj.pending ?? 'CFTC'),
    }
  })

  const wtiVar = findVariable(raw, 'WTI')
  const vixVar = findVariable(raw, 'VIX')
  const nfciVar = findVariable(raw, 'NFCI')
  const cancel = asRecord(raw.combo_c_cancel) ?? {}
  const cftcStatus = String(raw.cftc_status ?? '')
  const cftcVar = findVariable(raw, 'CFTC')
  const valRegime = String(mapRegime(raw.regime).val_regime ?? 'NORMAL')
  const maxDeployPct = valRegime === 'EXTREME' ? 70 : 80
  const nfciNum = nfciVar?.current != null ? Number(nfciVar.current) : null
  const nfciSigma =
    nfciNum != null && Number.isFinite(nfciNum)
      ? `${nfciNum >= 0 ? '+' : ''}${nfciNum.toFixed(2)}σ`
      : undefined

  const persistenceRaw = (raw.persistence_signals as unknown[] | undefined) ?? []
  const persistence_signals = persistenceRaw
    .map((p) => {
      if (typeof p === 'string') return p.trim()
      const row = asRecord(p)
      if (!row) return ''
      return String(row.signal ?? row.type ?? row.name ?? row.label ?? '').trim()
    })
    .filter(Boolean)

  const comboStatusRaw = (raw.combo_status_rows as Array<Record<string, unknown>> | undefined) ?? []
  const combo_status_rows = comboStatusRaw.map((r) => ({
    combo: String(r.combo ?? ''),
    name: String(r.name ?? ''),
    status: String(r.status ?? ''),
    direction: String(r.direction ?? '').trim() || undefined,
    duration: r.duration != null ? String(r.duration) : undefined,
    hit_rate_3m: r.hit_rate_3m != null ? String(r.hit_rate_3m) : undefined,
    avg_return_3m: r.avg_return_3m != null ? String(r.avg_return_3m) : undefined,
  }))

  return {
    date: String(raw.date ?? ''),
    regime: mapRegime(raw.regime),
    dominant_signal: String(raw.dominant_signal ?? '—'),
    dominant_reason: String(raw.dominant_reason ?? ''),
    brave_fearful: String(raw.brave_fearful ?? ''),
    brave_fearful_display: String(raw.brave_fearful_display ?? ''),
    tactical_position: String(raw.tactical ?? raw.tactical_position ?? '').trim() || undefined,
    strategic_position: String(raw.strategic ?? raw.strategic_position ?? '').trim() || undefined,
    regime_label: String(raw.regime_label ?? '').trim() || undefined,
    persistence_signals: persistence_signals.length ? persistence_signals : undefined,
    combo_status_rows: combo_status_rows.length ? combo_status_rows : undefined,
    active_combos,
    watch_combos,
    vix: vixVar?.current != null ? Math.round(Number(vixVar.current) * 100) / 100 : undefined,
    nfci_sigma: nfciSigma,
    max_deploy_pct: maxDeployPct,
    cftc_status: cftcStatus.includes('PENDING') ? 'PENDING_3DAY_LAG' : 'CONFIRMED',
    cftc_est_pctile:
      cftcVar?.pctile_3yr != null
        ? `${Math.round(Number(cftcVar.pctile_3yr))}th`
        : undefined,
    combo_c_cancel_fri: Number(cancel.wti_potential_week ?? 0),
    wti_4wk_pct: wtiVar?.current != null ? Number(wtiVar.current) : 0,
    vix_bypass_active: Boolean(raw.vix_bypass),
    combo_e_status: comboEStatus(raw),
    narrative: String(raw.narrative ?? ''),
  }
}

function formatCurrent(v: ApiVariable): string {
  if (v.current == null) return '—'
  const n = Number(v.current)
  if (!Number.isFinite(n)) return String(v.current)
  if (String(v.variable).toUpperCase() === 'WTI') {
    return `4wk Δ: ${n.toFixed(1)}%`
  }
  if (Math.abs(n) < 10 && String(v.variable).toUpperCase() !== 'CAPE') {
    return n.toFixed(3)
  }
  return n.toFixed(2)
}

export function mapRunicVariables(raw: ApiNightly): RunicVariablesResponse {
  const vars = variableDashboard(raw)
  const heatmap = vars.map((v) => {
    const tier = String(v.tier ?? 'NORMAL')
    const label = String(v.variable ?? '')
    const pct =
      v.pctile_3yr != null ? ` · ${Math.round(Number(v.pctile_3yr))}th pctile` : ''
    return {
      label,
      class: HEAT_CLASS[tier] ?? 'heat-norm',
      title: `${label} ${formatCurrent(v)} · ${tier}${pct}`,
    }
  })

  const variables: RunicVariableRow[] = vars.map((v) => {
    const tier = String(v.tier ?? 'NORMAL')
    const name = String(v.variable ?? '')
    const lagNote =
      v.lag_days != null
        ? `Lag ${v.lag_days}d`
        : v.source_date
          ? `As of ${v.source_date}`
          : ''
    const dirNote =
      v.direction != null && v.direction !== '' ? `Direction: ${v.direction}` : ''
    const note = [dirNote, lagNote].filter(Boolean).join(' · ') || '—'
    return {
      num: String(v.num ?? '').padStart(2, '0'),
      name,
      sub: tier,
      source: v.source_date != null ? String(v.source_date) : '—',
      compute:
        v.pctile_3yr != null
          ? `3yr pctile: ${Number(v.pctile_3yr).toFixed(1)}`
          : v.regime_pctile != null
            ? `Regime pctile: ${Number(v.regime_pctile).toFixed(1)}`
            : '—',
      current: formatCurrent(v),
      current_color:
        tier === 'EXTREME' ? 'var(--red)' : tier.includes('RARE') ? 'var(--amber)' : 'var(--t2)',
      rare_gate: '—',
      extreme_gate: '—',
      tier,
      tier_class: TIER_CLASS[tier] ?? 't-norm',
      combos: '—',
      note,
      row_highlight: tier === 'EXTREME' || tier === 'CANCEL ZONE',
      vix_bypass: name.toUpperCase() === 'VIX' ? Boolean(raw.vix_bypass) : undefined,
    }
  })

  return {
    date: String(raw.date ?? ''),
    heatmap,
    variables,
  }
}

export function mapRunicCancelTracker(nightly: ApiNightly): RunicCancelTrackerResponse {
  const cancel = asRecord(nightly.combo_c_cancel) ?? {}
  const wtiVar = findVariable(nightly, 'WTI')
  const wtiPct = wtiVar?.current != null ? Number(wtiVar.current) : 0
  const fWeeks = Number(nightly.combo_f_weeks_elapsed ?? 0)
  const cancelWeek = Number(cancel.wti_potential_week ?? 0)
  const statusRows = (nightly.combo_status_rows as Array<Record<string, unknown>> | undefined) ?? []
  const rowC = statusRows.find((r) => String(r.combo) === 'C')
  const rowF = statusRows.find((r) => String(r.combo) === 'F')
  const fCombo = (nightly.active_combos as Array<Record<string, unknown>> | undefined)?.find(
    (c) => String(c.combo) === 'F',
  )

  const fridayCount = Math.min(4, Math.max(0, cancelWeek))
  const cancel_fridays = Array.from({ length: 4 }, (_, i) => ({
    label: `Fri ${i + 1}`,
    filled: i < fridayCount,
    critical: i === fridayCount && fridayCount < 4,
  }))

  const cancelled = Boolean(cancel.cancelled)
  const wtiLeg = wtiPct < 5 ? 'CLEAR' : 'FAIL'

  return {
    combo_c_cancel_fri: fridayCount,
    wti_4wk_pct: Math.round(wtiPct * 10) / 10,
    friday_rows: [
      {
        num: String(fridayCount || 1),
        date: String(cancel.last_check_date ?? nightly.date ?? '—'),
        wti: `${wtiPct.toFixed(1)}%`,
        wti_leg: wtiLeg,
        data: cancel.cancelled
          ? `Cancelled ${cancel.cancel_date ?? cancel.last_check_date ?? '—'}`
          : String(cancel.pending_cpi_release ?? nightly.pending_cpi_release ?? '—'),
        data_leg: cancel.cancelled ? 'CLEAR' : '—',
        status: cancelled ? 'CANCELLED' : String(rowC?.status ?? '—'),
        badge_class: cancelled ? 'b-off' : 'b-watch',
        highlight: !cancelled,
      },
    ],
    cancel_fridays,
    f_window: {
      fire_date: String(fCombo?.episode_start ?? '—'),
      expires: '—',
      weeks_elapsed: fWeeks,
      weeks_total: 26,
      mtm_pct:
        fCombo?.avg_return_3m != null
          ? Math.round(Number(fCombo.avg_return_3m) * 10) / 10
          : 0,
    },
    combo_c_cancelled: cancelled,
    combo_c_cancel_date:
      cancel.cancel_date != null ? String(cancel.cancel_date) : undefined,
    combo_f_active: Boolean(nightly.combo_f_active),
    dominant_signal: String(nightly.dominant_signal ?? ''),
    dominant_reason: String(nightly.dominant_reason ?? ''),
    combo_c_status: rowC?.status != null ? String(rowC.status) : undefined,
    combo_c_duration: rowC?.duration != null ? String(rowC.duration) : undefined,
    combo_f_status: rowF?.status != null ? String(rowF.status) : undefined,
    combo_f_duration: rowF?.duration != null ? String(rowF.duration) : undefined,
  }
}

function fmtReturn(n: unknown): RunicAnalogReturn {
  if (n == null || n === '') return { val: 'TBD', cls: 'tbd' }
  const v = Number(n)
  if (!Number.isFinite(v)) return { val: 'TBD', cls: 'tbd' }
  // API uses 0.0 as placeholder while forward windows are still open
  if (v === 0) return { val: 'TBD', cls: 'tbd' }
  const sign = v >= 0 ? '+' : ''
  return { val: `${sign}${v.toFixed(1)}%`, cls: v >= 0 ? 'pos' : 'neg' }
}

function isRecentFireDate(dateStr: string): boolean {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  const daysDiff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
  // Current-episode fires may be dated slightly ahead of the nightly as-of date
  return daysDiff > -45 && daysDiff < 400
}

function analogContext(d: Record<string, unknown>): string {
  if (d.context != null && String(d.context).trim()) return String(d.context)
  const regime = asRecord(d.regime)
  if (regime?.geo_overlay) return String(regime.geo_overlay).replace(/_/g, ' ')
  return '—'
}

export function mapRunicAnalog(combo: string, nightly: ApiNightly): RunicAnalogResponse | null {
  const details = (nightly.analog_details as Array<Record<string, unknown>> | undefined) ?? []
  if (!details.length) return null

  const columns = ['1M', '3M', '6M', '9M', '12M']
  const rows = details.map((d, i) => {
    const isNow = i === 0
    const context = d.context != null ? String(d.context) : '—'
    return {
      date: String(d.date ?? '—'),
      context,
      wti: d.wti_at_fire != null ? String(d.wti_at_fire) : undefined,
      duration: isNow ? 'NOW' : d.duration != null ? String(d.duration) : '—',
      cftc: d.cftc_at_fire != null ? String(d.cftc_at_fire) : undefined,
      max_dd: d.max_dd != null ? String(d.max_dd) : '—',
      max_dd_cls: 'tbd' as const,
      bottom_timing: d.bottom_timing != null ? String(d.bottom_timing) : '—',
      returns: [
        fmtReturn(d.spx_1m_pct),
        fmtReturn(d.spx_3m_pct),
        fmtReturn(d.spx_6m_pct),
        fmtReturn(d.spx_9m_pct ?? d.spx_12m_pct),
        fmtReturn(d.spx_12m_pct),
      ].slice(0, columns.length),
      verdict: isNow ? 'LIVE' : 'HISTORICAL',
      verdict_class: isNow ? 'b-conf' : 'b-watch',
      row_class: (isNow ? 'now' : '') as '' | 'now' | 'med',
      date_color: isNow ? 'var(--gold)' : undefined,
    }
  })

  const comboRow = (nightly.combo_status_rows as Array<Record<string, unknown>> | undefined)?.find(
    (r) => String(r.combo).toUpperCase() === combo.toUpperCase(),
  )
  const hitLabel = comboRow?.hit_rate_3m != null ? String(comboRow.hit_rate_3m) : null
  const subtitle = hitLabel ?? String(nightly.dominant_reason ?? '—')

  return {
    combo,
    title: `Combo ${combo} · ${comboRow?.name ?? 'Analog'}`,
    subtitle,
    title_color: comboRow?.direction?.toString().toUpperCase().includes('BEARISH')
      ? 'var(--red)'
      : 'var(--green)',
    columns,
    rows,
  }
}

function heatmapTierClass(tier: string): RunicVariableRow['tier_class'] {
  const t = tier.toUpperCase()
  if (t === 'EXTREME') return 't-ext'
  if (t === 'RARE' || t.includes('RARE')) return 't-rare'
  if (t === 'PENDING') return 't-pend'
  if (t === 'WATCH' || t.includes('CANCEL')) return 't-watch'
  return 't-norm'
}

function heatmapHeatClass(tier: string): string {
  const t = tier.toUpperCase()
  if (t === 'EXTREME') return 'heat-ext'
  if (t === 'RARE' || t.includes('RARE')) return 'heat-rare'
  if (t === 'PENDING') return 'heat-pend'
  if (t === 'WATCH' || t.includes('CANCEL')) return 'heat-cancel'
  return 'heat-norm'
}

function formatHeatmapCurrent(v: ApiVariable): string {
  if (v.current == null) return '—'
  const n = Number(v.current)
  if (!Number.isFinite(n)) return String(v.current)
  const name = String(v.variable ?? '').toUpperCase()
  if (name === 'WTI') return `4wk Δ: ${n.toFixed(1)}%`
  if (name === 'CAPE') return `${n.toFixed(2)}×`
  if (Math.abs(n) < 10) return n.toFixed(3)
  return n.toFixed(2)
}

export function mapMacroVariablesHeatmap(raw: ApiNightly): RunicVariablesResponse {
  const vars = (raw.variables as ApiVariable[] | undefined) ?? []
  const pending = new Set(
    ((raw.pending_variables as string[] | undefined) ?? []).map((v) => v.toUpperCase()),
  )

  const heatmap = vars.map((v) => {
    const tier = String(v.tier ?? (pending.has(String(v.variable).toUpperCase()) ? 'PENDING' : 'NORMAL'))
    const label = String(v.variable ?? '')
    const pct = v.pctile_3yr != null ? ` · ${Math.round(Number(v.pctile_3yr))}th pctile` : ''
    return {
      label,
      class: heatmapHeatClass(tier),
      title: `${label} ${formatHeatmapCurrent(v)} · ${tier}${pct}`,
    }
  })

  const variables: RunicVariableRow[] = vars.map((v) => {
    const tier = String(v.tier ?? (pending.has(String(v.variable).toUpperCase()) ? 'PENDING' : 'NORMAL'))
    const name = String(v.variable ?? '')
    const combos = Array.isArray((v as Record<string, unknown>).combos)
      ? ((v as Record<string, unknown>).combos as string[]).join(', ')
      : '—'
    const lagNote =
      v.lag_days != null
        ? `Lag ${v.lag_days}d`
        : v.source_date
          ? `As of ${v.source_date}`
          : ''
    const dirNote =
      v.direction != null && v.direction !== '' ? `Direction: ${v.direction}` : ''
    const note = [dirNote, lagNote].filter(Boolean).join(' · ') || '—'
    return {
      num: String(v.num ?? '').padStart(2, '0'),
      name,
      sub: tier,
      source: String((v as Record<string, unknown>).source ?? v.source_date ?? '—'),
      compute: String((v as Record<string, unknown>).compute ?? (
        v.pctile_3yr != null
          ? `3yr pctile: ${Number(v.pctile_3yr).toFixed(1)}`
          : '—'
      )),
      current: formatHeatmapCurrent(v),
      current_color:
        tier === 'EXTREME' ? 'var(--red)' : tier.includes('RARE') ? 'var(--amber)' : 'var(--t2)',
      rare_gate: String((v as Record<string, unknown>).rare_gate ?? '—'),
      extreme_gate: String((v as Record<string, unknown>).extreme_gate ?? '—'),
      tier,
      tier_class: heatmapTierClass(tier),
      combos,
      note,
      row_highlight: tier === 'EXTREME' || tier === 'WATCH' || tier.includes('CANCEL'),
    }
  })

  return {
    date: String(raw.date ?? ''),
    heatmap,
    variables,
  }
}

function formatHitRateLabel(rate?: number | null, label = '3M'): string | undefined {
  if (rate == null || !Number.isFinite(rate)) return undefined
  return `${(rate * 100).toFixed(0)}% ${label}`
}

function formatReturnLabel(rate?: number | null): string | undefined {
  if (rate == null || !Number.isFinite(rate)) return undefined
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export function macroComboToStatusRow(c: MacroNamedCombo): RunicComboStatusRow {
  const row = c.combo_status_row
  const duration =
    c.duration_weeks != null
      ? `wk ${c.duration_weeks}${c.duration_bucket ? ` ${c.duration_bucket}` : ''}`
      : row?.duration
  return {
    combo: c.combo,
    name: c.name,
    status: c.status,
    direction: c.direction,
    duration,
    hit_rate_3m: row?.hit_rate_3m ?? formatHitRateLabel(c.hit_rate_primary),
    avg_return_3m: row?.avg_return_3m ?? formatReturnLabel(c.avg_return_primary),
  }
}

export function mapMacroCombos(raw: ApiNightly): MacroCombosResponse {
  const combosRaw = (raw.combos as Array<Record<string, unknown>> | undefined) ?? []
  const combos: MacroNamedCombo[] = combosRaw.map((c) => {
    const legs = c.confirmed_legs
    const statusRow = asRecord(c.combo_status_row)
    return {
      combo: String(c.combo ?? ''),
      name: String(c.name ?? ''),
      direction: String(c.direction ?? ''),
      horizon: String(c.horizon ?? ''),
      legs_required: Number(c.legs_required ?? 0),
      total_legs: Number(c.total_legs ?? 0),
      variables: Array.isArray(c.variables) ? c.variables.map(String) : [],
      description: String(c.description ?? ''),
      status: String(c.status ?? ''),
      is_active: Boolean(c.is_active),
      is_watch: Boolean(c.is_watch),
      duration_weeks: c.duration_weeks != null ? Number(c.duration_weeks) : null,
      duration_bucket: c.duration_bucket != null ? String(c.duration_bucket) : null,
      confirmed_legs: Array.isArray(legs) ? legs.map(String) : null,
      episode_start: c.episode_start != null ? String(c.episode_start) : null,
      hit_rate_primary: c.hit_rate_primary != null ? Number(c.hit_rate_primary) : null,
      avg_return_primary: c.avg_return_primary != null ? Number(c.avg_return_primary) : null,
      combo_status_row: statusRow
        ? {
            combo: String(statusRow.combo ?? c.combo ?? ''),
            name: String(statusRow.name ?? c.name ?? ''),
            status: String(statusRow.status ?? c.status ?? ''),
            direction: statusRow.direction != null ? String(statusRow.direction) : undefined,
            duration: statusRow.duration != null ? String(statusRow.duration) : undefined,
            hit_rate_3m: statusRow.hit_rate_3m != null ? String(statusRow.hit_rate_3m) : undefined,
            avg_return_3m: statusRow.avg_return_3m != null ? String(statusRow.avg_return_3m) : undefined,
          }
        : null,
    }
  })

  return {
    date: String(raw.date ?? ''),
    active_count: Number(raw.active_count ?? 0),
    watch_count: Number(raw.watch_count ?? 0),
    combos,
  }
}

export function mapMacroOverviewKpis(raw: ApiNightly): MacroOverviewKpisResponse {
  const dom = asRecord(raw.dominant_signal) ?? {}
  const cDur = asRecord(raw.combo_c_duration) ?? {}
  const fWin = asRecord(raw.combo_f_window) ?? {}
  const cape = asRecord(raw.cape) ?? {}
  const wti = asRecord(raw.wti_4wk) ?? {}
  return {
    date: String(raw.date ?? ''),
    dominant_signal: {
      combo: String(dom.combo ?? '—'),
      brave_fearful_display: dom.brave_fearful_display != null ? String(dom.brave_fearful_display) : undefined,
      hit_rate: dom.hit_rate != null ? Number(dom.hit_rate) : null,
      avg_return: dom.avg_return != null ? Number(dom.avg_return) : null,
    },
    combo_c_duration: {
      combo: String(cDur.combo ?? 'C'),
      duration_weeks: cDur.duration_weeks != null ? Number(cDur.duration_weeks) : null,
      duration_bucket: cDur.duration_bucket != null ? String(cDur.duration_bucket) : null,
      active: Boolean(cDur.active),
    },
    combo_f_window: {
      combo: String(fWin.combo ?? 'F'),
      weeks_elapsed: fWin.weeks_elapsed != null ? Number(fWin.weeks_elapsed) : null,
      active: Boolean(fWin.active),
      mtm_pct: fWin.mtm_pct != null ? Number(fWin.mtm_pct) : null,
    },
    cape: {
      variable: String(cape.variable ?? 'CAPE'),
      current: cape.current != null ? Number(cape.current) : null,
      tier: cape.tier != null ? String(cape.tier) : undefined,
      combo_e_status: cape.combo_e_status != null ? String(cape.combo_e_status) : undefined,
    },
    wti_4wk: {
      variable: String(wti.variable ?? 'WTI'),
      current: wti.current != null ? Number(wti.current) : null,
      tier: wti.tier != null ? String(wti.tier) : undefined,
      cancel_week: wti.cancel_week != null ? Number(wti.cancel_week) : null,
    },
  }
}

export function mapMacroRegime(raw: ApiNightly): MacroRegimeResponse {
  const grid = raw.regime_grid
  return {
    date: String(raw.date ?? ''),
    regime: mapRegime(raw.regime),
    brave_fearful: String(raw.brave_fearful ?? ''),
    brave_fearful_display: String(raw.brave_fearful_display ?? ''),
    dominant_signal: String(raw.dominant_signal ?? '—'),
    dominant_reason: String(raw.dominant_reason ?? ''),
    narrative: String(raw.narrative ?? ''),
    system_recommendation: String(raw.system_recommendation ?? ''),
    vix_bypass: Boolean(raw.vix_bypass),
    ssi_layer2_status: raw.ssi_layer2_status != null ? String(raw.ssi_layer2_status) : undefined,
    ssi_multiplier: raw.ssi_multiplier != null ? Number(raw.ssi_multiplier) : undefined,
    regime_grid: Array.isArray(grid)
      ? grid
          .map((row) => {
            if (Array.isArray(row) && row.length >= 2) {
              return [String(row[0]), String(row[1])] as [string, string]
            }
            const rec = asRecord(row)
            if (rec?.dimension != null) {
              return [String(rec.dimension), String(rec.value ?? '')] as [string, string]
            }
            return null
          })
          .filter((row): row is [string, string] => row != null)
      : undefined,
  }
}

export function mapMacroNarrative(raw: ApiNightly): MacroNarrativeResponse {
  return {
    date: String(raw.date ?? ''),
    narrative: String(raw.narrative ?? ''),
    system_recommendation: String(raw.system_recommendation ?? ''),
    brave_fearful_display: String(raw.brave_fearful_display ?? ''),
    dominant_signal: String(raw.dominant_signal ?? '—'),
    dominant_reason: String(raw.dominant_reason ?? ''),
    regime: mapRegime(raw.regime),
    cftc_status: String(raw.cftc_status ?? ''),
  }
}

export function mapMacroStatus(raw: ApiNightly): MacroStatusResponse {
  return {
    date: String(raw.date ?? ''),
    dominant_signal: String(raw.dominant_signal ?? '—'),
    brave_fearful: String(raw.brave_fearful ?? ''),
    brave_fearful_display: String(raw.brave_fearful_display ?? ''),
    active_combos: Array.isArray(raw.active_combos) ? raw.active_combos.map(String) : [],
    watch_combos: Array.isArray(raw.watch_combos) ? raw.watch_combos.map(String) : [],
    cftc_status: String(raw.cftc_status ?? ''),
    vix_bypass: Boolean(raw.vix_bypass),
    combo_c_cancel_week: Number(raw.combo_c_cancel_week ?? 0),
    combo_c_cancelled: Boolean(raw.combo_c_cancelled),
    pending_cpi_release: Boolean(raw.pending_cpi_release),
  }
}

export function mapMacroPersistence(raw: ApiNightly): MacroPersistenceResponse {
  const signalsRaw = (raw.persistence_signals as unknown[] | undefined) ?? []
  const persistence_signals = signalsRaw.map((s) => {
    const row = asRecord(s) ?? {}
    return {
      signal_type: String(row.signal_type ?? row.type ?? ''),
      weeks: row.weeks != null ? Number(row.weeks) : undefined,
      description: String(row.description ?? row.signal ?? ''),
    }
  })

  const watchRaw = (raw.generic_combo_watch as unknown[] | undefined) ?? []
  const generic_combo_watch = watchRaw.map((w) => {
    const row = asRecord(w) ?? {}
    return {
      vars: Array.isArray(row.vars) ? row.vars.map(String) : [],
      status: String(row.status ?? ''),
      gate: String(row.gate ?? ''),
    }
  })

  const freshness = asRecord(raw.source_freshness)
  return {
    date: String(raw.date ?? ''),
    persistence_signals,
    generic_combo_watch,
    source_freshness: freshness?.last_audit != null
      ? { last_audit: String(freshness.last_audit) }
      : undefined,
  }
}

function mapFridayLogRow(
  row: Record<string, unknown>,
  index: number,
): RunicCancelTrackerResponse['friday_rows'][number] {
  const wtiVal = row.wti_value ?? row.wti_pct ?? row.wti
  const wti = wtiVal != null ? `${Number(wtiVal).toFixed(1)}%` : '—'
  const wtiLeg = String(row.wti_leg_passes ?? row.wti_leg ?? '—').toUpperCase()
  const cpiLeg = String(row.cpi_leg_passes ?? row.cpi_leg ?? row.data_leg ?? '—').toUpperCase()
  const cpiPrint = asRecord(row.cpi_print)
  const data = cpiPrint
    ? `CPI ${cpiPrint.actual ?? '—'} vs ${cpiPrint.consensus ?? '—'}`
    : String(row.cpi_note ?? row.data ?? '—')
  return {
    num: String(row.friday_num ?? index + 1),
    date: String(row.check_date ?? row.date ?? '—'),
    wti,
    wti_leg: wtiLeg === 'TRUE' ? 'PASS' : wtiLeg === 'FALSE' ? 'FAIL' : wtiLeg,
    data,
    data_leg: cpiLeg === 'TRUE' ? 'PASS' : cpiLeg === 'FALSE' ? 'FAIL' : cpiLeg,
    status: String(row.status ?? (row.both_pass ? 'PASS' : '—')),
    badge_class: row.both_pass ? 'b-ok' : 'b-watch',
    highlight: Boolean(row.highlight),
  }
}

export function mapMacroCancelTracker(
  cancelRaw: ApiNightly | null,
  fWindowRaw: ApiNightly | null,
): RunicCancelTrackerResponse {
  const cancel = cancelRaw ?? {}
  const fWindow = fWindowRaw ?? {}
  const cancelStatus = asRecord(cancel.cancel_status) ?? {}
  const currentWti = asRecord(cancel.current_wti) ?? {}
  const currentCpi = asRecord(cancel.current_cpi) ?? {}
  const prob = asRecord(cancel.probability_model)
  const ifCancelled = asRecord(cancel.if_cancelled)

  const fridayCount = Math.min(
    4,
    Math.max(0, Number(cancelStatus.fridays_complete ?? cancel.combo_c_cancel_week ?? 0)),
  )
  const cancelled = Boolean(cancelStatus.cancelled ?? cancel.combo_c_cancelled)
  const wtiPct = currentWti.value != null ? Number(currentWti.value) : 0

  const fridayLog = (cancel.friday_log as Array<Record<string, unknown>> | undefined) ?? []
  const friday_rows = fridayLog.length
    ? fridayLog.map((row, i) => mapFridayLogRow(row, i))
    : [
        {
          num: String(fridayCount || 1),
          date: String(cancelStatus.last_check_date ?? cancel.date ?? '—'),
          wti: `${wtiPct.toFixed(1)}%`,
          wti_leg: currentWti.leg_passes ? 'PASS' : wtiPct < 5 ? 'CLEAR' : 'FAIL',
          data: currentCpi.latest_print
            ? `CPI ${(asRecord(currentCpi.latest_print)?.actual ?? '—')} vs ${(asRecord(currentCpi.latest_print)?.consensus ?? '—')}`
            : cancelled
              ? `Cancelled ${cancelStatus.cancel_date ?? '—'}`
              : '—',
          data_leg: currentCpi.leg_passes ? 'PASS' : '—',
          status: cancelled ? 'CANCELLED' : 'ACTIVE',
          badge_class: cancelled ? 'b-off' : 'b-watch',
          highlight: !cancelled,
        },
      ]

  const cancel_fridays = Array.from({ length: 4 }, (_, i) => ({
    label: `Fri ${i + 1}`,
    filled: i < fridayCount,
    critical: i === fridayCount && fridayCount < 4 && !cancelled,
  }))

  const weeksElapsed = Number(fWindow.weeks_elapsed ?? 0)
  const weeksTotal = Number(fWindow.total_weeks ?? 26)

  return {
    combo_c_cancel_fri: fridayCount,
    wti_4wk_pct: Math.round(wtiPct * 10) / 10,
    friday_rows,
    cancel_fridays,
    f_window: {
      fire_date: String(fWindow.fire_date ?? '—'),
      expires: String(fWindow.expiry_date ?? '—'),
      weeks_elapsed: weeksElapsed,
      weeks_total: weeksTotal,
      mtm_pct: fWindow.mtm_pct != null ? Math.round(Number(fWindow.mtm_pct) * 10) / 10 : 0,
    },
    combo_c_cancelled: cancelled,
    combo_c_cancel_date:
      cancelStatus.cancel_date != null ? String(cancelStatus.cancel_date) : undefined,
    combo_f_active: Boolean(fWindow.active),
    combo_c_active: Boolean(cancel.combo_c_active),
    dominant_signal: String(ifCancelled?.f_becomes_dominant ? 'F' : ''),
    dominant_reason: ifCancelled?.note != null ? String(ifCancelled.note) : undefined,
    combo_c_status: cancelled ? 'CANCELLED' : cancel.combo_c_active ? 'ACTIVE' : 'INACTIVE',
    combo_c_duration: undefined,
    combo_f_status: fWindow.active ? 'ACTIVE' : undefined,
    combo_f_duration:
      weeksElapsed > 0
        ? `wk ${weeksElapsed}${fWindow.weeks_remaining != null ? ` · ${fWindow.weeks_remaining} remaining` : ''}`
        : undefined,
    probability_model: prob
      ? {
          model_cancel_prob: Number(prob.model_cancel_prob ?? 0),
          model_wti_leg_prob: Number(prob.model_wti_leg_prob ?? 0),
          model_cpi_leg_prob: Number(prob.model_cpi_leg_prob ?? 0),
        }
      : undefined,
    upcoming_releases: Array.isArray(cancel.upcoming_releases)
      ? (cancel.upcoming_releases as Array<Record<string, unknown>>).map((r) => ({
          release_date: String(r.release_date ?? ''),
          release_type: String(r.release_type ?? ''),
          consensus: r.consensus != null ? Number(r.consensus) : undefined,
        }))
      : undefined,
    if_cancelled: ifCancelled
      ? {
          f_becomes_dominant: Boolean(ifCancelled.f_becomes_dominant),
          e_warning_persists: Boolean(ifCancelled.e_warning_persists),
          note: String(ifCancelled.note ?? ''),
        }
      : undefined,
    cancel_condition: fWindow.cancel_condition != null ? String(fWindow.cancel_condition) : undefined,
    d_f_tension: fWindow.d_f_tension != null ? String(fWindow.d_f_tension) : undefined,
    progress_pct: fWindow.progress_pct != null ? Number(fWindow.progress_pct) : undefined,
    weeks_remaining: fWindow.weeks_remaining != null ? Number(fWindow.weeks_remaining) : undefined,
    hit_rate_primary: fWindow.hit_rate_primary != null ? Number(fWindow.hit_rate_primary) : undefined,
    avg_return_6m: fWindow.avg_return_6m != null ? Number(fWindow.avg_return_6m) : undefined,
    ppi_cooling: cancel.ppi_cooling != null ? Boolean(cancel.ppi_cooling) : undefined,
    cancel_gate_pct:
      currentWti.cancel_gate_pct != null ? Number(currentWti.cancel_gate_pct) : undefined,
    current_cpi_print: currentCpi.latest_print
      ? (() => {
          const p = asRecord(currentCpi.latest_print) ?? {}
          return {
            release_date: String(p.release_date ?? ''),
            actual: Number(p.actual ?? 0),
            consensus: Number(p.consensus ?? 0),
            surprise_pp: p.surprise_pp != null ? Number(p.surprise_pp) : undefined,
            not_hot: p.not_hot != null ? Boolean(p.not_hot) : undefined,
          }
        })()
      : undefined,
  }
}

function mapSsiInputs(raw: Record<string, unknown>): Record<string, MacroSsiInput> {
  const inputs = asRecord(raw.inputs) ?? {}
  const result: Record<string, MacroSsiInput> = {}
  for (const [key, val] of Object.entries(inputs)) {
    const row = asRecord(val) ?? {}
    result[key] = {
      raw: Number(row.raw ?? 0),
      vote: row.vote != null ? Boolean(row.vote) : null,
      signal: row.signal != null ? String(row.signal) : null,
      pctile: row.pctile != null ? Number(row.pctile) : null,
    }
  }
  return result
}

export function mapMacroDataFreshness(raw: ApiNightly): MacroDataFreshnessResponse {
  const freshness = asRecord(raw.source_freshness) ?? {}
  const vars = (raw.variables_dashboard as Array<Record<string, unknown>> | undefined) ?? []
  return {
    date: String(raw.date ?? ''),
    cftc_status: String(raw.cftc_status ?? ''),
    pending_cpi_release: Boolean(raw.pending_cpi_release),
    any_stale_after_refresh: freshness.any_stale_after_refresh != null
      ? Boolean(freshness.any_stale_after_refresh)
      : undefined,
    variables_dashboard: vars.map((v) => ({
      variable: String(v.variable ?? ''),
      source_date: v.source_date != null ? String(v.source_date) : null,
      lag_days: v.lag_days != null ? Number(v.lag_days) : null,
      expected_source_date:
        v.expected_source_date != null ? String(v.expected_source_date) : null,
      source_note: v.source_note != null ? String(v.source_note) : null,
      tier: v.tier != null ? String(v.tier) : undefined,
      stale: v.stale != null ? Boolean(v.stale) : undefined,
    })),
  }
}

export function mapMacroSsiSummary(raw: ApiNightly): MacroSsiSummaryResponse {
  return {
    date: String(raw.date ?? ''),
    ssi_level: Number(raw.ssi_level ?? 0),
    ssi_percentile_5y: raw.ssi_percentile_5y != null ? Number(raw.ssi_percentile_5y) : null,
    ssi_multiplier: Number(raw.ssi_multiplier ?? 1),
    layer2_status: String(raw.layer2_status ?? ''),
    layer2_confirmed_count: Number(raw.layer2_confirmed_count ?? 0),
    layer2_required: Number(raw.layer2_required ?? 3),
    posture: String(raw.posture ?? ''),
    long_signal_active: Boolean(raw.long_signal_active),
    short_signal_active: Boolean(raw.short_signal_active),
    inputs: mapSsiInputs(raw),
  }
}

export function mapMacroSsiMultiplier(raw: ApiNightly): MacroSsiMultiplierResponse {
  return {
    date: String(raw.date ?? ''),
    ssi_multiplier: Number(raw.ssi_multiplier ?? 1),
    ssi_level: Number(raw.ssi_level ?? 0),
    layer2_status: String(raw.layer2_status ?? ''),
    layer2_confirmed_count: Number(raw.layer2_confirmed_count ?? 0),
    long_size_mult: Number(raw.long_size_mult ?? 1),
    short_size_mult: Number(raw.short_size_mult ?? 1),
    long_active: Boolean(raw.long_active),
    short_active: Boolean(raw.short_active),
    long_entry_threshold: Number(raw.long_entry_threshold ?? -0.6),
    short_entry_threshold: Number(raw.short_entry_threshold ?? 0.85),
  }
}

export function mapMacroAnalogTable(combo: string, raw: ApiNightly): RunicAnalogResponse | null {
  const details = (raw.analog_details as Array<Record<string, unknown>> | undefined) ?? []
  if (!details.length) return null

  const columns = ['1M', '3M', '6M', '9M', '12M']
  const sorted = [...details].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))

  const rows = sorted.map((d, index) => {
    const status = String(d.status ?? '').toUpperCase()
    const date = String(d.date ?? '—')
    const isNow = status === 'ACTIVE' || status === 'LIVE' || (index === 0 && isRecentFireDate(date))
    const horizon = d.primary_horizon != null ? String(d.primary_horizon).replace('spx_', '').toUpperCase() : ''
    return {
      date,
      context: analogContext(d),
      duration: isNow ? 'NOW' : status || horizon || '—',
      max_dd: d.max_dd != null ? String(d.max_dd) : '—',
      max_dd_cls: 'tbd' as const,
      bottom_timing: d.bottom_timing != null ? String(d.bottom_timing) : '—',
      returns: [
        fmtReturn(d.spx_1m_pct),
        fmtReturn(d.spx_3m_pct),
        fmtReturn(d.spx_6m_pct),
        fmtReturn(d.spx_9m_pct),
        fmtReturn(d.spx_12m_pct),
      ],
      verdict: isNow ? 'LIVE' : status || 'HISTORICAL',
      verdict_class: isNow ? 'b-conf' : 'b-watch',
      row_class: (isNow ? 'now' : '') as '' | 'now' | 'med',
      date_color: isNow ? 'var(--gold)' : undefined,
    }
  })

  const stats = asRecord(raw.hit_rate_stats)
  const summary = asRecord(raw.summary_returns)
  const hasResolvedReturns = sorted.some((d) => {
    for (const key of ['spx_1m_pct', 'spx_3m_pct', 'spx_6m_pct', 'spx_9m_pct', 'spx_12m_pct']) {
      const v = d[key]
      if (v != null && Number(v) !== 0) return true
    }
    return false
  })

  if (summary && (summary.median_3m != null || summary.median_6m != null)) {
    const medians = [
      summary.median_1m,
      summary.median_3m,
      summary.median_6m,
      summary.median_9m,
      summary.median_12m,
    ]
    const allMedianZero = medians.every((v) => v == null || Number(v) === 0)
    if (!allMedianZero || stats?.hit_rate_primary != null) {
      rows.push({
        date: 'Median',
        context: `${raw.instance_count ?? sorted.length} instance${Number(raw.instance_count ?? sorted.length) === 1 ? '' : 's'}`,
        duration: stats?.primary_label != null ? String(stats.primary_label) : '—',
        max_dd: '—',
        max_dd_cls: 'tbd' as const,
        bottom_timing: '—',
        returns: medians.map((v) => fmtReturn(v)),
        verdict:
          stats?.hit_rate_primary != null && stats?.primary_label
            ? `${(Number(stats.hit_rate_primary) * 100).toFixed(0)}% ${stats.primary_label}`
            : 'SUMMARY',
        verdict_class: 'b-act',
        row_class: 'med',
      })
    }
  }

  const subtitleParts: string[] = []
  if (stats?.hit_rate_primary != null && Number(stats.n_obs_primary ?? 0) > 0) {
    const label = stats.primary_label != null ? String(stats.primary_label) : 'primary'
    subtitleParts.push(`${(Number(stats.hit_rate_primary) * 100).toFixed(0)}% ${label} hit`)
  }
  if (stats?.avg_return_primary != null && Number(stats.n_obs_primary ?? 0) > 0) {
    subtitleParts.push(`${formatReturnLabel(Number(stats.avg_return_primary))} avg ${stats.primary_label ?? ''}`.trim())
  }
  if (!subtitleParts.length && stats?.n_obs_primary != null) {
    subtitleParts.push(`${stats.n_obs_primary} obs`)
  }
  const direction = String(raw.direction ?? '')
  const subtitle = subtitleParts.join(' · ') || 'Historical analog fire dates'

  const footnotes: string[] = []
  if (raw.instance_count != null) {
    footnotes.push(
      `${raw.instance_count} fire date${Number(raw.instance_count) === 1 ? '' : 's'} in runic.db`,
    )
  }
  if (!hasResolvedReturns) {
    footnotes.push('SPX forward returns are TBD — current episode fires are still inside their forward windows')
  }

  return {
    combo,
    title: `Combo ${combo} · ${String(raw.name ?? 'Analog')}`,
    subtitle,
    title_color: direction.toUpperCase().includes('BEARISH') ? 'var(--red)' : 'var(--green)',
    columns,
    rows,
    footnote: footnotes.length ? footnotes.join(' · ') : undefined,
  }
}
