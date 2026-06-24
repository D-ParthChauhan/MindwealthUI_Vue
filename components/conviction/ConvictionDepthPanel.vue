<template>
  <div v-if="detail" class="cv-depth cv-dp card">
    <header class="cv-dp-hero" :class="heroTone">
      <div class="cv-dp-hero-row">
        <div>
          <div class="cv-dp-layer">{{ layerTitle }}</div>
          <h3 class="cv-dp-ticker">{{ detail.ticker }}</h3>
          <span class="cv-dp-btype">{{ detail.businessType }}</span>
        </div>
        <div class="cv-dp-score" :class="heroTone">
          <span class="cv-dp-score-n">{{ formatConviction(detail.conviction) }}</span>
          <span class="cv-dp-score-l">conviction</span>
        </div>
      </div>
    </header>

    <div class="cv-dp-stats">
      <div class="cv-dp-stat">
        <span class="cv-dp-stat-l">BQ</span>
        <span class="cv-dp-stat-v" :class="toneClass(detail.bq)">{{ signed(detail.bq) }}</span>
      </div>
      <div class="cv-dp-stat">
        <span class="cv-dp-stat-l">Tax</span>
        <span class="cv-dp-stat-v" :class="toneClass(detail.tax)">{{ signed(detail.tax) }}</span>
      </div>
      <div class="cv-dp-stat">
        <span class="cv-dp-stat-l">FS</span>
        <span class="cv-dp-stat-v">{{ detail.fsClass.replace('_', '-') }}</span>
      </div>
      <div class="cv-dp-stat">
        <span class="cv-dp-stat-l">FD</span>
        <span class="cv-dp-stat-v" :class="fdClass(detail.fdDirection)">{{ fdShort(detail.fdDirection) }}</span>
      </div>
    </div>

    <div v-if="layer === 'yt' && detail.yieldTrap" class="cv-dp-yt">
      <strong>Yield trap active</strong> — BUY cancelled. No override possible.
    </div>

    <div class="cv-dp-body">
      <template v-if="layer === 'bq'">
        <ConvictionBqDimGrid :dimensions="detail.dimensions" />
      </template>

      <template v-else-if="layer === 'val'">
        <div class="cv-dp-val-grid">
          <div class="cv-dp-val-block">
            <span class="cv-dp-block-title">Tax breakdown</span>
            <div v-if="taxParts.length" class="cv-dp-tags">
              <span v-for="part in taxParts" :key="part.label" class="cv-dp-tag" :class="{ total: part.total }">{{ part.label }}</span>
            </div>
            <span v-else class="cv-dp-empty">No breakdown available</span>
          </div>
          <div class="cv-dp-val-block">
            <span class="cv-dp-block-title">Verdict</span>
            <p v-if="detail.verdictNote" class="cv-dp-verdict">{{ detail.verdictNote }}</p>
            <span v-else class="cv-dp-empty">No verdict note</span>
          </div>
        </div>
      </template>

      <template v-else-if="layer === 'fs'">
        <div class="cv-dp-fs-grid">
          <div class="cv-dp-fs-card">
            <span class="cv-dp-fs-l">FS class</span>
            <span class="cv-dp-fs-v">{{ detail.fsClass.replace('_', ' ') }}</span>
            <span class="cv-dp-fs-cap">{{ fsCapNote(detail.fsClass) }}</span>
          </div>
          <div class="cv-dp-fs-card">
            <span class="cv-dp-fs-l">OEY</span>
            <span class="cv-dp-fs-v" :class="oeyTone(detail.oey)">{{ detail.oey }}%</span>
          </div>
          <div class="cv-dp-fs-card wide">
            <span class="cv-dp-fs-l">PE percentile (20Y)</span>
            <div class="cv-dp-pe">
              <div class="cv-dp-pe-track">
                <div class="cv-dp-pe-fill" :style="peFillStyle(detail.pePercentile)" />
                <div class="cv-dp-pe-pin" :style="{ left: `${detail.pePercentile}%` }" />
              </div>
              <span class="cv-dp-pe-val" :class="peTone(detail.pePercentile)">{{ detail.pePercentile }}th</span>
            </div>
            <span class="cv-dp-fs-cap">PE {{ detail.pe }}× trailing</span>
          </div>
        </div>
      </template>

      <template v-else-if="layer === 'fd'">
        <div class="cv-dp-fd">
          <div>
            <span class="cv-dp-fs-l">Direction</span>
            <div class="cv-dp-fd-big" :class="fdClass(detail.fdDirection)">{{ fdBigLabel(detail.fdDirection) }}</div>
            <span class="cv-dp-fs-cap">{{ fdSizeNote(detail.fdDirection) }}</span>
          </div>
          <div>
            <span class="cv-dp-fs-l">Votes</span>
            <div v-for="vote in detail.fdVotes" :key="vote.label" class="cv-dp-vote" :class="voteClass(vote.direction)">
              <span>{{ voteIcon(vote.direction) }}</span>
              <span>{{ vote.label }}</span>
            </div>
            <p v-if="detail.fdSummary" class="cv-dp-fs-cap">{{ detail.fdSummary }}</p>
          </div>
        </div>
      </template>

      <template v-else-if="layer === 'yt'">
        <p v-if="!detail.yieldTrap" class="cv-dp-empty">No yield trap on this ticker.</p>
        <p v-else-if="detail.taxNote" class="cv-dp-verdict">{{ detail.taxNote }}</p>
      </template>
    </div>
  </div>
  <div v-else class="cv-depth cv-dp-empty card">
    <p>Select a signal chip above · then pick an engine layer in the sidebar</p>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalDetail } from '~/types/conviction'
