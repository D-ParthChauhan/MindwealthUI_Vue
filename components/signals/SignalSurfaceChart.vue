<template>
  <div class="surface-chart-wrap">
    <div v-if="enrichmentNote" class="surface-missing-banner">
      <span class="surface-missing-title">Surface chart unavailable for this report</span>
      <span class="surface-missing-note">{{ enrichmentNote }}</span>
    </div>

    <div v-else-if="missingFields.length" class="surface-missing-banner">
      <span class="surface-missing-title">API fields not yet in payload</span>
      <span class="surface-missing-list">{{ missingFields.join(', ') }}</span>
      <span class="surface-missing-note">
        Surface needs backend-provided
        <code>composite_score</code> and <code>window_remaining_pct</code> per signal.
        {{ plottableCount }} of {{ points.length }} signals are plottable with current data.
      </span>
    </div>

    <div v-if="plottableCount === 0 && !enrichmentNote" class="surface-empty">
      No signals have both quality score and window remaining data. Switch to Tables or wait for enriched API fields.
    </div>

    <div v-else class="surface-chart-card">
      <div class="surface-chart-head">
        <div class="ct">Signal Surface</div>
        <div class="cm">WINDOW REMAINING % · SIGNAL QUALITY (composite_score)</div>
      </div>

      <div
        ref="chartHost"
        class="surface-chart-host"
        @mousemove="onMouseMove"
        @mouseleave="hovered = null"
      >
        <svg
          class="surface-svg"
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Signal surface bubble chart"
        >
          <!-- Tier A zone -->
          <rect
            :x="xScale(30)"
            :y="plot.top"
            :width="plot.left + plot.width - xScale(30)"
            :height="Math.max(0, yScale(40) - plot.top)"
            fill="rgba(201, 168, 76, 0.06)"
            stroke="rgba(201, 168, 76, 0.2)"
            stroke-width="1"
            stroke-dasharray="4 3"
          />
          <text
            :x="plot.left + plot.width - 8"
            :y="yScale(40) + 14"
            class="surface-tier-label"
            text-anchor="end"
          >
            Tier A zone
          </text>

          <!-- X-axis zones -->
          <rect
            :x="xScale(-20)"
            :y="plot.top"
            :width="xScale(30) - xScale(-20)"
            :height="plot.height"
            fill="rgba(216, 90, 48, 0.04)"
          />
          <rect
            :x="xScale(30)"
            :y="plot.top"
            :width="xScale(70) - xScale(30)"
            :height="plot.height"
            fill="rgba(186, 117, 23, 0.04)"
          />
          <rect
            :x="xScale(70)"
            :y="plot.top"
            :width="xScale(110) - xScale(70)"
            :height="plot.height"
            fill="rgba(29, 158, 117, 0.04)"
          />

          <!-- Grid -->
          <g v-for="tick in xTicks" :key="`x-${tick}`">
            <line
              :x1="xScale(tick)"
              :y1="plot.top"
              :x2="xScale(tick)"
              :y2="plot.top + plot.height"
              class="surface-grid"
            />
            <text
              :x="xScale(tick)"
              :y="plot.top + plot.height + 16"
              class="surface-tick"
              text-anchor="middle"
            >
              {{ tick }}
            </text>
          </g>
          <g v-for="tick in yTicks" :key="`y-${tick}`">
            <line
              :x1="plot.left"
              :y1="yScale(tick)"
              :x2="plot.left + plot.width"
              :y2="yScale(tick)"
              class="surface-grid"
            />
            <text
              :x="plot.left - 8"
              :y="yScale(tick) + 4"
              class="surface-tick"
              text-anchor="end"
            >
              {{ tick }}
            </text>
          </g>

          <rect
            :x="plot.left"
            :y="plot.top"
            :width="plot.width"
            :height="plot.height"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
          />

          <text
            :x="plot.left + plot.width / 2"
            :y="H - 6"
            class="surface-axis-title"
            text-anchor="middle"
          >
            Window Remaining %
          </text>
          <text
            :x="16"
            :y="plot.top + plot.height / 2"
            class="surface-axis-title"
            :transform="`rotate(-90, 16, ${plot.top + plot.height / 2})`"
            text-anchor="middle"
          >
            Signal Quality
          </text>

          <!-- Bubbles -->
          <g v-for="bubble in bubbles" :key="bubble.key">
            <circle
              :cx="bubble.cx"
              :cy="bubble.cy"
              :r="bubble.r"
              :fill="bubble.color"
              :fill-opacity="bubble.opacity"
              :stroke="selectedKey === bubble.key ? '#fff' : bubble.color"
              :stroke-width="selectedKey === bubble.key ? 2 : 1"
              :stroke-opacity="selectedKey === bubble.key ? 0.9 : 0.5"
              class="surface-bubble"
              @click.stop="$emit('select', bubble.index)"
              @mouseenter="hovered = bubble"
            />
          </g>
        </svg>

        <div
          v-if="hovered"
          class="surface-tooltip"
          :style="tooltipStyle"
        >
          <div class="surface-tooltip-head">
            {{ hovered.symbol }} · {{ hovered.function }} · {{ hovered.interval }}
            <span v-if="hovered.daysElapsed === 0"> · new today</span>
            <span v-else-if="hovered.daysElapsed != null"> · {{ hovered.daysElapsed }}d old</span>
          </div>
          <div
            v-if="hovered.windowRemainingPct != null && hovered.avgHoldDays != null"
            class="surface-tooltip-line"
            :style="{ color: windowStatusColor(hovered.windowRemainingPct) }"
          >
            {{ Math.round(hovered.windowRemainingPct) }}% window remaining of {{ hovered.avgHoldDays }}d avg
          </div>
          <div v-else-if="hovered.windowRemainingPct != null" class="surface-tooltip-line">
            Window: {{ hovered.windowRemainingPct.toFixed(0) }}% remaining
          </div>
          <div class="surface-tooltip-line">
            BT WR {{ hovered.btWr.toFixed(1) }}%
            <span v-if="hovered.fwdWr != null"> · FWD WR {{ hovered.fwdWr.toFixed(1) }}%</span>
            <span v-if="hovered.compositeScore != null"> · Quality: {{ hovered.compositeScore }} pts</span>
          </div>
          <div v-if="hovered.signalAlpha != null || hovered.sharpe != null" class="surface-tooltip-line">
            <span v-if="hovered.signalAlpha != null">Alpha: {{ formatSigned(hovered.signalAlpha) }}%</span>
            <span v-if="hovered.sharpe != null"> · Sharpe: {{ hovered.sharpe.toFixed(2) }}</span>
          </div>
          <div v-if="hovered.mtmPct != null" class="surface-tooltip-line">
            MTM: {{ formatSigned(hovered.mtmPct) }}%
          </div>
          <div v-if="hovered.er != null" class="surface-tooltip-line">
            E[R]: {{ formatSigned(hovered.er) }}%
            <span v-if="hovered.rrStatic != null"> · R:R: {{ hovered.rrStatic.toFixed(1) }}×</span>
          </div>
          <div
            v-if="hovered.alphaInterpretation?.label"
            class="surface-tooltip-warn"
            :class="hovered.alphaInterpretation.type ?? 'info'"
          >
            {{ hovered.alphaInterpretation.label }}
          </div>
          <div v-if="hovered.intrinsicLagDays != null && hovered.intrinsicLagDays > 0" class="surface-tooltip-muted">
            ~{{ hovered.intrinsicLagDays }}d detection lag (informational)
          </div>
        </div>
      </div>

      <div class="surface-legend">
        <span v-for="fn in legendFunctions" :key="fn" class="surface-legend-item">
          <span class="surface-legend-dot" :style="{ background: functionColor(fn) }" />
          {{ fn }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignalSurfacePoint } from '~/utils/signal-surface'
