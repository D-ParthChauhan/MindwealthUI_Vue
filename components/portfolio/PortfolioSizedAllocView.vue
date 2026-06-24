<template>
  <div class="pf-view pf-view-alloc">
    <div class="pf-sub-hd">
      <div class="pf-sub-hd-txt">
        <span>{{ pfUsd(data, data.ceiling.portfolio_notional) }} portfolio</span>
        <span> · </span>
        <b>{{ pfPct(data, data.ceiling.final_ceiling_pct) }}</b> equity ceiling
        <span v-if="data.ceiling.vix_regime"> ({{ data.ceiling.vix_regime }})</span>
        <span> · </span>
        <b>{{ pfUsd(data, data.summary.deployed_usd) }}</b> in equities
        <span v-if="data.ceiling.idle_cash_yield_pct != null">
          · {{ pfUsd(data, data.summary.cash_usd) }} cash @ {{ data.ceiling.idle_cash_yield_pct }}% p.a.
        </span>
      </div>
      <div class="pf-scene-wrap">
        <div class="pf-scene-lbl">Scenario:</div>
        <button
          type="button"
          class="pf-rbtn"
          :class="{ on: scenario === 'normal' }"
          :disabled="!data.scenarios_available"
          @click="scenario = 'normal'"
        >
          NORMAL
        </button>
        <button
          type="button"
          class="pf-rbtn"
          :class="{ on: scenario === 'stress' }"
          :disabled="!data.scenarios_available"
          @click="scenario = 'stress'"
        >
          STRESS
        </button>
        <button
          type="button"
          class="pf-rbtn"
          :class="{ on: scenario === 'lowvol' }"
          :disabled="!data.scenarios_available"
          @click="scenario = 'lowvol'"
        >
          LOW VOL
        </button>
        <div class="pf-auto-badge" :class="scenario === 'normal' ? 'auto' : 'manual'">
          ● {{ scenario === 'normal' ? 'AUTO' : 'MANUAL' }}
        </div>
      </div>
      <button type="button" class="pf-refresh-btn" @click="$emit('refresh')">↻ REFRESH SIZES</button>
    </div>

    <div v-if="!data.scenarios_available && scenario !== 'normal'" class="pf-scenario-warn">
      {{ UNAVAILABLE_COMPUTE }} — scenario budgets require portfolio sizer API (STRESS / LOW VOL not wired).
    </div>

    <div class="pf-alloc-inner">
      <div class="pf-al-scroll">
        <PortfolioClusterCard
          v-for="cluster in data.clusters"
          :key="cluster.id"
          :data="data"
          :cluster="cluster"
        />
        <div v-if="!data.clusters.length" class="pf-empty-msg">No allocation clusters returned from API.</div>
      </div>
      <PortfolioAllocSummary :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UNAVAILABLE_COMPUTE } from '~/constants/unavailable'
import type { PortfolioResponse } from '~/types/api'
import { pfPct, pfUsd } from '~/utils/portfolio-display'

defineProps<{ data: PortfolioResponse }>()
defineEmits<{ refresh: [] }>()

const scenario = ref<'normal' | 'stress' | 'lowvol'>('normal')
</script>
