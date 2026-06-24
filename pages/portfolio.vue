<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="portfolio"
    @retry="refreshAll"
  >
    <div v-if="data" class="pf-shell">
      <div class="main pf-page">
      <PortfolioSizedAllocView
        v-if="mainView === 'sized'"
        v-model:scenario="scenario"
        :data="data"
        @refresh="refreshAll"
      />
      <PortfolioRiskView
        v-else-if="mainView === 'risk'"
        :data="data"
        :risk-data="riskData"
        :risk-pending="riskPending"
        :risk-error="riskError"
        :scenario="scenario"
        @refresh-risk="refreshRisk"
      />
      <PortfolioPnlView
        v-else-if="mainView === 'pnl'"
        :data="data"
      />
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
import type { PortfolioScenario } from '~/types/api'

definePageMeta({ layout: 'terminal' })

const PORTFOLIO_VIEWS = ['sized', 'risk', 'pnl'] as const
type PortfolioViewId = typeof PORTFOLIO_VIEWS[number]

const scenario = ref<PortfolioScenario>('normal')
const { fetchPortfolio, fetchPortfolioRisk } = useApi()
const { data, pending, error, refresh } = fetchPortfolio(scenario)
const {
  data: riskData,
  pending: riskPending,
  error: riskFetchError,
  refresh: refreshRisk,
} = fetchPortfolioRisk(scenario)
const navActiveId = useState<string>('terminal-nav-id', () => 'sized')

const mainView = computed((): PortfolioViewId => {
  const id = navActiveId.value
  if (PORTFOLIO_VIEWS.includes(id as PortfolioViewId)) return id as PortfolioViewId
  return 'sized'
})

const riskError = computed(() => {
  if (riskFetchError.value) {
    const err = riskFetchError.value as { data?: { message?: string }; message?: string }
    return err.data?.message ?? err.message ?? 'Risk API request failed'
  }
  if (riskData.value && !riskData.value.matrix.length) {
    return 'Correlation matrix unavailable from API'
  }
  return null
})

function refreshAll() {
  refresh()
  refreshRisk()
}
</script>
