<template>
  <div>
    <div v-if="!hasOverview" class="runic-unavailable">
      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Runic Macro Overview</div></div>
        <div class="runic-body" style="padding:14px;color:var(--t2)">{{ UNAVAILABLE_FETCH }}</div>
      </div>
    </div>

    <template v-else>
      <MacroRegimePills style="margin-bottom:12px" />

      <div v-if="braveFearfulDisplay" class="runic-card" style="margin-bottom:12px">
        <div class="runic-body" style="padding:10px 14px;color:var(--gold)">{{ braveFearfulDisplay }}</div>
      </div>

      <MacroSsiPanel />

      <div class="kr k5">
        <KpiCard
          v-for="kpi in kpis"
          :key="kpi.label"
          :label="kpi.label"
          :value="kpi.value"
          :delta="kpi.delta"
          :accent="kpi.accent"
          :delta-class="kpi.deltaClass"
          :class="kpi.valueClass"
        />
      </div>

      <div class="runic-three-col">
        <div class="runic-card">
          <div class="runic-card-hd"><div class="runic-card-title">Active Combos</div></div>
          <div style="padding:10px 14px">
            <div v-if="!activeCombos.length" class="runic-body" style="color:var(--t2)">—</div>
            <div v-for="combo in activeCombos" :key="combo.combo" class="runic-combo-block">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:11px;font-weight:600;color:var(--gold)">
                  Combo {{ combo.combo }} · {{ combo.name }}
                </span>
                <span v-if="combo.duration_weeks != null" class="runic-badge b-act">
                  WK {{ combo.duration_weeks }}
                </span>
              </div>
              <div class="runic-body">{{ activeComboLine(combo) }}</div>
              <div v-if="combo.confirmed_legs?.length" class="c-legs" style="margin-top:4px">
                <span v-for="leg in combo.confirmed_legs" :key="leg" class="leg leg-ok">{{ leg }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="runic-card">
          <div class="runic-card-hd"><div class="runic-card-title">Watch Combos</div></div>
          <div style="padding:10px 14px">
            <div v-if="!watchCombos.length" class="runic-body" style="color:var(--t2)">—</div>
            <div v-for="combo in watchCombos" :key="combo.combo" class="runic-combo-block">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:11px;font-weight:600;color:var(--amber)">
                  Combo {{ combo.combo }} · {{ combo.name }}
                </span>
                <span class="runic-badge b-watch">
                  WATCH · {{ combo.confirmed_legs?.length ?? 0 }}/{{ combo.total_legs }} LEGS
                </span>
              </div>
              <div class="runic-body">{{ watchComboLine(combo) }}</div>
            </div>
          </div>
        </div>

        <div class="runic-card">
          <div class="runic-card-hd"><div class="runic-card-title">Recently Resolved</div></div>
          <div style="padding:10px 14px">
            <div v-if="!resolvedCombos.length" class="runic-body" style="color:var(--t2)">—</div>
            <div v-for="combo in resolvedCombos" :key="combo.combo" class="runic-combo-block">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:11px;font-weight:600;color:var(--t3)">
                  Combo {{ combo.combo }} · {{ combo.name }}
                </span>
                <span class="runic-badge b-off">{{ combo.status }}</span>
              </div>
              <div class="runic-body">{{ combo.duration_bucket ?? combo.status }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="regimeGrid.length" class="runic-card" style="margin-top:12px">
        <div class="runic-card-hd"><div class="runic-card-title">Regime Grid</div></div>
        <div class="brief-pills" style="padding:10px 14px">
          <span v-for="[dim, val] in regimeGrid" :key="dim" class="rpill">{{ dim }}: {{ val }}</span>
        </div>
      </div>

      <div v-if="regimeNarrative" class="runic-card" style="margin-top:12px">
        <div class="runic-card-hd"><div class="runic-card-title">Narrative</div></div>
        <div class="runic-body" style="padding:10px 14px">{{ regimeNarrative }}</div>
      </div>

      <div v-if="systemRecommendation" class="runic-card" style="margin-top:12px">
        <div class="runic-card-hd"><div class="runic-card-title">System Recommendation</div></div>
        <div class="runic-body" style="padding:10px 14px;color:var(--gold)">{{ systemRecommendation }}</div>
      </div>

      <div v-if="showCftcAlert || pendingCpi" class="cftc-alert">
        <div class="nd amber" style="width:6px;height:6px;margin-top:2px;animation:pu 2s infinite;flex-shrink:0" />
        <div class="runic-body" style="color:var(--amber)">
          <template v-if="showCftcAlert">CFTC status: {{ cftcStatus }}.<span v-if="cftcEst"> Est. {{ cftcEst }} pctile net long.</span></template>
          <template v-if="showCftcAlert && pendingCpi"> · </template>
          <template v-if="pendingCpi">CPI release pending this week.</template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MacroNamedCombo, MacroOverviewKpisResponse } from '~/types/api'
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'
import { formatHitRate, formatReturnPct } from '~/utils/runic-combo-display'
import { isApiUnavailable } from '~/utils/api-display'

const { overviewKpis, regime, combos, narrative, nightly, macroStatus, cancelTracker } = useRunicMacro()

const braveFearfulDisplay = computed(
  () => regime.value?.brave_fearful_display || macroStatus.value?.brave_fearful_display || '',
)
const regimeGrid = computed(() => regime.value?.regime_grid ?? [])

const hasOverview = computed(
  () =>
    (overviewKpis.value != null && !isApiUnavailable(overviewKpis.value))
    || (combos.value != null && combos.value.combos.length > 0 && !isApiUnavailable(combos.value))
    || (nightly.value != null && !isApiUnavailable(nightly.value)),
)

const activeCombos = computed(() =>
  combos.value?.combos.filter((c) => c.is_active || c.status.toUpperCase() === 'CONFIRMED') ?? [],
)
const watchCombos = computed(() => combos.value?.combos.filter((c) => c.is_watch) ?? [])
const resolvedCombos = computed(() =>
  combos.value?.combos
    .filter((c) => {
      const s = c.status.toUpperCase()
      return s === 'CANCELLED' || s === 'RESOLVED'
    })
    .slice(0, 2) ?? [],
)

const regimeNarrative = computed(
  () => regime.value?.narrative || narrative.value?.narrative || nightly.value?.narrative || '',
)
const systemRecommendation = computed(
  () => regime.value?.system_recommendation || narrative.value?.system_recommendation || '',
)

const showCftcAlert = computed(() => {
  const status = macroStatus.value?.cftc_status
    ?? narrative.value?.cftc_status
    ?? nightly.value?.cftc_status
    ?? ''
  return String(status).includes('PENDING') || String(status).includes('STALE')
})
const cftcStatus = computed(() =>
  macroStatus.value?.cftc_status
  ?? narrative.value?.cftc_status
  ?? nightly.value?.cftc_status
  ?? '—',
)
const pendingCpi = computed(() => macroStatus.value?.pending_cpi_release ?? false)
const cftcEst = computed(() => nightly.value?.cftc_est_pctile)

function activeComboLine(combo: MacroNamedCombo) {
  const parts: string[] = []
  if (combo.episode_start) parts.push(`from ${combo.episode_start}`)
  if (combo.duration_bucket) parts.push(combo.duration_bucket)
  if (combo.status) parts.push(combo.status)
  if (combo.hit_rate_primary != null) parts.push(`${formatHitRate(combo.hit_rate_primary)} hit`)
  if (combo.avg_return_primary != null) parts.push(`${formatReturnPct(combo.avg_return_primary)} avg`)
  return parts.join(' · ') || '—'
}

function watchComboLine(combo: MacroNamedCombo) {
  const pending = combo.variables.filter((v) => !combo.confirmed_legs?.includes(v))
  return pending.length ? `Pending: ${pending.join(', ')}` : combo.description || '—'
}

function kpiFromOverview(k: MacroOverviewKpisResponse) {
  const dom = k.dominant_signal
  const domHit = dom.hit_rate != null ? `${formatHitRate(dom.hit_rate)} hit` : ''
  const domRet = dom.avg_return != null ? `${formatReturnPct(dom.avg_return)} avg` : ''
  const domDelta = [regime.value?.dominant_reason, domHit, domRet].filter(Boolean).join(' · ') || '—'

  const c = k.combo_c_duration
  const cValue = c.active
    ? c.duration_bucket ?? 'ACTIVE'
    : c.duration_weeks != null
      ? `wk ${c.duration_weeks}`
      : 'INACTIVE'
  const cDelta =
    c.duration_weeks != null && c.duration_bucket
      ? `wk ${c.duration_weeks} · ${c.duration_bucket}`
      : c.active ? 'Active' : 'Inactive'

  const f = k.combo_f_window
  const fDeltaParts: string[] = []
  if (f.weeks_elapsed != null) fDeltaParts.push(`of 26`)
  if (f.mtm_pct != null) fDeltaParts.push(`${formatReturnPct(f.mtm_pct)} MTM`)
  else if (regime.value?.dominant_reason?.includes('6M')) {
    const m = regime.value.dominant_reason.match(/(\d+)%\s*6M/)
    if (m) fDeltaParts.push(`${m[1]}% 6M hit rate`)
  }

  const cape = k.cape
  const capeValue = cape.current != null ? `${cape.current.toFixed(2)}×` : '—'
  const capeDelta = cape.combo_e_status ?? cape.tier ?? '—'

  const wti = k.wti_4wk
  const wtiValue = wti.current != null ? `${wti.current.toFixed(1)}%` : '—'
  const wtiDelta =
    macroStatus.value?.combo_c_cancel_week != null
      ? `Cancel Fridays · ${macroStatus.value.combo_c_cancel_week}/4`
      : wti.cancel_week != null
        ? `Cancel Fridays · ${wti.cancel_week}/4`
        : cancelTracker.value
          ? `Cancel Fridays · ${cancelTracker.value.combo_c_cancel_fri}/4`
          : wti.tier ?? '—'

  return [
    {
      label: 'Dominant Signal',
      value: dom.combo ? `COMBO ${dom.combo}` : '—',
      delta: domDelta,
      accent: 'r',
      deltaClass: 'r',
      valueClass: 'kv-sm',
    },
    {
      label: 'Combo C',
      value: cValue,
      delta: cDelta,
      accent: 'amber',
      deltaClass: 'amber',
    },
    {
      label: 'Combo F Window',
      value: f.weeks_elapsed != null ? `Wk ${f.weeks_elapsed}` : '—',
      delta: fDeltaParts.join(' · ') || '—',
      accent: 'g',
      deltaClass: 'g',
    },
    {
      label: 'Combo E · CAPE',
      value: capeValue,
      delta: capeDelta,
      accent: 'r',
      deltaClass: 'r',
    },
    {
      label: 'WTI 4-Wk Δ',
      value: wtiValue,
      delta: wtiDelta,
      accent: 'b',
      deltaClass: 'g',
    },
  ]
}

const kpis = computed(() => {
  const k = overviewKpis.value
  if (k && !isApiUnavailable(k)) return kpiFromOverview(k)
  return []
})
</script>

<style scoped>
.kv-sm :deep(.kv) {
  font-size: 14px;
  padding-top: 4px;
}
.runic-unavailable {
  padding: 4px 0;
}
.runic-three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 1100px) {
  .runic-three-col {
    grid-template-columns: 1fr;
  }
}
</style>