import {
  functionColor,
  isPlottableSurfacePoint,
  windowStatusColor,
} from '~/utils/signal-surface'

const props = defineProps<{
  points: SignalSurfacePoint[]
  missingFields: string[]
  selectedKey?: string | null
  enrichmentNote?: string | null
}>()

defineEmits<{ select: [index: number] }>()

const W = 720
const H = 420
const plot = { left: 52, top: 24, width: 640, height: 340 }

const X_MIN = -20
const X_MAX = 110

const hovered = ref<(SignalSurfacePoint & { cx: number; cy: number; r: number; index: number }) | null>(null)
const chartHost = ref<HTMLElement | null>(null)
const mouse = ref({ x: 0, y: 0 })

const plottable = computed(() =>
  props.points.map((p, index) => ({ p, index })).filter(({ p }) => isPlottableSurfacePoint(p)),
)

const plottableCount = computed(() => plottable.value.length)

const yMin = computed(() => {
  const scores = plottable.value.map(({ p }) => p.compositeScore!).filter(Number.isFinite)
  if (!scores.length) return -20
  return Math.floor(Math.min(-20, ...scores) / 10) * 10
})

const yMax = computed(() => {
  const scores = plottable.value.map(({ p }) => p.compositeScore!).filter(Number.isFinite)
  if (!scores.length) return 80
  return Math.ceil(Math.max(80, ...scores) / 10) * 10
})

