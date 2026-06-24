<template>
  <div class="pf-cluster" :class="{ 'pf-cluster-blocked': cluster.positions.every((p) => p.blocked) }">
    <div class="pf-cl-hd">
      <div class="pf-cl-name">{{ cluster.label }}</div>
      <div class="pf-cl-tag" :class="activeCount ? 'ct-ok' : 'ct-warn'">
        {{ activeCount }} signal{{ activeCount === 1 ? '' : 's' }} active
      </div>
      <div class="pf-cl-budget">
        <b>{{ pfUsd(data, cluster.budget_usd) }}</b>
        <span v-if="cluster.budget_pct != null"> · {{ cluster.budget_pct }}% of portfolio</span>
      </div>
    </div>
    <div class="pf-cl-bar">
      <div class="pf-cl-bar-track">
        <div
          class="pf-cl-bar-fill"
          :style="{
            width: barWidth,
            background: cluster.deployed_pct != null && cluster.max_pct != null && cluster.deployed_pct / cluster.max_pct > 0.75
              ? 'var(--green)'
              : 'var(--amber)',
          }"
        />
      </div>
      <div class="pf-cl-bar-pct">
        {{ pfPct(data, cluster.deployed_pct) }} deployed / {{ pfPct(data, cluster.max_pct) }} max
      </div>
    </div>
    <div
      v-for="pos in cluster.positions"
      :key="`${pos.ticker}-${pos.function}`"
      class="pf-pr"
      :class="{ blocked: pos.blocked }"
    >
      <div class="pf-pr-ticker" :class="{ 'pf-blocked-ticker': pos.blocked }">{{ pos.ticker }}</div>
      <div class="pf-pr-name">{{ pfText(data, pos.name) }}</div>
      <div class="pf-pr-signal">{{ pos.function }} · {{ pos.interval }}</div>
      <div class="pf-pr-bq" :class="bqClass(pos.bq_score)">
        {{ pos.bq_score != null ? `BQ ${pos.bq_score > 0 ? '+' : ''}${pos.bq_score}` : UNAVAILABLE_COMPUTE }}
      </div>
      <div class="pf-pr-size" :class="bqClass(pos.bq_score)">{{ pfText(data, pos.size_tier) }}</div>
      <div class="pf-pr-alloc">{{ pfUsd(data, pos.allocation_usd) }}</div>
      <div class="pf-pr-flags">
        <PortfolioFlagBadge v-for="flag in pos.flags" :key="flag.id" :flag="flag" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UNAVAILABLE_COMPUTE } from '~/constants/unavailable'
import type { PortfolioClusterGroup, PortfolioResponse } from '~/types/api'
import { bqClass, pfPct, pfText, pfUsd } from '~/utils/portfolio-display'

const props = defineProps<{
  data: PortfolioResponse
  cluster: PortfolioClusterGroup
}>()

const activeCount = computed(() => props.cluster.positions.filter((p) => !p.blocked).length)

const barWidth = computed(() => {
  const { deployed_pct, max_pct } = props.cluster
  if (deployed_pct == null || max_pct == null || max_pct <= 0) return '0%'
  return `${Math.min(100, Math.round((deployed_pct / max_pct) * 100))}%`
})
</script>
