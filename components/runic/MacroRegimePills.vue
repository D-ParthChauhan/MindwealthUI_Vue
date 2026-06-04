<template>
  <div v-if="nightly" class="macro-regime-strip">
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
    <div class="macro-regime-date">{{ nightly.date }}</div>
  </div>
</template>

<script setup lang="ts">
import { buildRegimePills, regimePillSource } from '~/utils/runic-regime'

const { nightly } = useRunicMacro()

const pills = computed(() => (nightly.value ? buildRegimePills(nightly.value.regime) : []))

function pillSource(label: string) {
  return regimePillSource(label)
}
</script>
