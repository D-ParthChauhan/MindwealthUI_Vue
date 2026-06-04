<template>
  <div v-if="cfg" class="terminal-page">
    <AppTopbar :active-tab="cfg.activeTab" :status="cfg.status" />
    <RegimeStrip v-if="route.path !== '/macro'" v-bind="cfg.regime" />
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
const { cfg, onNavSelect } = useTerminalLayout()
useNavbarShortcuts()
</script>
