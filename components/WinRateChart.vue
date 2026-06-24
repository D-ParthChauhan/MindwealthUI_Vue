<template>
  <div
    v-if="hasData"
    class="wr-chart"
    :style="{ minWidth: `${layout.W}px` }"
    :aria-label="ariaLabel"
    role="img"
  >
    <svg
      class="wr-svg"
      :viewBox="`0 0 ${layout.W} ${layout.H}`"
      preserveAspectRatio="xMinYMid meet"
      :style="{ minWidth: `${layout.W}px` }"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="primaryColor" />
          <stop offset="100%" :stop-color="primaryColor" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Y-axis title -->
      <text
        :x="18"
        :y="layout.plot.top + layout.plot.height / 2"
        class="wr-axis-title"
        :transform="`rotate(-90, 18, ${layout.plot.top + layout.plot.height / 2})`"
        text-anchor="middle"
      >
        {{ yAxisLabel }}
      </text>

      <!-- Grid + Y ticks -->
      <g v-for="tick in yTicks" :key="tick.value">
        <line
          :x1="layout.plot.left"
          :y1="tick.y"
          :x2="layout.plot.left + layout.plot.width"
          :y2="tick.y"
          class="wr-grid"
        />
        <text :x="layout.plot.left - 8" :y="tick.y + 4" class="wr-tick-y" text-anchor="end">
          {{ tick.label }}
        </text>
      </g>

      <!-- Plot border -->
      <rect
        :x="layout.plot.left"
        :y="layout.plot.top"
        :width="layout.plot.width"
        :height="layout.plot.height"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        stroke-width="1"
      />

      <!-- Area fill under primary series -->
      <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" opacity="0.08" />

      <!-- Series lines -->
      <path
        v-for="(line, i) in renderedLines"
        :key="line.name"
        class="dp"
        :class="{ 'dp-partial': line.dashed }"
        :d="line.d"
        :stroke="line.color"
        :stroke-width="line.strokeWidth"
        fill="none"
        :opacity="line.opacity"
        :style="{ animationDelay: `${0.2 + i * 0.25}s` }"
      />

      <!-- Data point markers -->
      <g v-for="line in renderedLines" :key="`${line.name}-pts`">
        <circle
          v-for="(pt, pi) in line.points"
          :key="pi"
          :cx="pt.x"
          :cy="pt.y"
          r="4.5"
          :fill="line.color"
          :opacity="line.opacity"
        />
      </g>

      <!-- X-axis labels -->
      <g v-for="(lbl, i) in xLabels" :key="lbl">
        <text
          :x="xPos(i)"
          :y="layout.xTickY"
          class="wr-tick-x"
          :class="{ 'wr-tick-x-rotated': layout.rotateXLabels }"
          :text-anchor="layout.rotateXLabels ? 'end' : 'middle'"
          :transform="layout.rotateXLabels ? `rotate(-42, ${xPos(i)}, ${layout.xTickY})` : undefined"
        >
          {{ formatXLabel(lbl) }}
        </text>
      </g>

      <!-- X-axis title -->
      <text
        :x="layout.plot.left + layout.plot.width / 2"
        :y="layout.xTitleY"
        class="wr-axis-sub"
        text-anchor="middle"
      >
        {{ xAxisLabel }}
      </text>
    </svg>
    <div class="wr-legend-bar">
      <div
        v-for="item in legendItems"
        :key="item.name"
        class="wr-legend-item"
      >
        <span
          v-if="item.kind === 'series'"
          class="wr-swatch"
          :class="{ 'wr-swatch-dashed': item.dashed }"
          :style="{
            borderColor: item.color,
            borderWidth: `${item.strokeWidth}px`,
            opacity: item.opacity,
          }"
        />
        <span class="wr-legend-text">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardResponse } from '~/types/api'
import {
  formatWinRateChartCaption,
  getChartXLabels,
  resolveSeriesStyle,
} from '~/utils/win-rate-chart'

const props = defineProps<{
  chart?: DashboardResponse['win_rate_chart']
}>()

const PLOT_LEFT = 52
const PLOT_TOP = 40
const PLOT_HEIGHT = 232
const BASE_PLOT_WIDTH = 572
const BASE_CHART_HEIGHT = 340

const gradientId = 'wr-gg-dashboard'

const series = computed(() => props.chart?.series ?? [])
const hasData = computed(() => series.value.some((s) => s.points.length > 0))

const xLabels = computed(() =>
  props.chart ? getChartXLabels(props.chart) : [],
)

const isFunctionAxis = computed(
  () => (props.chart?.properties.x_axis ?? '').toLowerCase() === 'function',
)

const layout = computed(() => {
  const n = xLabels.value.length
  const rotateXLabels = isFunctionAxis.value && n > 4
  const slotWidth = rotateXLabels ? 72 : 56
  const plotWidth =
    n <= 1 ? BASE_PLOT_WIDTH : Math.max(BASE_PLOT_WIDTH, (n - 1) * slotWidth)
  const plot = { left: PLOT_LEFT, top: PLOT_TOP, width: plotWidth, height: PLOT_HEIGHT }
  const W = plot.left + plot.width + 16
  const xTickY = plot.top + plot.height + (rotateXLabels ? 10 : 22)
  const xTitleY = plot.top + plot.height + (rotateXLabels ? 78 : 42)
  const H = Math.max(BASE_CHART_HEIGHT, xTitleY + 12)
  return { W, H, plot, xTickY, xTitleY, rotateXLabels }
})

