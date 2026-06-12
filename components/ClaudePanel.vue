<template>
  <div>
    <div v-if="isOpen" class="cp-backdrop" aria-hidden="true" @click="close" />
    <button
      type="button"
      class="cbtn"
      :class="{ pulse: pendingAlert && !isOpen }"
      aria-label="AI Analyst"
      @click="toggle"
    >
      💬
      <div class="nb" :class="{ show: pendingAlert && !isOpen }" />
    </button>
    <AnalystPanelInner />
  </div>
</template>

<script setup lang="ts">
const { isOpen, pendingAlert, toggle, close } = useClaudePanel()
</script>