import { formatConviction, fdClass, fdSizeNote, fsCapNote, parseTaxNoteParts } from '~/utils/conviction-display'

const props = defineProps<{
  layer: string
  detail?: ConvictionSignalDetail
}>()

const taxParts = computed(() =>
  props.detail?.taxNote ? parseTaxNoteParts(props.detail.taxNote) : [],
)

const heroTone = computed(() => {
  const s = props.detail?.conviction ?? 0
  if (s >= 5) return 'tone-g'
  if (s >= 2) return 'tone-a'
  return 'tone-r'
})

const layerTitle = computed(() => {
  switch (props.layer) {
    case 'val': return 'Valuation tax'
    case 'fs': return 'Financial strength'
    case 'fd': return 'Fundamental direction'
    case 'yt': return 'Yield trap gate'
    default: return 'Business quality'
  }
})

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function toneClass(n: number) {
  if (n > 0) return 'tone-g'
  if (n < 0) return 'tone-r'
  return ''
}

function oeyTone(oey: number) {
  if (oey >= 4) return 'tone-g'
  if (oey >= 2) return 'tone-a'
  return 'tone-r'
}

function peTone(pct: number) {
  if (pct > 80) return 'tone-r'
  if (pct > 60) return 'tone-a'
  return 'tone-g'
}

function peFillStyle(pct: number) {
  const color = pct > 80 ? 'var(--red)' : pct > 60 ? 'var(--amber)' : 'var(--green)'
  return { width: `${pct}%`, background: color }
}

function fdShort(fd: string) {
  if (fd === 'positive') return '▲ pos'
  if (fd === 'negative') return '▼ neg'
  return '→ sta'
}

function fdBigLabel(fd: string) {
  if (fd === 'positive') return 'Positive'
  if (fd === 'negative') return 'Negative'
  return 'Stable'
}

function voteClass(dir: string) {
  if (dir === 'positive') return 'pos'
  if (dir === 'negative') return 'neg'
  return 'sta'
}

function voteIcon(dir: string) {
  if (dir === 'positive') return '↑'
  if (dir === 'negative') return '↓'
  return '→'
}
</script>

<style scoped>
.cv-dp {
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
}

.cv-dp-empty {
  padding: 24px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t3);
}

.cv-dp-hero {
  padding: 14px 16px;
  border-bottom: 1px solid var(--b1);
  border-left: 3px solid var(--gold);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.08) 0%, transparent 45%), var(--s1);
}

.cv-dp-hero.tone-g { border-left-color: var(--green); background: linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, transparent 42%), var(--s1); }
.cv-dp-hero.tone-a { border-left-color: var(--amber); background: linear-gradient(135deg, rgba(230, 126, 34, 0.1) 0%, transparent 42%), var(--s1); }
.cv-dp-hero.tone-r { border-left-color: var(--red); background: linear-gradient(135deg, rgba(192, 57, 43, 0.12) 0%, transparent 42%), var(--s1); }