function xScale(v: number) {
  return plot.left + ((v - X_MIN) / (X_MAX - X_MIN)) * plot.width
}

function yScale(v: number) {
  const range = yMax.value - yMin.value || 1
  return plot.top + plot.height - ((v - yMin.value) / range) * plot.height
}

const xTicks = [-20, 0, 30, 70, 110]
const yTicks = computed(() => {
  const ticks: number[] = []
  const step = yMax.value - yMin.value <= 60 ? 10 : 20
  for (let v = yMin.value; v <= yMax.value; v += step) ticks.push(v)
  return ticks
})

const bubbles = computed(() =>
  plottable.value.map(({ p, index }) => {
    const mtm = Math.abs(p.mtmPct ?? 0)
    const r = Math.max(6, Math.min(22, 6 + mtm * 0.8))
    return {
      ...p,
      index,
      cx: xScale(p.windowRemainingPct!),
      cy: yScale(p.compositeScore!),
      r,
      color: functionColor(p.function),
      opacity: p.exitFired ? 0.28 : 0.72,
    }
  }),
)

const legendFunctions = computed(() => {
  const fns = new Set(props.points.map((p) => p.function))
  return [...fns].sort()
})

const tooltipStyle = computed(() => {
  if (!chartHost.value) return {}
  const rect = chartHost.value.getBoundingClientRect()
  const x = mouse.value.x - rect.left + 12
  const y = mouse.value.y - rect.top + 12
  return {
    left: `${Math.min(x, rect.width - 280)}px`,
    top: `${Math.min(y, rect.height - 120)}px`,
  }
})

function onMouseMove(e: MouseEvent) {
  mouse.value = { x: e.clientX, y: e.clientY }
}

function formatSigned(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}
</script>

<style scoped>
.surface-chart-wrap {
  width: 100%;
  min-width: 0;
}
.surface-missing-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(186, 117, 23, 0.35);
  background: rgba(186, 117, 23, 0.08);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t2);
}
.surface-missing-title {
  color: var(--gold);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.surface-missing-list {
  color: var(--t1);
}
.surface-missing-note code {
  color: var(--gold);
}
.surface-missing-note {
  color: var(--t3);
  line-height: 1.45;
}
.surface-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t3);
  border: 1px dashed var(--b2);
  border-radius: 4px;
}
.surface-chart-card {
  border-top: 1px solid var(--b1);
  padding-top: 4px;
}
.surface-chart-head {
  padding: 0 2px 8px;
}
.surface-chart-host {
  position: relative;
  width: 100%;
  min-height: 360px;
}
.surface-svg {
  width: 100%;
  height: auto;
  display: block;
}
.surface-grid {
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}
.surface-tick {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  fill: var(--t3);
}
.surface-axis-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  fill: var(--t3);
  letter-spacing: 0.4px;
}
.surface-tier-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  fill: var(--gold);
  opacity: 0.85;
}
.surface-bubble {
  cursor: pointer;
  transition: opacity 0.12s;
}
.surface-bubble:hover {
  opacity: 1 !important;
}
.surface-tooltip {
  position: absolute;
  z-index: 5;
  max-width: 280px;
  padding: 8px 10px;
  background: rgba(10, 10, 10, 0.94);
  border: 1px solid var(--b2);
  border-radius: 4px;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}
.surface-tooltip-head {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t1);
  font-weight: 600;
  margin-bottom: 5px;
}
.surface-tooltip-line {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t2);
  line-height: 1.45;
}
.surface-tooltip-warn {
  margin-top: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
}
.surface-tooltip-warn.warn { color: var(--gold); }
.surface-tooltip-warn.fail { color: var(--red); }
.surface-tooltip-warn.info { color: var(--t3); }
.surface-tooltip-muted {
  margin-top: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--t3);
}
.surface-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  padding: 10px 2px 4px;
  border-top: 1px solid var(--b1);
  margin-top: 8px;
}
.surface-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--t3);
}
.surface-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
