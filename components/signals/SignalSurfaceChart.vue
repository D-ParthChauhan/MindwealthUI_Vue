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
          class="surface-tip-wrap"
          :style="tooltipStyle"
        >
          <div class="mw-glass-hero surface-tip-glass">
            <div class="mw-glass-hero-inner">
              <div class="surface-tip-top">
                <span class="surface-tip-symbol">{{ hovered.symbol }}</span>
                <span
                  v-if="hovered.tier"
                  class="surface-tip-tier"
                  :class="tierBadgeClass(hovered.tier)"
                >
                  {{ tierLabel(hovered.tier) }}
                </span>
              </div>
              <div class="surface-tip-pills">
                <span class="surface-tip-pill fn" :title="hovered.function">
                  {{ abbreviateFunction(hovered.function) }}
                </span>
                <span class="surface-tip-pill">{{ abbreviateInterval(hovered.interval) }}</span>
                <span class="surface-tip-pill dir">{{ hovered.direction }}</span>
                <span v-if="hovered.daysElapsed != null" class="surface-tip-pill age">
                  {{ hovered.daysElapsed === 0 ? 'new' : `${hovered.daysElapsed}d` }}
                </span>
              </div>

              <div class="surface-tip-stats">
                <div v-if="hovered.compositeScore != null" class="surface-tip-stat">
                  <span class="surface-tip-stat-l">Quality</span>
                  <span class="surface-tip-stat-v quality">{{ formatScore(hovered.compositeScore) }}</span>
                </div>
                <div v-if="hovered.windowRemainingPct != null" class="surface-tip-stat">
                  <span class="surface-tip-stat-l">Window</span>
                  <span
                    class="surface-tip-stat-v"
                    :style="{ color: windowStatusColor(hovered.windowRemainingPct) }"
                  >
                    {{ hovered.windowRemainingPct.toFixed(0) }}%
                  </span>
                </div>
                <div class="surface-tip-stat">
                  <span class="surface-tip-stat-l">BT WR</span>
                  <span class="surface-tip-stat-v">{{ hovered.btWr.toFixed(1) }}%</span>
                </div>
                <div class="surface-tip-stat">
                  <span class="surface-tip-stat-l">FWD WR</span>
                  <span class="surface-tip-stat-v" :class="hovered.fwdWr == null ? 'na' : ''">
                    {{ hovered.fwdWr != null ? `${hovered.fwdWr.toFixed(1)}%` : '—' }}
                  </span>
                </div>
                <div v-if="hovered.mtmPct != null" class="surface-tip-stat">
                  <span class="surface-tip-stat-l">MTM</span>
                  <span class="surface-tip-stat-v" :class="mtmClass(hovered.mtmPct)">
                    {{ formatSigned(hovered.mtmPct) }}%
                  </span>
                </div>
                <div v-if="hovered.signalAlpha != null" class="surface-tip-stat">
                  <span class="surface-tip-stat-l">Alpha</span>
                  <span class="surface-tip-stat-v" :class="alphaClass(hovered.signalAlpha)">
                    {{ formatSigned(hovered.signalAlpha) }}%
                  </span>
                </div>
              </div>

              <div
                v-if="hovered.alphaInterpretation?.label"
                class="surface-tip-flag"
                :class="hovered.alphaInterpretation.type ?? 'info'"
              >
                {{ hovered.alphaInterpretation.label }}
              </div>
            </div>
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
import { abbreviateFunction, abbreviateInterval } from '~/utils/signal-detail'
import type { SignalSurfacePoint } from '~/utils/signal-surface'
import {
  functionColor,
  isPlottableSurfacePoint,
  tierBadgeClass,
  tierLabel,
  windowStatusColor,
} from '~/utils/signal-surface'

const props = defineProps<{
  points: SignalSurfacePoint[]
  missingFields: string[]
  selectedKey?: string | null
  enrichmentNote?: string | null
}>()

defineEmits<{ select: [index: number] }>()

