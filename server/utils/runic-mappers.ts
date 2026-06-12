import type {
  RunicAnalogResponse,
  RunicAnalogReturn,
  RunicCancelTrackerResponse,
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
  direction?: string | null
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
  }
}

function comboEStatus(raw: ApiNightly): RunicNightlyResponse['combo_e_status'] {
  const e = (raw.active_combos as Array<Record<string, unknown>> | undefined)?.find(
    (c) => String(c.combo) === 'E',
  )
  if (!e) return 'CONFIRMED_2_OF_3'
  const legs = e.confirmed_legs as string[] | undefined
  if (Array.isArray(legs) && legs.length >= 3) return 'CONFIRMED_3_OF_3'
  if (e.status === 'CONFIRMED') return 'CONFIRMED_2_OF_3'
  return 'CONFIRMED_2_OF_3'
}

export function mapRunicNightly(raw: ApiNightly): RunicNightlyResponse {
  const activeRaw = (raw.active_combos as Array<Record<string, unknown>> | undefined) ?? []
  const active_combos = activeRaw.map((c) => ({
    combo: String(c.combo ?? ''),
    wk: c.duration_weeks != null ? Number(c.duration_weeks) : undefined,
    bucket: c.duration_bucket != null ? String(c.duration_bucket) : undefined,
    status: c.status != null ? String(c.status) : undefined,
    mtm_pct: c.avg_return_3m != null ? Math.round(Number(c.avg_return_3m) * 10) / 10 : undefined,
  }))

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
    return {
      num: String(v.num ?? '').padStart(2, '0'),
      name,
      sub: tier,
      source: 'MindWealth API · macro/runic',
      compute: v.pctile_3yr != null ? `3yr pctile: ${Number(v.pctile_3yr).toFixed(1)}` : '—',
      current: formatCurrent(v),
      current_color:
        tier === 'EXTREME' ? 'var(--red)' : tier.includes('RARE') ? 'var(--amber)' : 'var(--t2)',
      rare_gate: '—',
      extreme_gate: '—',
      tier,
      tier_class: TIER_CLASS[tier] ?? 't-norm',
      combos: '—',
      note:
        v.direction != null && v.direction !== ''
          ? `Direction: ${v.direction}`
          : `Live from conviction_store · ${String(raw.date ?? '')}`,
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
  const fActive = Boolean(nightly.combo_f_active)
  const cancelWeek = Number(cancel.wti_potential_week ?? 0)

  const fridayCount = Math.min(4, Math.max(0, cancelWeek))
  const cancel_fridays = Array.from({ length: 4 }, (_, i) => ({
    label: `Fri ${i + 1}`,
    filled: i < fridayCount,
    critical: i === fridayCount && fridayCount < 4,
  }))

  return {
    combo_c_cancel_fri: fridayCount,
    wti_4wk_pct: Math.round(wtiPct * 10) / 10,
    friday_rows: [
      {
        num: String(fridayCount || 1),
        date: String(cancel.last_check_date ?? nightly.date ?? '—'),
        wti: `${wtiPct.toFixed(1)}%`,
        wti_leg: wtiPct < 5 ? 'CLEAR' : 'FAIL',
        data: cancel.cancelled ? 'Combo C cancelled' : 'Monitoring',
        data_leg: cancel.cancelled ? 'CLEAR' : '—',
        status: cancel.cancelled ? 'CANCELLED' : cancel.active === false ? 'WATCH' : 'ACTIVE',
        badge_class: cancel.cancelled ? 'b-off' : 'b-watch',
        highlight: !cancel.cancelled,
      },
    ],
    cancel_fridays,
    f_window: {
      fire_date: String(
        (nightly.active_combos as Array<Record<string, unknown>> | undefined)?.find(
          (c) => String(c.combo) === 'F',
        )?.episode_start ?? '—',
      ),
      expires: '—',
      weeks_elapsed: fWeeks,
      weeks_total: 26,
      mtm_pct:
        (nightly.active_combos as Array<Record<string, unknown>> | undefined)?.find(
          (c) => String(c.combo) === 'F',
        )?.avg_return_3m != null
          ? Math.round(
              Number(
                (
                  (nightly.active_combos as Array<Record<string, unknown>>).find(
                    (c) => String(c.combo) === 'F',
                  ) ?? {}
                ).avg_return_3m,
              ) * 10,
            ) / 10
          : 0,
    },
  }
}

function fmtReturn(n: unknown): RunicAnalogReturn {
  const v = Number(n)
  if (!Number.isFinite(v) || v === 0) return { val: '?', cls: 'tbd' }
  const sign = v >= 0 ? '+' : ''
  return { val: `${sign}${v.toFixed(1)}%`, cls: v >= 0 ? 'pos' : 'neg' }
}

export function mapRunicAnalog(combo: string, nightly: ApiNightly): RunicAnalogResponse | null {
  const details = (nightly.analog_details as Array<Record<string, unknown>> | undefined) ?? []
  if (!details.length) return null

  const columns = ['1M', '3M', '6M', '9M', '12M']
  const rows = details.map((d, i) => {
    const isNow = i === 0
    return {
      date: String(d.date ?? '—'),
      context: isNow ? `Live ${combo} episode · API forward window` : 'Historical analog window',
      wti: combo === 'C' ? '—' : undefined,
      duration: isNow ? 'NOW' : '—',
      cftc: combo === 'F' ? '—' : undefined,
      max_dd: '?',
      max_dd_cls: 'tbd' as const,
      bottom_timing: '—',
      returns: [
        fmtReturn(d.spx_1m_pct),
        fmtReturn(d.spx_3m_pct),
        fmtReturn(d.spx_6m_pct),
        fmtReturn(d.spx_12m_pct),
        { val: '—', cls: 'tbd' as const },
      ].slice(0, columns.length),
      verdict: isNow ? 'LIVE' : 'HISTORICAL',
      verdict_class: isNow ? 'b-conf' : 'b-watch',
      row_class: (isNow ? 'now' : '') as '' | 'now' | 'med',
      date_color: isNow ? 'var(--gold)' : undefined,
    }
  })

  const hitRate = nightly.spx_3m_hit_rate != null ? Number(nightly.spx_3m_hit_rate) : null
  const subtitle =
    hitRate != null
      ? `${Math.round(hitRate * 100)}% hit rate · API macro/runic/nightly`
      : 'Forward SPX returns from nightly analog_details'

  return {
    combo,
    title: `Combo ${combo} · SPX Forward Returns (API)`,
    subtitle,
    title_color: combo === 'C' ? 'var(--red)' : 'var(--green)',
    columns,
    rows,
    footnote: 'Sparse analog table from MindWealth API v1.2 — full historical context may use mock fallback.',
  }
}
