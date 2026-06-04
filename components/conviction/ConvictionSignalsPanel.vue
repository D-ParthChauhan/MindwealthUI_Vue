<template>
  <div>
    <div class="cv-section-hint">Click any row to expand BQ drilldown · All fundamentals + FS detail in-line below row</div>
    <table class="tbl cv-tbl">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Dir.</th>
          <th>Function</th>
          <th>Signal date</th>
          <th>Conviction</th>
          <th>Verdict</th>
          <th>Size</th>
          <th>BQ</th>
          <th>FS class</th>
          <th>fd dir.</th>
          <th>Yield trap</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in signals" :key="row.id">
          <tr
            class="cv-row"
            :class="{ selected: (selectedId ?? openId) === row.id, 'cv-row-yt': row.yieldTrap }"
            @click="row.isEquity && row.detail ? toggle(row.id) : undefined"
          >
            <td><div class="tkr">{{ row.ticker }}</div></td>
            <td><span :class="row.direction === 'LONG' ? 'cv-long' : 'cv-short'">{{ row.direction }}</span></td>
            <td class="cv-muted">{{ row.function }}</td>
            <td class="cv-muted">{{ row.signalDate }}</td>
            <td>
              <span class="cv-cscore" :class="convictionScoreClass(row.convictionScore)">
                {{ formatConviction(row.convictionScore) }}
              </span>
            </td>
            <td>
              <span class="cvb" :class="verdictBadgeClass(row.verdict)">
                <template v-if="row.verdict === 'YIELD TRAP'">⚠ </template>{{ row.verdict }}
              </span>
            </td>
            <td :class="sizeClass(row)">{{ row.sizeModifier }}</td>
            <td class="cv-bq">{{ row.bqScore ?? '—' }}</td>
            <td>
              <span v-if="row.fsClass" class="cvfs" :class="fsBadgeClass(row.fsClass)">{{ row.fsClass.replace('_', '-') }}</span>
              <span v-else class="cv-muted">—</span>
            </td>
            <td><span v-if="row.fdDirection" :class="fdClass(row.fdDirection)">{{ fdLabel(row.fdDirection) }}</span><span v-else class="cv-muted">—</span></td>
            <td :class="row.yieldTrap ? 'cv-yt-active' : 'cv-muted'">{{ row.yieldTrap ? 'ACTIVE' : '—' }}</td>
            <td>
              <div v-if="row.isEquity && row.detail" class="cv-row-actions" @click.stop>
                <button type="button" class="cv-actn prim" @click="toggle(row.id)">BQ drill</button>
                <button type="button" class="cv-actn" @click="$emit('fs-page', row.ticker)">FS page →</button>
              </div>
              <span v-else class="cv-muted" style="font-size:9px">non-equity, no score</span>
            </td>
          </tr>
          <tr v-if="row.isEquity && row.detail" class="cv-drawer-row">
            <td colspan="12">
              <ConvictionRowDrawer
                :open="openId === row.id"
                :detail="row.detail"
                :initial-tab="openId === row.id ? drawerTab : 'bq'"
                @close="openId = null"
                @fs-page="$emit('fs-page', $event)"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalRow } from '~/types/conviction'
import {
  convictionScoreClass,
  fdClass,
  fdLabel,
  formatConviction,
  fsBadgeClass,
  verdictBadgeClass,
} from '~/utils/conviction-display'

const props = defineProps<{
  signals: ConvictionSignalRow[]
  selectedId?: string | null
  openRequest?: { id: string; tab: 'bq' | 'fs' | 'fd' } | null
}>()
const emit = defineEmits<{ 'fs-page': [ticker: string]; select: [id: string] }>()

const openId = ref<string | null>(null)
const drawerTab = ref<'bq' | 'fs' | 'fd'>('bq')

watch(() => props.openRequest, (req) => {
  if (!req) return
  openId.value = req.id
  drawerTab.value = req.tab
}, { immediate: true })

function toggle(id: string) {
  emit('select', id)
  if (openId.value === id) {
    openId.value = null
    return
  }
  openId.value = id
  drawerTab.value = 'bq'
}

function sizeClass(row: ConvictionSignalRow) {
  if (row.convictionScore === null) return 'cv-muted'
  if (row.convictionScore >= 5) return 'cv-size-pos'
  if (row.convictionScore >= 2) return 'cv-size-mid'
  return 'cv-size-neg'
}
</script>