const W = 800
const H = 480
const plot = { left: 54, top: 22, width: 718, height: 400 }

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
    const r = Math.max(7, Math.min(24, 7 + mtm * 0.85))
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
  const tipW = 236
  const tipH = 152
  let x = mouse.value.x - rect.left + 10
  let y = mouse.value.y - rect.top + 10
  if (x + tipW > rect.width - 4) x = mouse.value.x - rect.left - tipW - 10
  if (y + tipH > rect.height - 4) y = mouse.value.y - rect.top - tipH - 8
  return {
    left: `${Math.max(4, x)}px`,
    top: `${Math.max(4, y)}px`,
  }
})

function onMouseMove(e: MouseEvent) {
  mouse.value = { x: e.clientX, y: e.clientY }
}

function formatSigned(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}

function formatScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function mtmClass(pct: number) {
  if (pct > 0) return 'ok'
  if (pct < 0) return 'bad'
  return 'neutral'
}

function alphaClass(n: number) {
  if (n > 0) return 'ok'
  if (n < 0) return 'bad'
  return 'neutral'
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
  padding: 0 2px 6px;
}
.surface-chart-host {
  position: relative;
  width: 100%;
  min-height: 420px;
}
.surface-svg {
  width: 100%;
  height: auto;
  min-height: 420px;
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

.surface-tip-wrap {
  position: absolute;
  z-index: 8;
  width: 236px;
  pointer-events: none;
}

.surface-tip-glass {
  padding: 11px 12px 10px;
  border-radius: 9px;
  background: rgba(6, 6, 8, 0.9);
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 8px 28px rgba(0, 0, 0, 0.5);
}

.surface-tip-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.surface-tip-symbol {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-weight: 600;
  color: #f5f5f5;
  line-height: 1.05;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.surface-tip-tier {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
}

.surface-tip-tier.tier-a {
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
}

.surface-tip-tier.tier-best {
  color: var(--blue);
  border: 1px solid rgba(91, 141, 184, 0.4);
  background: rgba(91, 141, 184, 0.1);
}

.surface-tip-tier.tier-c,
.surface-tip-tier.neutral {
  color: var(--t2);
  border: 1px solid var(--b2);
}

.surface-tip-tier.tier-exit {
  color: var(--red);
  border: 1px solid rgba(216, 90, 48, 0.35);
}

.surface-tip-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 9px;
}

.surface-tip-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 3px;
  color: var(--t1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  letter-spacing: 0.25px;
  line-height: 1.3;
}

.surface-tip-pill.fn {
  color: var(--gold);
  border-color: rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.1);
  max-width: 108px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.surface-tip-pill.dir {
  color: #e8e8e8;
  font-weight: 600;
}

.surface-tip-pill.age {
  color: var(--t2);
}

.surface-tip-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px 6px;
  padding-top: 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.surface-tip-stat {
  text-align: left;
  min-width: 0;
  padding: 4px 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.22);
}

.surface-tip-stat-l {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  color: var(--t2);
  letter-spacing: 0.45px;
  text-transform: uppercase;
  margin-bottom: 3px;
  line-height: 1.2;
}

.surface-tip-stat-v {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13.5px;
  font-weight: 600;
  color: #f0f0f0;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.surface-tip-stat-v.quality { color: var(--gold); }
.surface-tip-stat-v.ok { color: var(--green); }
.surface-tip-stat-v.bad { color: var(--red); }
.surface-tip-stat-v.neutral { color: var(--t2); }
.surface-tip-stat-v.na { color: var(--t4); }

.surface-tip-flag {
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  line-height: 1.4;
  padding: 4px 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  white-space: normal;
}

.surface-tip-flag.warn { color: var(--gold); }
.surface-tip-flag.fail { color: var(--red); }
.surface-tip-flag.info { color: var(--t3); }

.surface-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 8px 2px 2px;
  border-top: 1px solid var(--b1);
  margin-top: 6px;
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
