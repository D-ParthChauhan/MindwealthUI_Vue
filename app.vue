<template>
  <div class="app-shell">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClaudePanel v-if="!isOverwatchPage" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
useIsMobile()
const isOverwatchPage = computed(() => route.path === '/overwatch')
</script>
