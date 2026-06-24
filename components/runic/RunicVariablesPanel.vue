<template>
  <div>
    <div class="runic-card" style="margin-bottom:10px">
      <div class="runic-card-hd">
        <div class="runic-card-title">12-Variable Extreme Map · {{ variables?.date ?? '—' }}</div>
        <span class="runic-body">Hover for detail</span>
      </div>
      <div style="padding:10px 13px">
        <div class="runic-heat">
          <div
            v-for="cell in variables?.heatmap ?? []"
            :key="cell.label"
            class="runic-heat-cell"
            :class="cell.class"
            :title="cell.title"
          >
            {{ cell.label }}
          </div>
        </div>
        <div class="runic-body" style="display:flex;gap:14px">
          <span>▪ NORMAL</span>
          <span style="color:var(--amber)">▪ RARE / APPROACHING</span>
          <span style="color:var(--red)">▪ EXTREME (pulsing)</span>
          <span>▪ PENDING (dashed)</span>
        </div>
      </div>
    </div>

    <div v-if="freshnessBanner" class="cftc-alert" style="margin-bottom:10px">
      <div class="nd amber" style="width:6px;height:6px;margin-top:2px;animation:pu 2s infinite;flex-shrink:0" />
      <div class="runic-body" style="color:var(--amber)">{{ freshnessBanner }}</div>
    </div>

    <div class="runic-card">
      <div class="runic-card-hd">
        <div class="runic-card-title">All 12 Variables · Sources · Current Levels · Thresholds</div>
        <span v-if="dataFreshness?.any_stale_after_refresh" class="runic-body" style="color:var(--amber)">⚠ Stale sources detected</span>
      </div>
      <div class="m-tbl-scroll">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th><th>Variable</th><th>Source</th><th>Compute</th><th>Current</th>
            <th>RARE Gate</th><th>EXTREME Gate</th><th>Today</th><th>Combos</th><th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in variables?.variables ?? []"
            :key="row.num"
            :style="row.row_highlight ? { background: 'rgba(192,57,43,0.02)' } : undefined"
          >
            <td class="runic-body">{{ row.num }}</td>
            <td>
              <b style="color:#fff">{{ row.name }}</b>
              <span v-if="showVixBypass(row)" class="vix-bypass">BYPASS ACTIVE</span>
              <br><span class="runic-body">{{ row.sub }}</span>
            </td>
            <td class="runic-body" v-html="row.source" />
            <td class="runic-body" v-html="row.compute" />
            <td class="runic-body" :style="{ fontSize: '11px', fontWeight: '600', color: row.current_color ?? 'var(--t2)' }" v-html="row.current" />
            <td class="runic-body" v-html="row.rare_gate" />
            <td class="runic-body" v-html="row.extreme_gate" />
            <td><span class="runic-tier" :class="row.tier_class">{{ row.tier }}</span></td>
            <td class="runic-body">{{ row.combos }}</td>
            <td class="runic-body" :style="row.note_color ? { color: row.note_color } : undefined" v-html="row.note" />
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RunicVariableRow } from '~/types/api'
import { isApiUnavailable } from '~/utils/api-display'

const { nightly, variables, dataFreshness, macroStatus } = useRunicMacro()

const freshnessBanner = computed(() => {
  const parts: string[] = []
  const fresh = dataFreshness.value
  const status = macroStatus.value
  if (fresh && !isApiUnavailable(fresh)) {
    if (fresh.cftc_status) parts.push(`CFTC: ${fresh.cftc_status.replace(/_/g, ' ')}`)
    if (fresh.pending_cpi_release) parts.push('CPI release pending')
    if (fresh.any_stale_after_refresh) parts.push('Some variable sources are stale')
  } else if (status && !isApiUnavailable(status)) {
    if (status.cftc_status) parts.push(`CFTC: ${status.cftc_status.replace(/_/g, ' ')}`)
    if (status.pending_cpi_release) parts.push('CPI release pending')
  }
  return parts.length ? parts.join(' · ') : ''
})

function showVixBypass(row: RunicVariableRow) {
  return row.name === 'VIX' && (
    macroStatus.value?.vix_bypass
    || nightly.value?.vix_bypass_active
    || row.vix_bypass
  )
}
</script>
