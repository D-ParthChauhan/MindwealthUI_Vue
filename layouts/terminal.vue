<template>
  <MobileTerminalLayout
    v-if="cfg && isMobile"
    :cfg="cfg"
    :on-nav-select="onNavSelect"
    :show-signals-interval="showSignalsInterval"
  >
    <slot />
  </MobileTerminalLayout>
  <div v-else-if="cfg" class="terminal-page">
    <AppTopbar :active-tab="cfg.activeTab" :status="cfg.status" />
    <RegimeStrip v-bind="cfg.regime" :macro="route.path === '/macro'">
      <template v-if="showSignalsInterval" #trailing>
        <SignalsIntervalSelect />
      </template>
    </RegimeStrip>
    <div class="body">
      <SideNav
        :title="cfg.navTitle"
        :groups="cfg.navGroups"
        :active-id="cfg.navActiveId"
        :multi-active-ids="cfg.multiActiveIds"
        @select="onNavSelect"
      >
        <template v-if="showSignalsDisplayMode" #signals-display-mode>
          <SignalsDisplayModeSelect />
        </template>
        <template v-if="route.path === '/portfolio'" #portfolio-ceiling>
          <PortfolioCeilingNav :data="portfolioSidebarData" />
        </template>
        <template v-if="route.path === '/portfolio'" #portfolio-flags>
          <PortfolioFlagLegend />
        </template>
      </SideNav>
      <slot />
    </div>
    <AgentBar :items="cfg.agentItems" />
    <FunctionDetailPopup />
  </div>
</template>

<script setup lang="ts">
import { SIGNAL_LIST_NAV_IDS } from '~/utils/signal-filters'

const route = useRoute()
const isMobile = useIsMobile()
const { cfg, onNavSelect } = useTerminalLayout()
const navActiveId = useState<string>('terminal-nav-id', () => 'outstanding')

const showSignalsInterval = computed(
  () => route.path === '/signals' && SIGNAL_LIST_NAV_IDS.has(navActiveId.value),
)

const showSignalsDisplayMode = computed(
  () => route.path === '/signals' && SIGNAL_LIST_NAV_IDS.has(navActiveId.value),
)

const { data: portfolioSidebarData } = useFetch<import('~/types/api').PortfolioResponse>(
  '/api/portfolio',
  { key: 'api-portfolio' },
)

useNavbarShortcuts()
</script>
