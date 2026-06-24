<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="portfolio"
    @retry="refresh"
  >
    <div v-if="data" class="main pf-page">
      <PortfolioSizedAllocView
        v-if="mainView === 'sized'"
        :data="data"
        @refresh="refresh"
      />
      <PortfolioRiskView
        v-else-if="mainView === 'risk'"
        :data="data"
        :risk-error="riskError"
      />
      <PortfolioPnlView
        v-else-if="mainView === 'pnl'"
        :data="data"
      />
    </div>
  </DataState>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

const PORTFOLIO_VIEWS = ['sized', 'risk', 'pnl'] as const
type PortfolioViewId = typeof PORTFOLIO_VIEWS[number]

const { fetchPortfolio } = useApi()
const { data, pending, error, refresh } = fetchPortfolio()
const navActiveId = useState<string>('terminal-nav-id', () => 'sized')

const { data: riskProbe, error: riskProbeError } = useFetch<{ message?: string }>(
  '/api/portfolio/risk',
  { key: 'api-portfolio-risk' },
)

const mainView = computed((): PortfolioViewId => {
  const id = navActiveId.value
  if (PORTFOLIO_VIEWS.includes(id as PortfolioViewId)) return id as PortfolioViewId
  return 'sized'
})

const riskError = computed(() => {
  if (riskProbeError.value) {
    const err = riskProbeError.value as { data?: { message?: string }; message?: string }
    return err.data?.message ?? err.message ?? 'Risk API request failed'
  }
  return riskProbe.value?.message ?? null
})
</script>
