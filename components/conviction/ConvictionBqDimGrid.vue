<template>
  <div class="cv-bq-grid">
    <div
      v-for="(dim, i) in dimensions"
      :key="dim.name || i"
      class="cv-bq-card"
      :class="[scoreTone(dim.score), { warn: isWarn(dim) }]"
      :title="`${formatDimName(dim.name)} · ${dim.source} · ${signed(dim.score)}`"
    >
      <div class="cv-bq-card-top">
        <span class="cv-bq-name">{{ formatDimName(dim.name) }}</span>
        <span class="cv-bq-src" :class="sourceClass(dim.source)">{{ sourceLabel(dim.source) }}</span>
      </div>

      <div class="cv-bq-main">
        <span class="cv-bq-score">{{ signed(dim.score) }}</span>
        <div class="cv-bq-meter" aria-hidden="true">
          <div class="cv-bq-meter-track">
            <div class="cv-bq-meter-zero" />
            <div
              v-if="dim.score !== 0"
              class="cv-bq-meter-fill"
              :style="fillStyle(dim.score)"
            />
            <div class="cv-bq-meter-pin" :style="pinStyle(dim.score)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BqDimension } from '~/types/conviction'

defineProps<{ dimensions: BqDimension[] }>()

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function formatDimName(name: string) {
  if (!name) return '—'
  return name.replace(/\b\w/g, (c) => c.toUpperCase())
}

function scoreTone(score: number) {
  if (score > 0) return 'pos'
  if (score < 0) return 'neg'
  return 'zero'
}

function sourceClass(source: string) {
  return source.toLowerCase().includes('man') ? 'manual' : 'auto'
}

function sourceLabel(source: string) {
  return source.toLowerCase().includes('man') ? 'man' : 'auto'
}

function isWarn(dim: BqDimension) {
  return dim.score < 0 && dim.name.toLowerCase().includes('coverage')
}

function clampScore(score: number) {
  return Math.max(-2, Math.min(2, score))
}

function fillStyle(score: number) {
  const s = clampScore(score)
  const pct = (Math.abs(s) / 2) * 50
  const color = s > 0 ? 'var(--green)' : 'var(--red)'
  if (s >= 0) return { left: '50%', width: `${pct}%`, background: color }
  return { left: `${50 - pct}%`, width: `${pct}%`, background: color }
}

function pinStyle(score: number) {
  const s = clampScore(score)
  const left = ((s + 2) / 4) * 100
  return { left: `${left}%` }
}
</script>

<style scoped>
.cv-bq-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.cv-bq-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 7px 5px;
  border-radius: 5px;
  border: 1px solid var(--b1);
  background: rgba(255, 255, 255, 0.025);
  min-width: 0;
  transition: border-color 0.12s, background 0.12s;
}

.cv-bq-card:hover {
  border-color: var(--b2);
  background: rgba(255, 255, 255, 0.035);
}

.cv-bq-card.pos {
  border-color: rgba(39, 174, 96, 0.32);
  background: rgba(39, 174, 96, 0.06);
}

.cv-bq-card.neg {
  border-color: rgba(231, 76, 60, 0.35);
  background: rgba(192, 57, 43, 0.08);
}

.cv-bq-card.zero {
  border-color: var(--b1);
}

.cv-bq-card.warn {
  box-shadow: inset 0 0 0 1px rgba(231, 76, 60, 0.3);
}

.cv-bq-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.cv-bq-name {
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--t2);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cv-bq-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cv-bq-score {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: var(--t2);
  flex-shrink: 0;
  min-width: 28px;
  letter-spacing: -0.5px;
}

.cv-bq-card.pos .cv-bq-score { color: #7dcea0; }
.cv-bq-card.neg .cv-bq-score { color: #f1948a; }
.cv-bq-card.zero .cv-bq-score { color: var(--t3); font-size: 16px; }

.cv-bq-src {
  font-family: 'JetBrains Mono', monospace;
  font-size: 6.5px;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  padding: 0 4px;
  border-radius: 2px;
  line-height: 1.5;
}

.cv-bq-src.auto {
  color: var(--teal);
  background: rgba(22, 160, 133, 0.14);
  border: 1px solid rgba(22, 160, 133, 0.28);
}

.cv-bq-src.manual {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.28);
}

.cv-bq-meter {
  flex: 1;
  min-width: 0;
  max-width: 52px;
  opacity: 0.65;
}

.cv-bq-meter-track {
  position: relative;
  height: 3px;
  background: var(--b2);
  border-radius: 2px;
  overflow: visible;
}

.cv-bq-meter-zero {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  margin-left: -0.5px;
  background: var(--b3);
  z-index: 2;
}

.cv-bq-meter-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 2px;
  opacity: 0.9;
  z-index: 1;
}

.cv-bq-meter-pin {
  position: absolute;
  top: -1px;
  width: 2px;
  height: 5px;
  margin-left: -1px;
  background: var(--t3);
  border-radius: 1px;
  z-index: 3;
  transform: translateX(-50%);
  opacity: 0.8;
}

.cv-bq-card.pos .cv-bq-meter-pin { background: #7dcea0; }
.cv-bq-card.neg .cv-bq-meter-pin { background: #f1948a; }
.cv-bq-card.zero .cv-bq-meter-pin { height: 3px; top: 0; }

@media (max-width: 520px) {
  .cv-bq-grid {
    grid-template-columns: 1fr;
  }

  .cv-bq-score {
    font-size: 17px;
  }
}
</style>
