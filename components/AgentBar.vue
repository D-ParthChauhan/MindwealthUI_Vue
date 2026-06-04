<template>
  <div class="ab">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="abi"
      :style="item.right ? { marginLeft: 'auto' } : undefined"
    >
      <div class="abd" :class="item.dot" />
      {{ item.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ dot: string; label: string; right?: boolean }>
}>()
</script>
