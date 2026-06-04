<template>
  <div v-if="pending" class="data-state">
    <div class="data-state-msg">Loading {{ label }}…</div>
  </div>
  <div v-else-if="error" class="data-state data-state-err">
    <div class="data-state-msg">Failed to load {{ label }}</div>
    <button type="button" class="data-retry" @click="$emit('retry')">Retry</button>
  </div>
  <div v-else-if="empty" class="data-state">
    <div class="data-state-msg">No data available</div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
defineProps<{
  pending?: boolean
  error?: unknown
  empty?: boolean
  label?: string
}>()

defineEmits<{ retry: [] }>()
</script>

<style scoped>
.data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 120px;
  gap: 10px;
}
.data-state-msg {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t3);
  letter-spacing: 1px;
}
.data-state-err .data-state-msg { color: var(--red); }
.data-retry {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--b3);
  background: var(--s2);
  color: var(--gold);
  cursor: pointer;
}
</style>
