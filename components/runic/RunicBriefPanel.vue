<template>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <div class="runic-card">
      <div class="runic-card-hd">
        <div class="runic-card-title">Nightly Brief · {{ brief?.date ?? '—' }}</div>
      </div>
      <div style="padding:12px 14px">
        <div class="brief-dominant">
          <span class="brief-dominant-label">Dominant signal</span>
          <div class="brief-dominant-row">
            <span class="runic-badge b-act">COMBO {{ brief?.dominant_signal ?? '—' }}</span>
            <span class="brief-dominant-reason">{{ brief?.dominant_reason ?? '—' }}</span>
          </div>
        </div>

        <div v-if="brief?.system_recommendation" class="brief-section-label">System recommendation</div>
        <div v-if="brief?.system_recommendation" class="runic-body" style="margin-bottom:12px;color:var(--gold)">
          {{ brief.system_recommendation }}
        </div>

        <div class="brief-section-label">Regime inputs</div>
        <div class="brief-pills">
          <span
            v-for="pill in regimePills"
            :key="pill.label"
            class="rpill"
            :class="pill.class"
          >
            {{ pill.label }}: {{ pill.value }}
          </span>
        </div>

        <div class="brief-section-label">Status flags</div>
        <div class="brief-kv-grid">
          <div class="brief-kv">
            <div class="brief-kv-l">Brave / fearful</div>
            <div class="brief-kv-v">{{ brief?.brave_fearful_display ?? '—' }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">CFTC</div>
            <div class="brief-kv-v" :class="cftcClass">{{ cftcLabel }}</div>
          </div>
          <div v-if="macroStatus?.pending_cpi_release" class="brief-kv">
            <div class="brief-kv-l">CPI release</div>
            <div class="brief-kv-v warn">Pending</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">C cancel Fridays</div>
            <div class="brief-kv-v">{{ cancelTracker?.combo_c_cancel_fri ?? '—' }} / 4</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">WTI 4wk Δ</div>
            <div class="brief-kv-v" :class="wtiClass">{{ wtiLabel }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">VIX bypass</div>
            <div class="brief-kv-v" :class="vixBypassActive ? 'warn' : 'ok'">
              {{ vixBypassActive ? 'ACTIVE' : 'Off' }}
            </div>
          </div>
          <div v-if="ssiLayer2" class="brief-kv">
            <div class="brief-kv-l">SSI Layer 2</div>
            <div class="brief-kv-v">{{ ssiLayer2 }}</div>
          </div>
          <div v-if="nightly?.vix != null" class="brief-kv">
            <div class="brief-kv-l">VIX</div>
            <div class="brief-kv-v">{{ nightly.vix }}</div>
          </div>
          <div v-if="nightly?.nfci_sigma" class="brief-kv">
            <div class="brief-kv-l">NFCI σ</div>
            <div class="brief-kv-v">{{ nightly.nfci_sigma }}</div>
          </div>
        </div>

        <div v-if="persistenceSignals.length" class="brief-section-label">Persistence signals</div>
        <div v-if="persistenceSignals.length" class="runic-body" style="margin-bottom:12px">
          {{ persistenceSignals.join(' · ') }}
        </div>

        <div v-if="genericWatch.length" class="brief-section-label">Generic combo watch</div>
        <div v-if="genericWatch.length" class="brief-combo-list" style="margin-bottom:12px">
          <div v-for="(row, i) in genericWatch" :key="i" class="brief-combo-row">
            <span class="runic-badge b-watch">{{ row.vars.join('+') }}</span>
            <span class="brief-combo-detail">{{ row.status }} · {{ row.gate }}</span>
          </div>
        </div>

        <div v-if="ssi" class="brief-section-label">SSI snapshot</div>
        <div v-if="ssi" class="brief-kv-grid" style="margin-bottom:12px">
          <div class="brief-kv">
            <div class="brief-kv-l">Level / Mult</div>
            <div class="brief-kv-v">{{ ssi.ssi_level.toFixed(4) }} · {{ ssi.ssi_multiplier.toFixed(2) }}×</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">Posture</div>
            <div class="brief-kv-v">{{ ssi.posture }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">Layer 2</div>
            <div class="brief-kv-v">{{ ssi.layer2_status }} · {{ ssi.layer2_confirmed_count }}/{{ ssi.layer2_required }}</div>
          </div>
        </div>

        <div class="brief-section-label">Active combos</div>
        <div v-if="activeCombos.length" class="brief-combo-list">
          <div v-for="combo in activeCombos" :key="combo.combo" class="brief-combo-row">
            <span class="runic-badge b-act">{{ combo.combo }}</span>
            <span class="brief-combo-detail">{{ activeComboDetail(combo) }}</span>
          </div>
        </div>
        <div v-else class="runic-body">—</div>

        <div v-if="watchCombos.length" class="brief-section-label" style="margin-top:10px">Watch</div>
        <div v-if="watchCombos.length" class="brief-combo-list">
          <div v-for="combo in watchCombos" :key="combo.combo" class="brief-combo-row">
            <span class="runic-badge b-watch">{{ combo.combo }}</span>
            <span class="brief-combo-detail">
              {{ combo.confirmed_legs?.length ?? 0 }}/{{ combo.total_legs }} legs
            </span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div v-if="brief?.narrative" class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Nightly Narrative</div></div>
        <div class="runic-body narrative-block" style="padding:10px 14px">{{ brief.narrative }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MacroNamedCombo } from '~/types/api'
import { buildRegimePills } from '~/utils/runic-regime'
import { macroComboToActive } from '~/utils/runic-combo-display'

import { isApiUnavailable } from '~/utils/api-display'

const { narrative, regime, persistence, combos, cancelTracker, nightly, macroStatus, ssiSummary } = useRunicMacro()

const ssi = computed(() =>
  ssiSummary.value && !isApiUnavailable(ssiSummary.value) ? ssiSummary.value : null,
)

const ssiLayer2 = computed(() => {
  if (ssi.value) return `${ssi.value.layer2_status} · ${ssi.value.ssi_multiplier.toFixed(2)}×`
  if (regime.value?.ssi_layer2_status) {
    return `${regime.value.ssi_layer2_status} · ${regime.value.ssi_multiplier?.toFixed(2) ?? '—'}×`
  }
  return ''
})

const vixBypassActive = computed(
  () => macroStatus.value?.vix_bypass || regime.value?.vix_bypass || nightly.value?.vix_bypass_active,
)

const brief = computed(() => {
  if (narrative.value) return narrative.value
  if (!regime.value) return null
  return {
    date: regime.value.date,
    narrative: regime.value.narrative,
    system_recommendation: regime.value.system_recommendation,
    brave_fearful_display: regime.value.brave_fearful_display,
    dominant_signal: regime.value.dominant_signal,
    dominant_reason: regime.value.dominant_reason,
    regime: regime.value.regime,
    cftc_status: '',
  }
})

const regimePills = computed(() =>
  brief.value?.regime ? buildRegimePills(brief.value.regime) : [],
)

const activeCombos = computed(() =>
  combos.value?.combos.filter((c) => c.is_active || c.status.toUpperCase() === 'CONFIRMED') ?? [],
)
const watchCombos = computed(() => combos.value?.combos.filter((c) => c.is_watch) ?? [])

const persistenceSignals = computed(() => {
  const fromApi = persistence.value?.persistence_signals?.map((s) => s.description || s.signal_type) ?? []
  if (fromApi.length) return fromApi
  return nightly.value?.persistence_signals ?? []
})

const genericWatch = computed(() => persistence.value?.generic_combo_watch ?? [])

const cftcLabel = computed(() => {
  const status = macroStatus.value?.cftc_status
    ?? narrative.value?.cftc_status
    ?? nightly.value?.cftc_status
  if (!status) return '—'
  if (String(status).includes('PENDING') || String(status).includes('STALE')) {
    return `Pending${nightly.value?.cftc_est_pctile ? ` · est. ${nightly.value.cftc_est_pctile}` : ''}`
  }
  return status
})

const cftcClass = computed(() => {
  const status = macroStatus.value?.cftc_status
    ?? narrative.value?.cftc_status
    ?? nightly.value?.cftc_status
    ?? ''
  return String(status).includes('PENDING') || String(status).includes('STALE') ? 'warn' : 'ok'
})

const wtiLabel = computed(() => {
  const pct = cancelTracker.value?.wti_4wk_pct ?? nightly.value?.wti_4wk_pct
  if (pct === undefined || pct === null) return '—'
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
})

const wtiClass = computed(() => {
  const pct = cancelTracker.value?.wti_4wk_pct ?? nightly.value?.wti_4wk_pct ?? 0
  if (pct <= -15) return 'neg'
  if (pct >= 10) return 'warn'
  return ''
})

function activeComboDetail(combo: MacroNamedCombo) {
  const active = macroComboToActive(combo)
  if (!active) return combo.status
  const parts: string[] = []
  if (active.bucket && active.wk) parts.push(`${active.bucket} wk ${active.wk}`)
  else if (active.wk) parts.push(`wk ${active.wk}`)
  if (active.status) parts.push(active.status.replace(/_/g, ' '))
  if (active.confirmed_legs?.length) parts.push(`legs ${active.confirmed_legs.join(', ')}`)
  return parts.join(' · ') || 'Active'
}
</script>

<style scoped>
.narrative-block {
  line-height: 1.9;
  color: var(--t2);
}
.brief-dominant {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--b2);
}
.brief-dominant-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--t2);
  margin-bottom: 6px;
}
.brief-dominant-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.brief-dominant-reason {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: var(--t2);
}
.brief-section-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--t2);
  margin-bottom: 6px;
}
.brief-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}
.brief-kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
}
.brief-kv {
  background: var(--s2);
  border: 1px solid var(--b1);
  border-radius: 4px;
  padding: 8px 10px;
}
.brief-kv-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t2);
  margin-bottom: 4px;
}
.brief-kv-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--t1);
  line-height: 1.4;
}
.brief-kv-v.ok { color: var(--green); }
.brief-kv-v.warn { color: var(--amber); }
.brief-kv-v.neg { color: var(--red); }
.brief-combo-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.brief-combo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.brief-combo-detail {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t2);
}
</style>
