<template>
  <div>
    <div v-if="isOpen" class="cp-backdrop" aria-hidden="true" @click="close" />
    <button
      v-show="!isOpen"
      type="button"
      class="cbtn"
      aria-label="Open AI Analyst"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="cbtn-glass" aria-hidden="true" />
      <span class="cbtn-icon" aria-hidden="true">💬</span>
      <span v-if="pendingAlert && !isOpen" class="cbtn-badge" aria-hidden="true" />
    </button>
    <AnalystPanelInner />
  </div>
</template>

<script setup lang="ts">
const { isOpen, pendingAlert, toggle, close } = useClaudePanel()
</script>
