<template>
  <div class="rs" :class="{ 'rs-compact': compact, 'rs-macro': macro }">
    <div class="rsd" :class="dotClass" />
    <div class="rsl" :style="labelColor ? { color: labelColor } : undefined">
      {{ headline }}
    </div>
    <div v-if="macro" class="rs-mid">
      <template v-for="(item, i) in items" :key="i">
        <div class="rssep" />
        <div class="rsi" v-html="item" />
      </template>
    </div>
    <template v-else>
      <template v-for="(item, i) in items" :key="i">
        <div class="rssep" />
        <div class="rsi" v-html="item" />
      </template>
    </template>
    <div v-if="right || $slots.trailing" class="rs-tail">
      <div v-if="right" class="rsr" v-html="right" />
      <slot name="trailing" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dotClass?: string
  headline: string
  labelColor?: string
  items?: string[]
  right?: string
  compact?: boolean
  macro?: boolean
}>()
</script>
