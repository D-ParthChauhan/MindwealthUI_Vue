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
    />
    <MobileSubNav
      :groups="cfg.navGroups"
      :active-id="cfg.navActiveId"
      @select="onNavSelect"
    />
    <div class="m-content">
      <slot />
    </div>
    <MobileBottomNav :active-tab="cfg.activeTab" />
  </div>
</template>

<script setup lang="ts">
import { MAIN_TABS } from '~/constants/navigation'
import type { TerminalPageConfig } from '~/constants/terminal-configs'

const props = defineProps<{
  cfg: TerminalPageConfig
  onNavSelect: (id: string) => void
}>()

const pageTitle = computed(() => {
  const tab = MAIN_TABS.find((t) => t.id === props.cfg.activeTab)
  return tab?.label.split('·')[0]?.trim() ?? 'Terminal'
})
</script>