.cv-dp-hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.cv-dp-layer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--purple);
  margin-bottom: 4px;
}

.cv-dp-ticker {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.cv-dp-btype {
  display: inline-block;
  margin-top: 5px;
  font-size: 10px;
  color: var(--t3);
  text-transform: capitalize;
}

.cv-dp-score {
  min-width: 64px;
  min-height: 64px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 2px solid var(--b3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
}

.cv-dp-score.tone-g { border-color: rgba(39, 174, 96, 0.6); }
.cv-dp-score.tone-a { border-color: rgba(230, 126, 34, 0.6); }
.cv-dp-score.tone-r { border-color: rgba(231, 76, 60, 0.6); }

.cv-dp-score-n {
  font-family: 'JetBrains Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.cv-dp-score-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  text-transform: uppercase;
  color: var(--t3);
  margin-top: 2px;
}

.cv-dp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--b1);
  border-bottom: 1px solid var(--b1);
}

.cv-dp-stat {
  padding: 10px 12px;
  background: var(--s2);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cv-dp-stat-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t3);
}

.cv-dp-stat-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}

.cv-dp-stat-v.tone-g, .cv-dp-fs-v.tone-g, .cv-dp-pe-val.tone-g { color: #7dcea0; }
.cv-dp-stat-v.tone-a, .cv-dp-fs-v.tone-a, .cv-dp-pe-val.tone-a { color: #f0b27a; }
.cv-dp-stat-v.tone-r, .cv-dp-fs-v.tone-r, .cv-dp-pe-val.tone-r { color: #f1948a; }

.cv-dp-yt {
  padding: 10px 16px;
  font-size: 11px;
  color: #f1948a;
  background: rgba(192, 57, 43, 0.1);
  border-bottom: 1px solid rgba(231, 76, 60, 0.3);
}

.cv-dp-body {
  max-height: min(48vh, 420px);
  overflow-y: auto;
  padding: 10px 12px 12px;
  -webkit-overflow-scrolling: touch;
}

.cv-dp-val-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cv-dp-val-block {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--b1);
  background: rgba(0, 0, 0, 0.2);
}

.cv-dp-block-title {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 8px;
}

.cv-dp-tags { display: flex; flex-wrap: wrap; gap: 5px; }

.cv-dp-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--b2);
  color: var(--t2);
}

.cv-dp-tag.total { border-color: rgba(201, 168, 76, 0.4); color: var(--gold); }

.cv-dp-verdict {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  line-height: 1.55;
  color: #7dcea0;
}

.cv-dp-empty { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--t4); font-style: italic; }

.cv-dp-fs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cv-dp-fs-card {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--b1);
  background: rgba(255, 255, 255, 0.02);
}

.cv-dp-fs-card.wide { grid-column: 1 / -1; }

.cv-dp-fs-l {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--t3);
  margin-bottom: 5px;
}

.cv-dp-fs-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.cv-dp-fs-cap {
  display: block;
  margin-top: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t3);
}

.cv-dp-pe { display: flex; align-items: center; gap: 10px; margin: 4px 0; }

.cv-dp-pe-track {
  flex: 1;
  height: 8px;
  background: var(--b2);
  border-radius: 4px;
  position: relative;
}

.cv-dp-pe-fill { height: 100%; border-radius: 4px; }

.cv-dp-pe-pin {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 12px;
  background: #fff;
  transform: translateX(-50%);
}

.cv-dp-pe-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
}

.cv-dp-fd {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 14px;
}

.cv-dp-fd-big {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  margin: 4px 0 6px;
}

.cv-dp-vote {
  display: flex;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t2);
  padding: 5px 0;
  border-bottom: 1px solid var(--b1);
}

.cv-dp-vote.pos { color: #7dcea0; }
.cv-dp-vote.neg { color: #f1948a; }

@media (max-width: 900px) {
  .cv-dp-stats { grid-template-columns: repeat(2, 1fr); }
  .cv-dp-val-grid, .cv-dp-fs-grid, .cv-dp-fd { grid-template-columns: 1fr; }
}
</style>
