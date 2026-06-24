<template>
  <div>
    <div v-if="showLoading" class="runic-body" style="padding:14px;color:var(--t2)">Loading analog tables…</div>
    <div v-else-if="!panels.length" class="runic-body" style="padding:14px;color:var(--t2)">{{ UNAVAILABLE_FETCH }}</div>

    <div
      v-for="panel in panels"
      :key="panel.combo"
      class="runic-card card-flush"
      :style="{ marginBottom: panels.length > 1 ? '12px' : undefined }"
    >
      <div class="runic-card-hd">
        <div class="runic-card-title" :style="{ color: panel.title_color }">{{ panel.title }}</div>
        <span class="runic-body">{{ panel.subtitle }}</span>
      </div>
      <div class="m-tbl-scroll">
        <table class="at">
          <thead>
            <tr>
              <th>Fire Date</th>
              <th>Context</th>
              <th>Duration</th>
              <th>Max DD</th>
              <th>Bottom Timing</th>
              <th v-for="col in panel.columns" :key="col">{{ col }}</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in panel.rows" :key="`${panel.combo}-${row.date}`" :class="row.row_class">
              <td class="atd" :style="row.date_color ? { color: row.date_color } : undefined">{{ row.date }}</td>
              <td class="runic-body" style="max-width:120px">{{ row.context }}</td>
              <td>{{ row.duration ?? '—' }}</td>
              <td class="ret neg">{{ row.max_dd }}</td>
              <td class="runic-body">{{ row.bottom_timing ?? '—' }}</td>
              <td v-for="(ret, i) in row.returns" :key="i" class="ret" :class="ret.cls">{{ ret.val }}</td>
              <td><span class="runic-badge" :class="row.verdict_class">{{ row.verdict }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="panel.footnote" class="runic-body" style="padding:8px 14px;color:var(--t2);border-top:1px solid var(--b2)">
        {{ panel.footnote }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RunicAnalogResponse } from '~/types/api'
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'
import { NAMED_COMBO_LETTERS } from '~/constants/runic-macro-data'

const { analogPanels, analogPending } = useRunicMacro()

const panels = computed((): RunicAnalogResponse[] =>
  NAMED_COMBO_LETTERS
    .map((letter) => analogPanels.value?.[letter])
    .filter((p): p is RunicAnalogResponse => Boolean(p?.rows?.length)),
)

const showLoading = computed(() => analogPending.value && !panels.value.length)
</script>

<style scoped>
.card-flush { padding: 0; overflow: hidden; }
</style>
