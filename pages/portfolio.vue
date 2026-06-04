<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="portfolio"
    @retry="refresh"
  >
    <div v-if="data" class="main">
      <div class="card shrink">
        <div class="ct" style="margin-bottom:10px">Regime Budget Controls — Override Defaults</div>
        <div class="slider-wrap">
          <label>MAX DEPLOY %</label>
          <input v-model.number="maxDeploy" type="range" min="50" max="95" step="5" />
          <div class="slider-val">{{ maxDeploy }}%</div>
        </div>
        <div class="slider-wrap">
          <label>MAX SIGNALS PER CLUSTER</label>
          <input v-model.number="maxPerCluster" type="range" min="1" max="5" step="1" />
          <div class="slider-val">{{ maxPerCluster }}</div>
        </div>
        <div class="slider-hint">
          VIX {{ data.regime.vix }} ({{ data.regime.vix_pct }}th pct) → {{ data.regime.regime }}.
          API ceiling {{ data.regime.final_ceiling }}% · SSI {{ data.regime.ssi_multiplier }}× · credit {{ data.regime.credit_adj }}×.
        </div>
      </div>

      <div class="card shrink">
        <div class="ct" style="margin-bottom:8px">Cluster Budget Allocation — {{ data.regime.regime }} Regime · $500,000 portfolio</div>
        <div class="cluster-bar">
          <div
            v-for="seg in data.clusters"
            :key="seg.id"
            class="cb-seg"
            :style="{ width: seg.pct + '%', background: seg.color }"
          />
        </div>
        <div class="cluster-legend">
          <div v-for="seg in data.clusters" :key="seg.id" class="legend-item">
            <div class="legend-swatch" :style="{ background: seg.color }" />
            {{ seg.id }} {{ seg.pct }}%
          </div>
        </div>
      </div>

      <div class="card positions-card">
        <div class="ct" style="margin-bottom:8px">
          Sized Positions — {{ data.regime.regime }} Regime · {{ maxDeploy }}% Deploy · ${{ allocated.toLocaleString() }} allocated of $500,000
        </div>
        <div class="positions-scroll">
          <div
            v-for="pos in data.positions"
            :key="pos.ticker"
            class="alloc-row"
            :style="pos.excluded ? { opacity: 0.4, borderColor: 'rgba(192,57,43,0.2)' } : undefined"
          >
            <div class="ar-cluster" :style="pos.excluded ? { color: 'var(--red)' } : undefined">{{ pos.cluster }}</div>
            <div class="ar-ticker">{{ pos.ticker }}</div>
            <div class="ar-dir">
              <DirectionBadge :direction="pos.direction === 'Short' ? 'SHORT' : 'LONG'" />
            </div>
            <div class="pos-meta">{{ pos.meta }}</div>
            <div class="ar-dollar" :style="pos.excluded ? { color: 'var(--t4)' } : undefined">
              ${{ pos.dollar.toLocaleString() }}
            </div>
            <div class="ar-pct" :style="pos.excluded ? { color: 'var(--t4)' } : undefined">{{ pos.pct }}%</div>
          </div>
          <div class="alloc-totals">
            <div>TOTAL DEPLOYED: <span class="green">${{ data.totals.deployed.toLocaleString() }} ({{ data.totals.deployed_pct }}%)</span></div>
            <div>CASH HELD: <span class="teal">${{ data.totals.cash.toLocaleString() }} ({{ data.totals.cash_pct }}%)</span></div>
            <div>IDLE CASH EARNS: <span class="gold">{{ data.totals.idle_cash_yield }}% p.a.</span></div>
          </div>
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

const { fetchPortfolio } = useApi()
const { data, pending, error, refresh } = fetchPortfolio()

const maxDeploy = ref(72)
const maxPerCluster = ref(3)

watch(
  () => data.value?.regime.final_ceiling,
  (ceiling) => {
    if (ceiling != null) maxDeploy.value = ceiling
  },
  { immediate: true },
)

const allocated = computed(() => Math.round(500000 * (maxDeploy.value / 100)))
</script>

<style scoped>
.shrink { flex-shrink: 0; }
.slider-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
}
.cluster-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
}
.legend-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.positions-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.positions-scroll { overflow-y: auto; flex: 1; }
.pos-meta {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
}
.alloc-totals {
  padding: 8px 12px;
  background: var(--s2);
  border: 1px solid var(--b1);
  border-radius: 5px;
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t2);
}
.green { color: var(--green); }
.teal { color: var(--teal); }
.gold { color: var(--gold); }
</style>
