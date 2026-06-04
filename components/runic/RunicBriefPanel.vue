<template>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <div class="runic-card">
      <div class="runic-card-hd">
        <div class="runic-card-title">Nightly Brief · Section 6 · {{ nightly?.date ?? '—' }}</div>
      </div>
      <div style="padding:12px 14px">
        <div class="brief-dominant">
          <span class="brief-dominant-label">Dominant signal</span>
          <div class="brief-dominant-row">
            <span class="runic-badge b-act">COMBO {{ nightly?.dominant_signal }}</span>
            <span class="brief-dominant-reason">{{ nightly?.dominant_reason }}</span>
          </div>
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
            <div class="brief-kv-l">Combo E</div>
            <div class="brief-kv-v">{{ eBadge }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">Brave / fearful</div>
            <div class="brief-kv-v brief-kv-html" v-html="braveFearfulHtml" />
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">CFTC</div>
            <div class="brief-kv-v" :class="cftcClass">{{ cftcLabel }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">C cancel Fridays</div>
            <div class="brief-kv-v">{{ nightly?.combo_c_cancel_fri ?? '—' }} / 4</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">WTI 4wk Δ</div>
            <div class="brief-kv-v" :class="wtiClass">{{ wtiLabel }}</div>
          </div>
          <div class="brief-kv">
            <div class="brief-kv-l">VIX bypass</div>
            <div class="brief-kv-v" :class="nightly?.vix_bypass_active ? 'warn' : 'ok'">
              {{ nightly?.vix_bypass_active ? 'ACTIVE' : 'Off' }}
            </div>
          </div>
        </div>

        <div class="brief-section-label">Active combos</div>
        <div v-if="nightly?.active_combos?.length" class="brief-combo-list">
          <div v-for="combo in nightly.active_combos" :key="combo.combo" class="brief-combo-row">
            <span class="runic-badge" :class="comboBadgeClass(combo.combo)">{{ combo.combo }}</span>
            <span class="brief-combo-detail">{{ activeComboDetail(combo) }}</span>
          </div>
        </div>

        <div v-if="nightly?.watch_combos?.length" class="brief-section-label" style="margin-top:10px">Watch</div>
        <div v-if="nightly?.watch_combos?.length" class="brief-combo-list">
          <div v-for="combo in nightly.watch_combos" :key="combo.combo" class="brief-combo-row">
            <span class="runic-badge b-watch">{{ combo.combo }}</span>
            <span class="brief-combo-detail">{{ combo.legs_confirmed }}/3 legs · {{ combo.pending }} pending</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="runic-card" style="margin-bottom:8px">
        <div class="runic-card-hd"><div class="runic-card-title">Nightly Narrative · Regime Logic</div></div>
        <div class="runic-body narrative-block" style="padding:10px 14px">
          {{ nightly?.narrative }}
        </div>
      </div>
      <div class="runic-card" style="margin-bottom:8px">
        <div class="runic-card-hd"><div class="runic-card-title">Geo Overlay · Classification · Frequency · Storage</div></div>
        <div class="runic-body" style="padding:10px 14px">
          <div style="color:var(--gold);margin-bottom:3px">METHOD</div>
          Claude Sonnet 4.6 API. Single-token output. &lt;$0.001/date.<br><br>
          <div style="color:var(--gold);margin-bottom:3px">FREQUENCY</div>
          Live: weekly, Sunday. Stored in macro_regime_log SQLite.<br><br>
          <div style="color:var(--gold);margin-bottom:3px">TODAY</div>
          <span style="color:var(--red)">{{ nightly?.regime.geo_overlay }}</span> (Iran conflict · kinetic · materially affecting oil supply).
        </div>
      </div>
      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Python + SQL vs Claude API · Clear Boundary</div></div>
        <div class="runic-body" style="padding:10px 14px">
          <div style="color:var(--green);margin-bottom:3px">PYTHON + SQL ONLY:</div>
          All 12 variable pulls · percentile ranks · 298 combo detection loops · Friday cancel checker<br><br>
          <div style="color:var(--blue);margin-bottom:3px">CLAUDE SONNET 4.6 API:</div>
          Geo overlay weekly · historical backfill · nightly narrative · monthly combo naming<br><br>
          <div style="color:var(--amber);margin-bottom:3px">NOT VIA API:</div>
          Real-time news · live CFTC scraping (scheduled Fri 15:30 ET pull)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RunicActiveCombo } from '~/types/api'
import {
  buildRegimePills,
  comboEBadge,
  formatBraveFearful,
} from '~/utils/runic-regime'

const { nightly } = useRunicMacro()

const regimePills = computed(() =>
  nightly.value ? buildRegimePills(nightly.value.regime) : [],
)

const eBadge = computed(() =>
  nightly.value ? comboEBadge(nightly.value.combo_e_status) : '—',
)

const braveFearfulHtml = computed(() =>
  nightly.value ? formatBraveFearful(nightly.value.brave_fearful) : '—',
)

const cftcLabel = computed(() => {
  if (!nightly.value) return '—'
  if (nightly.value.cftc_status === 'PENDING_3DAY_LAG') {
    return `Pending${nightly.value.cftc_est_pctile ? ` · est. ${nightly.value.cftc_est_pctile}` : ''}`
  }
  return 'Confirmed'
})

const cftcClass = computed(() =>
  nightly.value?.cftc_status === 'PENDING_3DAY_LAG' ? 'warn' : 'ok',
)

const wtiLabel = computed(() => {
  const pct = nightly.value?.wti_4wk_pct
  if (pct === undefined) return '—'
  return `${pct > 0 ? '+' : ''}${pct}%`
})

const wtiClass = computed(() => {
  const pct = nightly.value?.wti_4wk_pct ?? 0
  if (pct <= -15) return 'neg'
  if (pct >= 10) return 'warn'
  return ''
})

function comboBadgeClass(combo: string) {
  if (combo === 'C') return 'b-act'
  if (combo === 'E') return 'b-conf'
  if (combo === 'F') return 'b-bull'
  return 'b-ok'
}

function activeComboDetail(combo: RunicActiveCombo) {
  const parts: string[] = []
  if (combo.bucket && combo.wk) parts.push(`${combo.bucket} wk ${combo.wk}`)
  else if (combo.wk) parts.push(`wk ${combo.wk}`)
  else if (combo.duration_weeks) parts.push(`${combo.duration_weeks}w`)
  if (combo.status) parts.push(combo.status.replace(/_/g, ' '))
  if (combo.mtm_pct !== undefined) parts.push(`MTM +${combo.mtm_pct}%`)
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
  font-size: 8.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--t3);
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
  font-size: 10px;
  color: var(--t2);
}
.brief-section-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--t3);
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
  font-size: 8px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 4px;
}
.brief-kv-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--t1);
  line-height: 1.4;
}
.brief-kv-v.ok { color: var(--green); }
.brief-kv-v.warn { color: var(--amber); }
.brief-kv-v.neg { color: var(--red); }
.brief-kv-html :deep(span) { font-size: 10px; font-weight: 600; }
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
  font-size: 9.5px;
  color: var(--t3);
}
</style>
