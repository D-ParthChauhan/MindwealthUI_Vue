<template>
  <div v-if="regimeData" class="macro-regime-strip">
    <div class="macro-regime-pills">
      <span
        v-for="pill in pills"
        :key="pill.label"
        class="rpill"
        :class="pill.class"
      >
        ● {{ pill.label }}<template v-if="pillSource(pill.label)"> ({{ pillSource(pill.label) }})</template>: {{ pill.value }}
      </span>
    </div>
    <div class="macro-regime-date">{{ regimeData.date }}</div>
  </div>
</template>

<script setup lang="ts">
import { buildRegimePills, regimePillSource } from '~/utils/runic-regime'

const { regime, nightly } = useRunicMacro()

const regimeData = computed(() => regime.value ?? (nightly.value ? { date: nightly.value.date, regime: nightly.value.regime } : null))

const pills = computed(() =>
  regimeData.value ? buildRegimePills(regimeData.value.regime) : [],
)

function pillSource(label: string) {
  return regimePillSource(label, regimeData.value?.regime)
}
</script>
