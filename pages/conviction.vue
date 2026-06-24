<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="conviction"
    @retry="refresh"
  >
    <div v-if="data" class="scroll cv-scroll">
      <div v-if="data.health.yieldTraps > 0" class="cv-alert-bar">
        <strong>{{ data.health.yieldTraps }} yield trap{{ data.health.yieldTraps > 1 ? 's' : '' }} active</strong>
        <span class="cv-alert-tickers">{{ data.health.yieldTrapTickers.join(', ') }}</span>
        <span class="cv-alert-msg">Dividend yield exceeds threshold — BUY cancelled regardless of quant signal.</span>
      </div>

      <div class="kr k4 cv-health">
        <div class="kc cv-health-card">
          <div class="kl">Conviction breakdown</div>
          <div class="cv-breakdown">
            <div v-for="tier in breakdownTiers" :key="tier.key" class="cv-bd-item">
              <div class="cv-bd-head">
                <span class="cv-bd-label" :class="tier.cls">{{ tier.label }}</span>
                <span class="cv-bd-val">{{ tier.count }} · {{ tier.pct }}%</span>
              </div>
              <div class="cv-bd-track">
                <div class="cv-bd-fill" :class="tier.cls" :style="{ width: `${tier.pct}%` }" />
              </div>
            </div>
          </div>
        </div>

        <KpiCard
          label="Yield traps"
          :value="String(data.health.yieldTraps)"
          :delta="yieldTrapDelta"
          :accent="data.health.yieldTraps > 0 ? 'r' : undefined"
          :delta-class="data.health.yieldTraps > 0 ? 'r' : undefined"
        />

        <KpiCard
          label="Avg conviction"
          :value="formatAvg(data.health.avgConviction)"
          :delta="`range: ${data.health.avgRange.min} to ${data.health.avgRange.max}`"
          :accent="avgAccent(data.health.avgConviction)"
          :delta-class="avgAccent(data.health.avgConviction)"
        />

        <div class="kc cv-health-card">
          <div class="kl">Business types · {{ data.health.equityCount }} equities</div>
          <div class="cv-btype-list">
            <div v-for="bt in data.health.businessTypes" :key="bt.type" class="cv-btype-row">
              <span class="cv-btype-name">{{ bt.type }}</span>
              <div class="cv-btype-track">
                <div
                  class="cv-btype-fill"
                  :style="{ width: `${btypePct(bt.count)}%`, background: bt.color }"
                />
              </div>
              <span class="cv-btype-count">{{ bt.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card cv-panel-card">
        <div v-if="isDepthView" class="cv-main-view">
          <ConvictionStatusChips
            :signals="data.signals"
            :selected-id="selectedId"
            @select="selectSignal"
          />
          <ConvictionDepthPanel
            :layer="navLayer"
            :detail="selectedDetail"
          />
        </div>

        <div v-else-if="mainView === 'signals'" class="cv-main-view">
          <ConvictionSignalsPanel
            :signals="data.signals"
            :selected-id="selectedId"
            :open-request="openRequest"
            @select="selectSignal"
            @fs-page="goFsPage"
          />
        </div>

        <div v-else-if="mainView === 'portfolio'" class="cv-main-view">
          <ConvictionPortfolioPanel :portfolio="data.portfolio" />
        </div>

        <div v-else-if="mainView === 'contradictions'" class="cv-main-view">
          <ConvictionContradictionsPanel :contradictions="data.contradictions" />
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

const DEPTH_LAYER_IDS = ['bq', 'val', 'fs', 'fd', 'yt'] as const
const DATA_VIEW_IDS = ['signals', 'portfolio', 'contradictions'] as const

type DataViewId = typeof DATA_VIEW_IDS[number]
type DepthLayerId = typeof DEPTH_LAYER_IDS[number]

const { data, pending, error, refresh } = useConviction()
const navActiveId = useState<string>('terminal-nav-id', () => 'signals')

const openRequest = ref<{ id: string; tab: 'bq' | 'fs' | 'fd' } | null>(null)
const selectedId = ref<string | null>(null)

const isDepthView = computed(() =>
  navActiveId.value === 'depth' || DEPTH_LAYER_IDS.includes(navActiveId.value as DepthLayerId),
)

const mainView = computed((): DataViewId => {
  const id = navActiveId.value
  if (DATA_VIEW_IDS.includes(id as DataViewId)) return id as DataViewId
  return 'signals'
})

const navLayer = computed((): DepthLayerId => {
  const id = navActiveId.value
  if (DEPTH_LAYER_IDS.includes(id as DepthLayerId)) return id as DepthLayerId
  return 'bq'
})

const selectedDetail = computed(() => {
  if (!selectedId.value || !data.value) return undefined
  return data.value.signals.find((s) => s.id === selectedId.value)?.detail
})

function selectSignal(id: string) {
  selectedId.value = id
  const row = data.value?.signals.find((s) => s.id === id)
  if (!row?.detail || isDepthView.value) return
  openRequest.value = {
    id,
    tab: navLayer.value === 'fs' ? 'fs' : navLayer.value === 'fd' ? 'fd' : 'bq',
  }
}

const yieldTrapDelta = computed(() => {
  const tickers = data.value?.health.yieldTrapTickers ?? []
  if (!tickers.length) return 'none active'
  return `${tickers.join(', ')} — threshold breached`
})

function formatAvg(n: number) {
  return n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1)
}

function avgAccent(avg: number) {
  if (avg >= 5) return 'g'
  if (avg >= 2) return 'amber'
  return 'r'
}

const breakdownTiers = computed(() => {
  const b = data.value?.health.breakdown
  if (!b) return []
  return [
    { key: 'max', label: 'MAX (≥+8)', cls: 'g', count: b.max.count, pct: b.max.pct },
    { key: 'tactical', label: 'TACTICAL (≥+5)', cls: 'g', count: b.tactical.count, pct: b.tactical.pct },
    { key: 'reduced', label: 'REDUCED (≥+2)', cls: 'a', count: b.reduced.count, pct: b.reduced.pct },
    { key: 'cancel', label: 'CANCEL (<+2)', cls: 'r', count: b.cancel.count, pct: b.cancel.pct },
  ]
})

function btypePct(count: number) {
  const max = Math.max(...(data.value?.health.businessTypes.map((b) => b.count) ?? [1]))
  return Math.round((count / max) * 100)
}

function goFsPage(ticker: string) {
  const row = data.value?.signals.find((s) => s.ticker === ticker && s.isEquity && s.detail)
  if (!row) return
  navActiveId.value = 'signals'
  openRequest.value = { id: row.id, tab: 'fs' }
}
</script>

<style scoped>
.cv-scroll {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.cv-main-view {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-width: 0;
  gap: 12px;
}
</style>
