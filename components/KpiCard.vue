<template>
  <div class="kc" :class="accent">
    <div class="kl">{{ label }}</div>
    <div class="kv">{{ value }}</div>
    <div class="kd" :class="deltaClass">{{ delta }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  delta: string
  accent?: string
  deltaClass?: string
}>()
</script>
