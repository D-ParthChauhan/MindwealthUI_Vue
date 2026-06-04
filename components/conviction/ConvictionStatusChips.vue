<template>
  <div class="cv-chips-wrap">
    <div class="cv-chips-label">Signal status</div>
    <div class="cv-chips">
      <button
        v-for="row in equitySignals"
        :key="row.id"
        type="button"
        class="cv-chip"
        :class="[chipClass(row), { on: selectedId === row.id }]"
        @click="$emit('select', row.id)"
      >
        <span class="cv-chip-tkr">{{ row.ticker }}</span>
        <span class="cv-chip-ver">{{ shortVerdict(row.verdict) }}</span>
        <span class="cv-chip-score">{{ formatConviction(row.convictionScore) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalRow, ConvictionVerdict } from '~/types/conviction'
import { formatConviction } from '~/utils/conviction-display'

const props = defineProps<{
  signals: ConvictionSignalRow[]
  selectedId: string | null
}>()

defineEmits<{ select: [id: string] }>()

const equitySignals = computed(() =>
  props.signals.filter((s) => s.isEquity),
)

function shortVerdict(v: ConvictionVerdict) {
  if (v === 'MAX CONVICTION') return 'MAX'
  if (v === 'N/A (ETF)') return 'N/A'
  return v
}

function chipClass(row: ConvictionSignalRow) {
  if (row.yieldTrap || row.verdict === 'YIELD TRAP') return 'cv-chip-yld'
  if (row.verdict === 'CANCEL') return 'cv-chip-cnc'
  if (row.verdict === 'REDUCED') return 'cv-chip-red'
  if (row.verdict === 'TACTICAL') return 'cv-chip-tac'
  if (row.verdict === 'MAX CONVICTION') return 'cv-chip-max'
  return 'cv-chip-na'
}
</script>
