<template>
  <label class="signals-interval">
    <span class="signals-interval-label">Interval</span>
    <select v-model="intervalFilter" class="signals-interval-select">
      <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { SIGNAL_INTERVAL_OPTIONS } from '~/utils/signal-filters'

const { intervalFilter } = useSignalFilters()
const intervalOptions = SIGNAL_INTERVAL_OPTIONS
</script>

<style scoped>
.signals-interval {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.signals-interval-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.6px;
  color: var(--t3);
  text-transform: uppercase;
}
.signals-interval-select {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t2);
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 3px;
  padding: 2px 6px;
  height: 22px;
  min-width: 108px;
  cursor: pointer;
}
.signals-interval-select:focus {
  outline: none;
  border-color: rgba(201, 168, 76, 0.35);
  color: var(--t1);
}
</style>
