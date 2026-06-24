<template>
  <div v-if="tracker">
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px">
      <div>
        <div class="runic-card" style="margin-bottom:10px">
          <div class="runic-card-hd">
            <div class="runic-card-title">Combo C — Cancel Condition Monitor</div>
            <span class="runic-badge b-act">{{ tracker.combo_c_cancel_fri }} OF 4 FRIDAYS</span>
          </div>
          <div class="runic-body" style="padding:10px 14px;border-bottom:1px solid var(--b2)">
            WTI 4wk Δ: <b style="color:var(--amber)">{{ tracker.wti_4wk_pct }}%</b>
            <template v-if="tracker.cancel_gate_pct != null">
              · Gate &lt; {{ tracker.cancel_gate_pct }}%
            </template>
            <template v-if="tracker.combo_c_cancelled">
              · Cancelled<template v-if="tracker.combo_c_cancel_date"> {{ tracker.combo_c_cancel_date }}</template>
            </template>
          </div>
          <div v-if="tracker.current_cpi_print" class="runic-body" style="padding:8px 14px;border-bottom:1px solid var(--b2);line-height:1.7">
            CPI {{ tracker.current_cpi_print.release_date }}:
            actual {{ tracker.current_cpi_print.actual }} vs consensus {{ tracker.current_cpi_print.consensus }}
            <template v-if="tracker.current_cpi_print.surprise_pp != null">
              ({{ tracker.current_cpi_print.surprise_pp >= 0 ? '+' : '' }}{{ tracker.current_cpi_print.surprise_pp }}pp)
            </template>
            <template v-if="tracker.current_cpi_print.not_hot != null">
              · {{ tracker.current_cpi_print.not_hot ? 'Not hot' : 'Hot' }}
            </template>
          </div>
          <div v-if="tracker.ppi_cooling != null" class="runic-body" style="padding:6px 14px;border-bottom:1px solid var(--b2);color:var(--t2)">
            PPI cooling: {{ tracker.ppi_cooling ? 'Yes' : 'No' }}
          </div>
          <div class="fri-row hdr" style="background:var(--s2);border-bottom:1px solid var(--b2)">
            <span style="width:50px">FRI #</span><span style="width:75px">DATE</span><span style="width:75px">WTI 4WK Δ</span>
            <span style="width:55px">WTI LEG</span><span style="flex:1">DATA (CPI/PPI)</span><span style="width:55px">DATA LEG</span><span style="width:65px">STATUS</span>
          </div>
          <div
            v-for="row in tracker.friday_rows"
            :key="row.num"
            class="fri-row"
            :style="row.highlight ? { background: 'rgba(230,126,34,0.03)', border: '1px solid rgba(230,126,34,0.08)' } : undefined"
          >
            <span style="width:50px" :style="{ color: rowColor(row, 'num') }">{{ row.num }}</span>
            <span style="width:75px" :style="{ color: rowColor(row, 'date') }">{{ row.date }}</span>
            <span style="width:75px" :style="{ color: rowColor(row, 'wti') }">{{ row.wti }}</span>
            <span style="width:55px" :style="{ color: rowColor(row, 'wti_leg') }">{{ row.wti_leg }}</span>
            <span style="flex:1" :style="{ color: rowColor(row, 'data') }">{{ row.data }}</span>
            <span style="width:55px" :style="{ color: rowColor(row, 'data_leg') }">{{ row.data_leg }}</span>
            <span class="runic-badge" :class="row.badge_class" style="width:65px;text-align:center">{{ row.status }}</span>
          </div>
        </div>
      </div>
      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Cancel Summary</div></div>
        <div style="padding:12px 14px">
          <div class="runic-cancel-dots" style="margin-bottom:10px">
            <div
              v-for="(f, i) in tracker.cancel_fridays"
              :key="i"
              :class="{ filled: f.filled, critical: f.critical }"
              :title="f.label.replace('\n', ' ')"
            />
          </div>
          <div v-if="tracker.probability_model" class="runic-body" style="line-height:1.8;margin-bottom:10px">
            <div style="color:var(--t2);margin-bottom:2px">CANCEL PROBABILITY</div>
            Model: {{ (tracker.probability_model.model_cancel_prob * 100).toFixed(1) }}%
            · WTI leg {{ (tracker.probability_model.model_wti_leg_prob * 100).toFixed(0) }}%
            · CPI leg {{ (tracker.probability_model.model_cpi_leg_prob * 100).toFixed(0) }}%
          </div>
          <div v-if="tracker.if_cancelled?.note" class="runic-body" style="line-height:1.8;margin-bottom:10px;color:var(--amber)">
            {{ tracker.if_cancelled.note }}
          </div>
          <div class="runic-body" style="line-height:1.8">
            <template v-if="tracker.combo_c_status">
              <div style="color:var(--t2);margin-bottom:2px">COMBO C</div>
              {{ tracker.combo_c_status }}<template v-if="tracker.combo_c_duration"> · {{ tracker.combo_c_duration }}</template>
              <br><br>
            </template>
            <template v-if="tracker.dominant_signal">
              <div style="color:var(--t2);margin-bottom:2px">DOMINANT</div>
              Combo {{ tracker.dominant_signal }}
              <template v-if="tracker.dominant_reason"> · {{ tracker.dominant_reason }}</template>
              <br><br>
            </template>
            <template v-if="tracker.combo_f_status">
              <div style="color:var(--t2);margin-bottom:2px">COMBO F</div>
              {{ tracker.combo_f_status }}<template v-if="tracker.combo_f_duration"> · {{ tracker.combo_f_duration }}</template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="runic-card" style="margin-top:10px">
      <div class="runic-card-hd">
        <div class="runic-card-title">Combo F — 26-Week Recovery Window Monitor</div>
        <span v-if="tracker.f_window.weeks_elapsed" class="runic-badge b-ok">
          WK {{ tracker.f_window.weeks_elapsed }} OF {{ tracker.f_window.weeks_total }}
          <template v-if="tracker.combo_f_status"> · {{ tracker.combo_f_status }}</template>
        </span>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;padding:12px 14px">
        <div>
          <div class="runic-body" style="margin-bottom:10px">
            Fire date: <span style="color:var(--t2)">{{ tracker.f_window.fire_date }}</span>
            <template v-if="tracker.f_window.expires !== '—'">
              · Expires: <span style="color:var(--t2)">{{ tracker.f_window.expires }}</span>
            </template>
            <br>
            MTM from fire: <span style="color:var(--green);font-weight:600">{{ formatMtm(tracker.f_window.mtm_pct) }}</span>
          </div>
          <div class="runic-body" style="margin-bottom:4px">
            WINDOW ELAPSED · {{ tracker.f_window.weeks_elapsed }} of {{ tracker.f_window.weeks_total }} weeks ({{ fPct }}%)
          </div>
          <div class="prog-wrap"><div class="prog-fill" style="background:var(--green)" :style="{ width: `${fPct}%` }" /></div>
          <div v-if="tracker.cancel_condition" class="runic-body" style="margin-top:8px;color:var(--t2)">
            {{ tracker.cancel_condition }}
          </div>
          <div v-if="tracker.d_f_tension" class="runic-body" style="margin-top:4px;color:var(--amber)">
            {{ tracker.d_f_tension }}
          </div>
        </div>
        <div class="runic-body" style="padding:0 14px 12px">
          <template v-if="tracker.hit_rate_primary != null">
            Historical: {{ (tracker.hit_rate_primary * 100).toFixed(0) }}% hit
            <template v-if="tracker.avg_return_6m != null">
              · {{ tracker.avg_return_6m >= 0 ? '+' : '' }}{{ tracker.avg_return_6m.toFixed(1) }}% avg 6M
            </template>
          </template>
          <template v-else-if="tracker.combo_f_duration">{{ tracker.combo_f_duration }}</template>
        </div>
      </div>
    </div>

    <div v-if="tracker.upcoming_releases?.length" class="runic-card" style="margin-top:10px">
      <div class="runic-card-hd"><div class="runic-card-title">Upcoming Releases</div></div>
      <div style="padding:10px 14px">
        <div v-for="rel in tracker.upcoming_releases" :key="rel.release_date" class="runic-body" style="line-height:1.8">
          {{ rel.release_type }} · {{ rel.release_date }}
          <template v-if="rel.consensus != null"> · consensus {{ rel.consensus }}</template>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="runic-body" style="padding:14px;color:var(--t2)">{{ UNAVAILABLE_FETCH }}</div>
</template>

<script setup lang="ts">
import type { RunicCancelFridayRow } from '~/types/api'
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'

const { cancelTracker: tracker } = useRunicMacro()

const fPct = computed(() => {
  if (!tracker.value) return 0
  if (tracker.value.progress_pct != null) return Math.round(tracker.value.progress_pct)
  const { weeks_elapsed, weeks_total } = tracker.value.f_window
  if (!weeks_total) return 0
  return Math.round((weeks_elapsed / weeks_total) * 100)
})

function formatMtm(pct: number) {
  if (pct == null || !Number.isFinite(pct)) return '—'
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

function rowColor(row: RunicCancelFridayRow, field: string) {
  if (row.highlight) return field === 'num' || field === 'date' || field === 'data' || field === 'data_leg' ? 'var(--amber)' : 'var(--t3)'
  if (row.status === 'PENDING') {
    if (field === 'wti' || field === 'wti_leg') return 'var(--amber)'
    if (field === 'data_leg') return 'var(--green)'
    return field === 'num' || field === 'date' ? 'var(--t2)' : 'var(--t3)'
  }
  return 'var(--t3)'
}
</script>
