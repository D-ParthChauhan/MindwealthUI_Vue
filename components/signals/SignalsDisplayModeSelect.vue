<template>
  <div class="signals-display-mode">
    <label class="signals-display-mode-label" for="signals-display-mode-select">Display</label>
    <select
      id="signals-display-mode-select"
      v-model="displayMode"
      class="signals-display-mode-select"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { SIGNAL_DISPLAY_MODE_OPTIONS, useSignalDisplayMode } from '~/composables/useSignalDisplayMode'

const { displayMode } = useSignalDisplayMode()
const options = SIGNAL_DISPLAY_MODE_OPTIONS
</script>

<style scoped>
.signals-display-mode {
  padding: 0 8px 12px 2px;
  margin-top: -2px;
}
.signals-display-mode-label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 2px;
  color: var(--t3);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.signals-display-mode-select {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t2);
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 3px;
  padding: 5px 8px;
  cursor: pointer;
}
.signals-display-mode-select:focus {
  outline: none;
  border-color: rgba(201, 168, 76, 0.35);
  color: var(--t1);
}
</style>
