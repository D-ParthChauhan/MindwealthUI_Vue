<template>
  <div class="wr-chart">
    <svg width="100%" height="100%" viewBox="0 0 560 120" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wr-gg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#27ae60" />
          <stop offset="100%" stop-color="#27ae60" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line v-for="y in gridY" :key="y" x1="0" :y1="y" x2="560" :y2="y" stroke="#0e0e0e" stroke-width="1" />
      <path v-if="areaPath" :d="areaPath" fill="url(#wr-gg)" opacity="0.07" />
      <path
        v-for="(line, i) in lines"
        :key="i"
        class="dp"
        :d="line.d"
        :stroke="line.color"
        stroke-width="line.width"
        fill="none"
        :opacity="line.opacity"
        :style="{ animationDelay: `${0.3 + i * 0.3}s` }"
      />
    </svg>
    <div v-if="showDegradedLabel" class="wr-note">Forward trend softening</div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardResponse } from '~/types/api'

const props = defineProps<{
  chart?: DashboardResponse['win_rate_chart']
}>()

const gridY = [30, 60, 90]

const colors: Record<string, string> = {
  'Long WR': '#27ae60',
  'Short WR': '#c0392b',
  'Backtested WR': '#C9A84C',
}

const series = computed(() => props.chart?.series ?? [])

function seriesToPath(points: Array<{ x: string; y: number }>, yOffset = 0) {
  if (!points.length) return ''
  const n = points.length
  const xs = points.map((_, i) => (i / Math.max(n - 1, 1)) * 560)
  const ys = points.map((p) => 110 - (p.y / 100) * 70 + yOffset)
  let d = `M${xs[0]},${ys[0]}`
  for (let i = 1; i < n; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2
    d += ` C${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`
  }
  return d
}

const lines = computed(() =>
  series.value.map((s, i) => ({
    d: seriesToPath(s.points, i * 3),
    color: colors[s.name] ?? '#27ae60',
    width: s.name === 'Long WR' ? 2 : 1.5,
    opacity: s.name === 'Short WR' ? 0.6 : 1,
  })),
)

const areaPath = computed(() => {
  const primary = series.value.find((s) => s.name === 'Long WR')
  if (!primary?.points.length) return ''
  const line = seriesToPath(primary.points)
  const lastX = 560
  return `${line} L${lastX},120 L0,120 Z`
})

const showDegradedLabel = computed(() => series.value.some((s) => s.name === 'Short WR'))
</script>

<style scoped>
.wr-chart {
  position: relative;
  width: 100%;
  height: 100%;
}
.wr-note {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #d6a56f;
  letter-spacing: 0.1px;
  background: rgba(4, 4, 4, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
}
.dp {
  stroke-dasharray: 1500;
  stroke-dashoffset: 1500;
  animation: dr 2.5s ease 0.3s forwards;
}
@keyframes dr {
  to { stroke-dashoffset: 0; }
}
</style>
