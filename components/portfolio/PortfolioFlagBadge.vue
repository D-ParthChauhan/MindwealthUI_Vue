<template>
  <span class="pf-flag" :class="flagClass(flag.id)" :title="flag.label">{{ flag.label }}</span>
</template>

<script setup lang="ts">
import type { PortfolioFlag } from '~/types/api'
import { flagClass } from '~/utils/portfolio-display'

defineProps<{ flag: PortfolioFlag }>()
</script>
