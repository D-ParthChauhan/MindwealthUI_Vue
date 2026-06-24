<template>
  <aside class="pf-al-side">
    <div class="pf-sp-lbl">Portfolio summary</div>
    <div class="pf-sp-big">{{ pfUsd(data, data.summary.deployed_usd) }}</div>
    <div class="pf-sp-sub">
      deployed
      <span v-if="data.summary.deployed_pct != null"> · {{ data.summary.deployed_pct }}%</span>
      <span v-if="data.ceiling.portfolio_notional != null">
        of {{ pfUsd(data, data.ceiling.portfolio_notional) }}
      </span>
    </div>
    <div class="pf-dbar">
      <div
        class="pf-dbar-fill"
        :style="{ width: data.summary.deployed_pct != null ? `${Math.min(100, data.summary.deployed_pct)}%` : '0%' }"
      />
    </div>

    <div
      v-for="cluster in data.clusters"
      :key="cluster.id"
      class="pf-sr"
    >
      <span class="k">{{ cluster.label }}</span>
      <span class="v">{{ pfUsd(data, cluster.deployed_usd) }}</span>
    </div>

    <div class="pf-sdiv" />
    <div class="pf-wfall">
      <div class="pf-sp-lbl" style="margin-bottom:6px">Cash breakdown</div>
      <div class="pf-wf-row">
        <span class="k">Total portfolio</span>
        <span class="v">{{ pfUsd(data, data.ceiling.portfolio_notional) }}</span>
      </div>
      <div class="pf-wf-row">
        <span class="k">− Equities deployed</span>
        <span class="v">{{ pfUsd(data, data.summary.deployed_usd) }}</span>
      </div>
      <div class="pf-wf-tot">
        <div class="pf-wf-row">
          <span class="k">= Cash</span>
          <span class="v">{{ pfUsd(data, data.summary.cash_usd) }}</span>
        </div>
      </div>
      <div class="pf-wf-row" style="margin-top:4px">
        <span class="k pf-cb-teal">Idle income</span>
        <span class="v pf-cb-teal">{{ pfUsd(data, data.summary.idle_income_usd) }}/yr</span>
      </div>
    </div>

    <div class="pf-sdiv" />
    <div class="pf-sp-lbl">Constraint checks</div>
    <div
      v-for="(check, i) in data.constraints"
      :key="i"
      class="pf-con-row"
      :class="`c-${check.level === 'bad' ? 'bad' : check.level === 'warn' ? 'warn' : 'ok'}`"
    >
      <span class="ico">{{ check.level === 'ok' ? '✓' : '⚠' }}</span>
      <div class="txt"><b>{{ check.title }}:</b> {{ check.body }}</div>
    </div>

    <div class="pf-sdiv" />
    <div class="pf-sp-lbl">Sizing rules</div>
    <div class="pf-sizing-rules">
      BQ ≥+8 → MAX · 100% of investment type share<br>
      BQ +5–7 → TACTICAL · 75%<br>
      BQ +2–4 → REDUCED · 40%<br>
      BQ &lt;+2 → BLOCKED · 0%<br>
      <span class="pf-rule-g">FD+ → Upsize +10 percentage points</span><br>
      <span class="pf-rule-r">FD− → Downsize −15 percentage points</span><br>
      <span class="pf-rule-b">MULTI-SIG → +10% ranking boost within investment type</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PortfolioResponse } from '~/types/api'
import { pfUsd } from '~/utils/portfolio-display'

defineProps<{ data: PortfolioResponse }>()
</script>
