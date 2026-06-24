<template>
  <article class="aa-signal">
    <div class="aa-signal-label">{{ label }}</div>

    <div class="mw-glass-hero-wrap">
      <header class="mw-glass-hero" :class="heroTone">
        <div class="mw-glass-hero-inner">
          <div class="aa-signal-head">
            <span class="aa-signal-fn">{{ signal.strategy }}</span>
            <span class="runic-badge" :class="statusBadgeClass">{{ statusLabel }}</span>
          </div>

          <div class="aa-signal-pills">
            <span class="runic-badge b-warn">{{ signal.signal_type }}</span>
            <span class="runic-badge b-off">{{ signal.interval }}</span>
            <span v-if="!signal.above_floor" class="runic-badge b-act">BELOW 60% FLOOR</span>
          </div>

          <div class="aa-signal-stats">
            <div class="aa-stat">
              <div class="aa-stat-v">{{ formatPct(signal.backtest_wr) }}</div>
              <div class="aa-stat-l">BT WR</div>
            </div>
            <div class="aa-stat">
              <div class="aa-stat-v" :class="signal.above_floor ? 'ok' : 'bad'">
                {{ formatPct(signal.fwd_wr) }}
              </div>
              <div class="aa-stat-l">FWD WR</div>
            </div>
            <div class="aa-stat">
              <div class="aa-stat-v" :class="gapClass">{{ formatGap(signal.gap) }}</div>
              <div class="aa-stat-l">GAP</div>
            </div>
          </div>
        </div>
      </header>
    </div>

    <p class="aa-signal-pattern runic-body">{{ signal.pattern }}</p>

    <div v-if="fwdTrend?.length" class="aa-trend">
      <div class="aa-trend-head">
        <span>4-WK FWD RATE</span>
        <span class="aa-floor">60% FLOOR</span>
      </div>
      <div class="aa-trend-bars">
        <div v-for="(val, i) in fwdTrend" :key="i" class="aa-trend-bar-wrap">
          <div class="aa-trend-bar" :class="{ bad: val < 60 }" :style="{ height: `${val}%` }" />
          <div class="aa-trend-val">{{ val }}%</div>
        </div>
        <div class="aa-floor-line" />
      </div>
    </div>

    <div v-if="recommendation" class="pf-con-row c-warn aa-rec">
      <span class="txt"><b>Recommend</b> · {{ recommendation }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { OverwatchPanelSignalDetail } from '~/types/api'

const props = defineProps<{
  label: string
  signal: OverwatchPanelSignalDetail
  recommendation?: string
  fwdTrend?: number[]
}>()

const heroTone = computed(() => {
  if (!props.signal.above_floor) return 'tone-r'
  if (props.signal.gap <= -15) return 'tone-a'
  return 'tone-a'
})

const statusLabel = computed(() => (props.signal.above_floor ? 'WATCH' : 'DEGRADING'))
const statusBadgeClass = computed(() => (props.signal.above_floor ? 'b-watch' : 'b-act'))

const gapClass = computed(() => {
  if (props.signal.gap <= -15) return 'bad'
  if (props.signal.gap < 0) return 'warn'
  return 'ok'
})

function formatPct(n: number) {
  return `${n}%`
}

function formatGap(n: number) {
  return `${n >= 0 ? '+' : ''}${n}pp`
}
</script>

<style scoped>
.aa-signal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aa-signal-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.9px;
  color: var(--t4);
  text-transform: uppercase;
}

.aa-signal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.aa-signal-fn {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.aa-signal-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.aa-signal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  text-align: center;
}

.aa-stat-v {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}

.aa-stat-v.ok { color: var(--green); }
.aa-stat-v.warn { color: var(--amber); }
.aa-stat-v.bad { color: var(--red); }

.aa-stat-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  color: var(--t3);
  letter-spacing: 0.4px;
  margin-top: 2px;
}

.aa-signal-pattern {
  margin: 0;
  padding: 0 2px;
  font-size: 10px;
  line-height: 1.6;
}

.aa-trend { margin-top: 2px; }

.aa-trend-head {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  color: var(--t4);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.aa-floor { color: var(--t3); }

.aa-trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 52px;
  position: relative;
  padding-bottom: 14px;
}

.aa-trend-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  z-index: 1;
}

.aa-trend-bar {
  width: 100%;
  max-width: 24px;
  background: rgba(201, 168, 76, 0.35);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.aa-trend-bar.bad {
  background: rgba(231, 76, 60, 0.45);
}

.aa-trend-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  color: var(--t3);
  margin-top: 3px;
}

.aa-floor-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(60% + 14px);
  height: 1px;
  border-top: 1px dashed rgba(255, 77, 109, 0.55);
  pointer-events: none;
  z-index: 0;
}

.aa-rec {
  margin: 0;
}
</style>
