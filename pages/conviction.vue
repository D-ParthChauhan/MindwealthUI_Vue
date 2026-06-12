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
        <strong>{{ data.health.yieldTraps }} yield trap active:</strong>
        {{ data.health.yieldTrapTickers.join(', ') }} — dividend yield exceeds threshold. BUY cancelled regardless of quant signal. Click row to see detail.
      </div>

      <div class="kr k4 cv-health">
        <div class="kc">
          <div class="kl">Conviction breakdown</div>
          <div class="cv-breakdown">
            <div class="cv-bd-row">
              <span class="cv-bd-label g">MAX (≥+8)</span>
              <span class="cv-bd-val">{{ data.health.breakdown.max.count }} · {{ data.health.breakdown.max.pct }}%</span>
            </div>
            <div class="cv-bd-row">
              <span class="cv-bd-label g">TACTICAL (≥+5)</span>
              <span class="cv-bd-val">{{ data.health.breakdown.tactical.count }} · {{ data.health.breakdown.tactical.pct }}%</span>
            </div>
            <div class="cv-bd-row">
              <span class="cv-bd-label a">REDUCED (≥+2)</span>
              <span class="cv-bd-val">{{ data.health.breakdown.reduced.count }} · {{ data.health.breakdown.reduced.pct }}%</span>
            </div>
            <div class="cv-bd-row">
              <span class="cv-bd-label r">CANCEL (&lt;+2)</span>
              <span class="cv-bd-val">{{ data.health.breakdown.cancel.count }} · {{ data.health.breakdown.cancel.pct }}%</span>
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

        <div class="kc">
          <div class="kl">Business types ({{ data.health.equityCount }} equities)</div>
          <div class="cv-btype-list">
            <div v-for="bt in data.health.businessTypes" :key="bt.type" class="cv-btype-row">
              <div class="cv-btype-bar" :style="{ width: `${btypeBarWidth(bt.count)}px`, background: bt.color }" />
              <span>{{ bt.type }} {{ bt.count }}</span>
            </div>
          </div>
        </div>
      </div>

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

function btypeBarWidth(count: number) {
  const max = Math.max(...(data.value?.health.businessTypes.map((b) => b.count) ?? [1]))
  return Math.round((count / max) * 42) + 12
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
  min-width: 0;
}
.cv-main-view {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
</style>
