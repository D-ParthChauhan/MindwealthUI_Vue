<template>
  <div class="pf-view pf-view-risk">
    <div class="pf-risk-inner">
      <div class="pf-rscroll">
        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Correlation — by investment type</div>
            <div v-if="riskData?.correlation_meta" class="pf-card-sub">
              {{ riskData.correlation_meta.window_days }}d · {{ riskData.correlation_meta.source }}
            </div>
          </div>
          <div v-if="riskPending" class="pf-risk-error">
            <div class="pf-risk-error-body">Loading correlation matrix…</div>
          </div>
          <div v-else-if="!hasMatrix" class="pf-risk-error">
            <div class="pf-risk-error-title">Correlation matrix unavailable</div>
            <div class="pf-risk-error-body">{{ riskMessage }}</div>
          </div>
          <div v-else class="pf-corr-wrap">
            <table class="pf-corr-tbl">
              <thead>
                <tr>
                  <th />
                  <th
                    v-for="(label, j) in riskData!.labels"
                    :key="`h-${j}`"
                    :title="clusterLabel(label)"
                  >
                    {{ shortLabel(clusterLabel(label)) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rowLabel, i) in riskData!.labels" :key="`r-${i}`">
                  <th :title="clusterLabel(rowLabel)">{{ shortLabel(clusterLabel(rowLabel)) }}</th>
                  <td
                    v-for="(rho, j) in riskData!.matrix[i]"
                    :key="`c-${i}-${j}`"
                    :class="cellClass(rho, i === j)"
                    :title="`${clusterLabel(rowLabel)} × ${clusterLabel(riskData!.labels[j])}: ρ ${rho.toFixed(2)}`"
                  >
                    {{ rho.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="riskData?.correlation_meta.proxies" class="pf-corr-proxies">
              ETF proxies:
              <span
                v-for="(proxy, id) in riskData.correlation_meta.proxies"
                :key="id"
                class="pf-corr-proxy"
              >{{ shortLabel(clusterLabel(id)) }}={{ proxy }}</span>
            </div>
          </div>
        </div>

        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Cluster weight vs ceiling</div>
            <div v-if="scenario" class="pf-card-sub">{{ scenario.toUpperCase() }}</div>
          </div>
          <div class="pf-sect-list">
            <div
              v-for="cluster in clusterWeights"
              :key="cluster.cluster_id"
              class="pf-sect-row"
            >
              <div class="pf-sect-name">{{ cluster.label }}</div>
              <div class="pf-sect-track">
                <div
                  class="pf-sect-fill"
                  :style="{
                    width: cluster.max_pct > 0
                      ? `${Math.min(100, (cluster.deployed_pct / cluster.max_pct) * 100)}%`
                      : '0%',
                    background: cluster.deployed_pct / cluster.max_pct > 0.9 ? 'var(--amber)' : 'var(--green)',
                  }"
                />
              </div>
              <div class="pf-sect-pct">
                {{ cluster.deployed_pct.toFixed(1) }}% / {{ cluster.max_pct.toFixed(0) }}%
              </div>
            </div>
            <div v-if="!clusterWeights.length" class="pf-empty-msg">No cluster weights returned.</div>
          </div>
        </div>

        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Correlation breaches</div>
            <div class="pf-card-sub">
              watch &gt; {{ watchThreshold }} · action &gt; {{ actionThreshold }}
            </div>
          </div>
          <div class="pf-act-list">
            <div v-if="!breaches.length" class="pf-empty-msg">No correlation breaches above watch threshold.</div>
            <div
              v-for="(breach, i) in breaches"
              :key="i"
              class="pf-act"
              :class="breach.level === 'action' ? 'red' : 'gold'"
            >
              <div class="pf-act-ico">⚠</div>
              <div>
                <div class="pf-act-title">
                  {{ breach.pair_labels.join(' × ') }} · ρ {{ breach.rho.toFixed(2) }}
                  <span class="pf-act-level">({{ breach.level }})</span>
                </div>
                <div class="pf-act-body">
                  Combined {{ breach.combined_weight_pct.toFixed(1) }}%
                  ({{ formatUsd(breach.combined_weight_usd) }}) vs cap {{ breach.cap_pct }}%.
                  <span v-if="breach.recommendation">{{ breach.recommendation }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card pf-risk-card">
          <div class="card-hd pf-card-hd">
            <div class="pf-card-title">Model constraint checks</div>
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
          <div class="pf-ep-hint">vs model book</div>
        </div>
        <div class="pf-ep-body">
          <div class="pf-ep-search-wrap">
            <input
              v-model="searchQuery"
              type="text"
              class="pf-ep-input"
              placeholder="Search ticker (e.g. NVD)"
              autocomplete="off"
              @input="onSearchInput"
            />
            <div v-if="searchResults.length" class="pf-ep-suggest">
              <button
                v-for="hit in searchResults"
                :key="hit.symbol"
                type="button"
                class="pf-ep-suggest-item"
                @click="addHolding(hit.symbol)"
              >
                <span class="sym">{{ hit.symbol }}</span>
                <span class="name">{{ hit.name }}</span>
              </button>
            </div>
          </div>

          <div v-if="holdings.length" class="pf-ep-holdings">
            <div v-for="(h, i) in holdings" :key="h.symbol" class="pf-ep-row">
              <span class="pf-ep-sym">{{ h.symbol }}</span>
              <input
                v-model.number="h.quantity"
                type="number"
                min="0"
                step="any"
                class="pf-ep-qty"
                placeholder="Qty"
              />
              <button type="button" class="pf-ep-rm" @click="removeHolding(i)">×</button>
            </div>
          </div>
          <div v-else class="pf-ep-empty">Add tickers to analyze concentration vs model.</div>

          <div class="pf-ep-cash">
            <span class="pf-ep-cash-lbl">Cash USD</span>
            <input v-model.number="cashUsd" type="number" min="0" step="any" class="pf-ep-cash-inp" />
          </div>

          <div v-if="analyzeError" class="pf-risk-error pf-ep-error">
            <div class="pf-risk-error-body">{{ analyzeError }}</div>
          </div>

          <div v-if="analyzeResult" class="pf-ep-results">
            <div class="pf-ep-res-hd">
              {{ formatUsd(analyzeResult.total_notional_usd) }} total · {{ analyzeResult.position_count }} positions
            </div>
            <div
              v-for="(w, i) in analyzeResult.concentration_warnings"
              :key="`cw-${i}`"
              class="pf-ep-warn"
            >
              {{ w.action }}
            </div>
            <div
              v-for="(b, i) in analyzeResult.correlation_breaches"
              :key="`cb-${i}`"
              class="pf-ep-warn pf-ep-warn-corr"
            >
              {{ b.recommendation }}
            </div>
            <div v-if="!analyzeResult.concentration_warnings.length && !analyzeResult.correlation_breaches.length" class="pf-ep-ok">
              No concentration or correlation warnings.
            </div>
          </div>
        </div>
        <button
          type="button"
          class="pf-run-btn"
          :class="{ 'pf-run-btn-disabled': !canAnalyze || analyzing }"
          :disabled="!canAnalyze || analyzing"
          @click="runAnalysis"
        >
          {{ analyzing ? 'ANALYZING…' : 'RUN RISK ANALYSIS →' }}
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  PortfolioAnalyzeResponse,
  PortfolioResponse,
  PortfolioRiskResponse,
  PortfolioScenario,
  PortfolioTickerSearchResult,
} from '~/types/api'

const props = defineProps<{
  data: PortfolioResponse
  riskData?: PortfolioRiskResponse | null
  riskPending?: boolean
  riskError?: string | null
  scenario?: PortfolioScenario
}>()

defineEmits<{ refreshRisk: [] }>()

const { searchPortfolioTickers, analyzePortfolioHoldings } = useApi()

const searchQuery = ref('')
const searchResults = ref<PortfolioTickerSearchResult[]>([])
const holdings = ref<Array<{ symbol: string; quantity: number }>>([])
const cashUsd = ref(0)
const analyzing = ref(false)
const analyzeError = ref<string | null>(null)
const analyzeResult = ref<PortfolioAnalyzeResponse | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const labelMap = computed(() => {
  const map = new Map<string, string>()
  for (const c of props.data.clusters) map.set(c.id, c.label)
  for (const w of props.riskData?.cluster_weights ?? []) map.set(w.cluster_id, w.label)
  return map
})

const hasMatrix = computed(
  () => (props.riskData?.matrix.length ?? 0) > 0 && (props.riskData?.labels.length ?? 0) > 0,
)

const riskMessage = computed(
  () => props.riskError ?? props.data.risk.message ?? 'Portfolio correlation endpoint not available.',
)

const clusterWeights = computed(() => {
  if (props.riskData?.cluster_weights?.length) return props.riskData.cluster_weights
  return props.data.clusters
    .filter((c) => c.deployed_pct != null && c.max_pct != null)
    .map((c) => ({
      cluster_id: c.id,
      label: c.label,
      deployed_pct: c.deployed_pct!,
      max_pct: c.max_pct!,
    }))
})

const breaches = computed(() => props.riskData?.breaches ?? [])
const watchThreshold = computed(() => props.riskData?.breach_threshold_watch ?? 0.75)
const actionThreshold = computed(() => props.riskData?.breach_threshold_action ?? 0.85)

const canAnalyze = computed(() => holdings.value.some((h) => h.symbol && h.quantity > 0))

function clusterLabel(id: string): string {
  return labelMap.value.get(id) ?? id.replace(/_/g, ' ')
}

function shortLabel(label: string): string {
  const words = label.split(/\s+/)
  if (words.length <= 2) return label
  return words.map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function cellClass(rho: number, diagonal: boolean): string {
  if (diagonal) return 'pf-corr-diag'
  if (rho > actionThreshold.value) return 'pf-corr-action'
  if (rho > watchThreshold.value) return 'pf-corr-watch'
  return ''
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (q.length < 1) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await searchPortfolioTickers(q, 8)
    } catch {
      searchResults.value = []
    }
  }, 250)
}

function addHolding(symbol: string) {
  const sym = symbol.toUpperCase()
  if (holdings.value.some((h) => h.symbol === sym)) return
  holdings.value.push({ symbol: sym, quantity: 0 })
  searchQuery.value = ''
  searchResults.value = []
  analyzeResult.value = null
  analyzeError.value = null
}

function removeHolding(index: number) {
  holdings.value.splice(index, 1)
  analyzeResult.value = null
}

async function runAnalysis() {
  analyzing.value = true
  analyzeError.value = null
  analyzeResult.value = null
  try {
    analyzeResult.value = await analyzePortfolioHoldings({
      holdings: holdings.value
        .filter((h) => h.symbol && h.quantity > 0)
        .map((h) => ({ symbol: h.symbol, quantity: h.quantity })),
      cash_usd: cashUsd.value || 0,
    })
  } catch (e) {
    const err = e as { data?: { message?: string }; message?: string }
    analyzeError.value = err.data?.message ?? err.message ?? 'Analysis failed'
  } finally {
    analyzing.value = false
  }
}
</script>
