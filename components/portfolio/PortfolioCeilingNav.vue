<template>
  <div v-if="data" class="pf-calcbox">
    <div
      v-for="(step, i) in data.ceiling.steps"
      :key="i"
      class="pf-cb-row"
    >
      <span class="pf-cb-key">{{ step.label }}</span>
      <span class="pf-cb-val" :class="step.tone ? `pf-cb-${step.tone}` : undefined">{{ step.value }}</span>
    </div>
    <div v-if="data.ceiling.steps.length" class="pf-cb-div" />
    <div class="pf-cb-row">
      <span class="pf-cb-key pf-cb-strong">Final equity ceiling</span>
      <span class="pf-cb-val pf-cb-gold">{{ pfPct(data, data.ceiling.final_ceiling_pct) }}</span>
    </div>
    <div class="pf-cb-row">
      <span class="pf-cb-key pf-cb-strong">Portfolio notional</span>
      <span class="pf-cb-val pf-cb-gold">{{ pfUsd(data, data.ceiling.portfolio_notional) }}</span>
    </div>
    <div class="pf-cb-row">
      <span class="pf-cb-key pf-cb-teal">Idle cash yield</span>
      <span class="pf-cb-val pf-cb-teal">{{ pfPct(data, data.ceiling.idle_cash_yield_pct) }}</span>
    </div>
    <div v-if="data.ceiling.note" class="pf-cb-note">{{ data.ceiling.note }}</div>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioResponse } from '~/types/api'
import { pfPct, pfUsd } from '~/utils/portfolio-display'

defineProps<{ data: PortfolioResponse | null }>()
</script>
