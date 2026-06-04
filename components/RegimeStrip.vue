<template>
  <div class="rs">
    <div class="rsd" :class="dotClass" />
    <div class="rsl" :style="labelColor ? { color: labelColor } : undefined">
      {{ headline }}
    </div>
    <template v-for="(item, i) in items" :key="i">
      <div class="rssep" />
      <div class="rsi" v-html="item" />
    </template>
    <div v-if="right" class="rsr" v-html="right" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dotClass?: string
  headline: string
  labelColor?: string
  items?: string[]
  right?: string
}>()
</script>
