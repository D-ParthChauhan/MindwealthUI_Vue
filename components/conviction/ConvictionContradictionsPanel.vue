<template>
  <div>
    <div class="cv-section-hint">Quant signals conflicting with conviction verdict</div>
    <div
      v-for="item in contradictions"
      :key="item.id"
      class="cv-contra-row"
      :class="item.kind"
    >
      <span class="cv-contra-icon">{{ item.kind === 'warning' ? '⚠' : 'ℹ' }}</span>
      <div><strong>{{ item.ticker }}</strong> — {{ item.body }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionContradiction } from '~/types/conviction'

defineProps<{ contradictions: ConvictionContradiction[] }>()
</script>