const yScale = computed(() => {
  const scale = props.chart?.scale
  if (scale) return scale
  const values = series.value.flatMap((s) => s.points.map((p) => p.y))
  if (!values.length) return { y_min: 0, y_max: 100, y_ticks: [0, 50, 100] }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  return {
    y_min: Math.max(0, Math.floor(rawMin / 5) * 5 - 5),
    y_max: Math.min(100, Math.ceil(rawMax / 5) * 5 + 5),
    y_ticks: [0, 50, 100],
  }
})

const yAxisLabel = computed(() => props.chart?.properties.y_axis ?? 'Win rate (%)')
const xAxisLabel = computed(() => props.chart?.properties.x_axis ?? 'X')

function formatXLabel(label: string): string {
  if (!isFunctionAxis.value) return label
  return label
    .replace(/\s+TRACK$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function yToPlot(y: number): number {
  const { y_min, y_max } = yScale.value
  const span = Math.max(y_max - y_min, 1)
  const { plot } = layout.value
  return plot.top + plot.height - ((y - y_min) / span) * plot.height
}

function xPos(index: number): number {
  const n = xLabels.value.length
  const { plot } = layout.value
  if (n <= 1) return plot.left + plot.width / 2
  return plot.left + (index / (n - 1)) * plot.width
}

function pointX(label: string): number {
  const idx = xLabels.value.indexOf(label)
  const { plot } = layout.value
  return idx >= 0 ? xPos(idx) : plot.left
}

const yTicks = computed(() =>
  (yScale.value.y_ticks ?? []).map((value) => ({
    value,
    y: yToPlot(value),
    label: `${value}%`,
  })),
)

function seriesToPath(points: Array<{ x: string; y: number }>) {
  if (!points.length) return ''
  const coords = points.map((p) => ({ x: pointX(p.x), y: yToPlot(p.y) }))
  let d = `M${coords[0].x},${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const cpx = (coords[i - 1].x + coords[i].x) / 2
    d += ` C${cpx},${coords[i - 1].y} ${cpx},${coords[i].y} ${coords[i].x},${coords[i].y}`
  }
  return d
}

const renderedLines = computed(() =>
  series.value.map((s, i) => {
    const fallback = resolveSeriesStyle(s.name, i)
    const partial = s.points.length < xLabels.value.length
    return {
      name: s.name,
      color: s.color ?? fallback.color,
      strokeWidth: s.stroke_width ?? fallback.stroke_width,
      opacity: s.opacity ?? fallback.opacity,
      dashed: partial,
      d: seriesToPath(s.points),
      points: s.points.map((p) => ({ x: pointX(p.x), y: yToPlot(p.y) })),
    }
  }),
)

const primaryColor = computed(
  () => renderedLines.value[0]?.color ?? '#27ae60',
)

const areaPath = computed(() => {
  const primary = renderedLines.value[0]
  if (!primary?.d) return ''
  const last = primary.points[primary.points.length - 1]
  const first = primary.points[0]
  if (!last || !first) return ''
  const base = layout.value.plot.top + layout.value.plot.height
  return `${primary.d} L${last.x},${base} L${first.x},${base} Z`
})

const legendItems = computed(() =>
  renderedLines.value.map((l) => ({
    kind: 'series' as const,
    name: l.name,
    color: l.color,
    strokeWidth: l.strokeWidth,
    opacity: l.opacity,
    dashed: l.dashed,
  })),
)

const ariaLabel = computed(() =>
  props.chart ? formatWinRateChartCaption(props.chart) : 'Win rate chart',
)
</script>

<style scoped>
.wr-chart {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
  min-height: 392px;
}
.wr-svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 340px;
  flex-shrink: 0;
}
.wr-legend-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
}
.wr-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.wr-swatch {
  display: inline-block;
  width: 20px;
  border-top-style: solid;
  flex-shrink: 0;
}
.wr-swatch-dashed {
  border-top-style: dashed;
}
.wr-legend-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: var(--t1);
  white-space: nowrap;
}
.wr-grid {
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}
.wr-tick-y,
.wr-tick-x {
  font-family: 'JetBrains Mono', monospace;
}
.wr-tick-y {
  font-size: 12px;
  fill: var(--t2);
}
.wr-tick-x {
  font-size: 12.5px;
  fill: var(--t1);
}
.wr-tick-x-rotated {
  font-size: 9.5px;
  letter-spacing: 0.2px;
}
.wr-axis-title,
.wr-axis-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  fill: var(--t2);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.dp {
  stroke-dasharray: 1500;
  stroke-dashoffset: 1500;
  animation: dr 2s ease 0.2s forwards;
}
.dp-partial {
  animation-name: dr-partial;
}
@keyframes dr {
  to { stroke-dashoffset: 0; }
}
@keyframes dr-partial {
  to {
    stroke-dashoffset: 0;
    stroke-dasharray: 7 5;
  }
}
</style>
