<template>
  <span class="dir" :class="direction === 'LONG' ? 'L' : 'S'">{{ direction }}</span>
</template>

<script setup lang="ts">
defineProps<{ direction: 'LONG' | 'SHORT' }>()
</script>
