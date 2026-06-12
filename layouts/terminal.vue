<template>
  <MobileTerminalLayout
    v-if="cfg && isMobile"
    :cfg="cfg"
    :on-nav-select="onNavSelect"
  >
    <slot />
  </MobileTerminalLayout>
  <div v-else-if="cfg" class="terminal-page">
    <AppTopbar :active-tab="cfg.activeTab" :status="cfg.status" />
    <RegimeStrip v-bind="cfg.regime" :compact="route.path === '/macro'" />
    <div class="body">
      <SideNav
        :title="cfg.navTitle"
        :groups="cfg.navGroups"
        :active-id="cfg.navActiveId"
        @select="onNavSelect"
      />
      <slot />
    </div>
    <AgentBar :items="cfg.agentItems" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isMobile = useIsMobile()
const { cfg, onNavSelect } = useTerminalLayout()
useNavbarShortcuts()
</script>
