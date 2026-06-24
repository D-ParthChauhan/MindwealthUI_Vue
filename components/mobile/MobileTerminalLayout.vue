<template>
  <div class="m-terminal">
    <MobileHeader
      :title="pageTitle"
      :status="cfg.status"
    />
    <RegimeStrip
      v-bind="cfg.regime"
      compact
      class="m-regime"
    >
      <template v-if="showSignalsInterval" #trailing>
        <SignalsIntervalSelect />
      </template>
    </RegimeStrip>
    <MobileSubNav
      :groups="cfg.navGroups"
      :active-id="cfg.navActiveId"
      :multi-active-ids="cfg.multiActiveIds"
      @select="onNavSelect"
    />
    <details v-if="showPortfolioFlags" class="m-widget-flags">
      <summary class="m-widget-flags-summary">Flag guide</summary>
      <PortfolioFlagLegend />
    </details>
    <div class="m-content">
      <slot />
    </div>
    <div v-if="cfg.agentItems.length" class="m-agent" aria-label="Agent status">
      <div
        v-for="(item, i) in cfg.agentItems"
        :key="i"
        class="m-agent-item"
        :class="{ 'm-agent-item-right': item.right }"
      >
        <span class="m-agent-dot" :class="item.dot" />
        <span class="m-agent-label">{{ item.label }}</span>
      </div>
    </div>
    <MobileBottomNav :active-tab="cfg.activeTab" />
    <FunctionDetailPopup />
  </div>
</template>

<script setup lang="ts">
import { MAIN_TABS } from '~/constants/navigation'
import type { TerminalPageConfig } from '~/constants/terminal-configs'

const props = defineProps<{
  cfg: TerminalPageConfig
  onNavSelect: (id: string) => void
  showSignalsInterval?: boolean
}>()

const route = useRoute()

const pageTitle = computed(() => {
  const tab = MAIN_TABS.find((t) => t.id === props.cfg.activeTab)
  return tab?.label.split('·')[0]?.trim() ?? 'Terminal'
})

const showPortfolioFlags = computed(() => route.path === '/portfolio')
</script>
