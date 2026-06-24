<template>
  <div class="pf-view pf-view-risk">
    <div class="pf-risk-inner">
      <div class="pf-rscroll">
        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Correlation — by investment type</div>
            <div class="pf-card-sub">Requires portfolio risk API</div>
          </div>
          <div class="pf-risk-error">
            <div class="pf-risk-error-title">Correlation matrix unavailable</div>
            <div class="pf-risk-error-body">{{ riskMessage }}</div>
          </div>
        </div>

        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Cluster weight vs ceiling</div>
          </div>
          <div class="pf-sect-list">
            <div
              v-for="cluster in data.clusters"
              :key="cluster.id"
              class="pf-sect-row"
            >
              <div class="pf-sect-name">{{ cluster.label }}</div>
              <div class="pf-sect-track">
                <div
                  class="pf-sect-fill"
                  :style="{
                    width: cluster.deployed_pct != null ? `${Math.min(100, cluster.deployed_pct)}%` : '0%',
                    background: 'var(--green)',
                  }"
                />
              </div>
              <div class="pf-sect-pct">{{ pfPct(data, cluster.deployed_pct) }}</div>
            </div>
            <div v-if="!data.clusters.length" class="pf-empty-msg">No cluster weights — investment type budgets require sizer API.</div>
          </div>
        </div>

        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Actions required</div>
          </div>
          <div class="pf-act-list">
            <div
              v-for="(check, i) in data.constraints"
              :key="i"
              class="pf-act"
              :class="check.level === 'bad' ? 'red' : check.level === 'warn' ? 'gold' : 'green'"
            >
              <div class="pf-act-ico">{{ check.level === 'ok' ? '✓' : '⚠' }}</div>
              <div>
                <div class="pf-act-title">{{ check.title }}</div>
                <div class="pf-act-body">{{ check.body }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="pf-rpanel">
        <div class="pf-ep-hd">
          <div class="pf-ep-title">ENTER MY PORTFOLIO</div>
          <div class="pf-ep-hint">Requires user portfolio + risk API</div>
        </div>
        <div class="pf-ep-body">
          <div class="pf-risk-error pf-ep-error">
            <div class="pf-risk-error-title">Holdings entry unavailable</div>
            <div class="pf-risk-error-body">
              Ticker search, custom holdings, and RUN RISK ANALYSIS need a backend endpoint.
              Current API v1.4 exposes virtual-trading book only.
            </div>
          </div>
        </div>
        <div class="pf-run-btn pf-run-btn-disabled">RUN RISK ANALYSIS →</div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioResponse } from '~/types/api'
import { pfPct } from '~/utils/portfolio-display'

const props = defineProps<{
  data: PortfolioResponse
  riskError?: string | null
}>()

const riskMessage = computed(
  () => props.riskError ?? props.data.risk.message ?? 'Portfolio correlation endpoint not implemented.',
)
</script>
