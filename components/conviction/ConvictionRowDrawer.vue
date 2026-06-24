<template>
  <div class="cv-drawer" :class="{ open }">
    <div v-if="detail" class="cv-drawer-inner cv-dr">
      <div v-if="detail.yieldTrap" class="cv-dr-yt">
        <span class="cv-dr-yt-icon">⚠</span>
        <div>
          <strong>Yield trap — BUY cancelled</strong>
          <span>Dividend yield exceeds threshold. Hard gate with no override.</span>
        </div>
      </div>

      <div class="cv-dr-hero-wrap mw-glass-hero-wrap">
        <header class="cv-dr-hero mw-glass-hero" :class="heroTone">
        <div class="cv-dr-hero-top">
          <div class="cv-dr-identity">
            <div class="cv-dr-score" :class="heroTone">
              <span class="cv-dr-score-n">{{ formatConviction(detail.conviction) }}</span>
              <span class="cv-dr-score-l">conviction</span>
            </div>
            <div class="cv-dr-title-block">
              <h3 class="cv-dr-ticker">{{ detail.ticker }}</h3>
              <span class="cv-dr-btype">{{ detail.businessType || 'equity' }}</span>
            </div>
          </div>
          <div class="cv-dr-actions">
            <button type="button" class="cv-dr-link" @click.stop="$emit('fs-page', detail.ticker)">
              <span class="m-lbl-long">Full FS view</span>
              <span class="m-lbl-short">FS</span>
              <span class="cv-dr-link-arrow">→</span>
            </button>
            <button type="button" class="cv-dr-close" aria-label="Close" @click.stop="$emit('close')">×</button>
          </div>
        </div>

        <div class="cv-dr-formula" aria-label="Conviction formula">
          <span class="cv-dr-formula-chip">
            <span class="cv-dr-formula-k">BQ</span>
            <span class="cv-dr-formula-v" :class="toneClass(detail.bq)">{{ signed(detail.bq) }}</span>
          </span>
          <span class="cv-dr-formula-op">+</span>
          <span class="cv-dr-formula-chip">
            <span class="cv-dr-formula-k">Tax</span>
            <span class="cv-dr-formula-v" :class="toneClass(detail.tax)">{{ signed(detail.tax) }}</span>
          </span>
          <span class="cv-dr-formula-op">=</span>
          <span class="cv-dr-formula-chip result" :class="heroTone">
            <span class="cv-dr-formula-k">Net</span>
            <span class="cv-dr-formula-v">{{ formatConviction(detail.conviction) }}</span>
          </span>
        </div>
        </header>
      </div>

      <div class="cv-dr-stats">
        <div v-for="stat in statTiles" :key="stat.label" class="cv-dr-stat" :class="stat.tone">
          <span class="cv-dr-stat-l">{{ stat.label }}</span>
          <span class="cv-dr-stat-v">{{ stat.value }}</span>
        </div>
      </div>

      <nav class="cv-dr-tabs" role="tablist">
        <button
          v-for="tab in drawerTabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="cv-dr-tab"
          :class="{ on: drawerTab === tab.id }"
          :aria-selected="drawerTab === tab.id"
          @click.stop="drawerTab = tab.id"
        >
          <span class="m-lbl-long">{{ tab.label }}</span>
          <span class="m-lbl-short">{{ tab.shortLabel }}</span>
        </button>
      </nav>

      <div class="cv-dr-body">
        <div v-show="drawerTab === 'bq'" class="cv-dr-panel">
          <p class="cv-dr-panel-lead">
            15 business-quality dimensions ·
            <span class="pos">positive</span> /
            <span class="neg">negative</span> scoring
          </p>

          <ConvictionBqDimGrid :dimensions="detail.dimensions" />

          <div v-if="taxParts.length || detail.verdictNote" class="cv-dr-foot">
            <div v-if="taxParts.length" class="cv-dr-foot-block">
              <span class="cv-dr-foot-title">Valuation tax</span>
              <div class="cv-dr-tags">
                <span
                  v-for="part in taxParts"
                  :key="part.label"
                  class="cv-dr-tag"
                  :class="{ total: part.total }"
                >{{ part.label }}</span>
              </div>
            </div>
            <div v-if="detail.verdictNote" class="cv-dr-foot-block">
              <span class="cv-dr-foot-title">Verdict</span>
              <p class="cv-dr-verdict">{{ detail.verdictNote }}</p>
            </div>
          </div>
        </div>

        <div v-show="drawerTab === 'fs'" class="cv-dr-panel">
          <div class="cv-dr-fs-grid">
            <div class="cv-dr-fs-card">
              <span class="cv-dr-fs-l">FS class</span>
              <span class="cv-dr-fs-v">{{ detail.fsClass.replace('_', ' ') }}</span>
              <span class="cv-dr-fs-cap">Cap: {{ fsCapNote(detail.fsClass) }}</span>
            </div>
            <div class="cv-dr-fs-card">
              <span class="cv-dr-fs-l">Owner earnings yield</span>
              <span class="cv-dr-fs-v" :class="oeyClass(detail.oey)">{{ detail.oey }}%</span>
              <span class="cv-dr-fs-cap">{{ detail.oeyFloorLabel || 'OEY floor by business type' }}</span>
            </div>
            <div class="cv-dr-fs-card wide">
              <span class="cv-dr-fs-l">PE · 20Y percentile</span>
              <div class="cv-dr-pe">
                <div class="cv-dr-pe-track">
                  <div class="cv-dr-pe-fill" :style="peFillStyle(detail.pePercentile)" />
                  <div class="cv-dr-pe-pin" :style="{ left: `${detail.pePercentile}%` }" />
                </div>
                <span class="cv-dr-pe-val" :class="peClass(detail.pePercentile)">{{ detail.pePercentile }}th</span>
              </div>
              <span class="cv-dr-fs-cap">Trailing PE {{ detail.pe }}×</span>
            </div>
          </div>
        </div>

        <div v-show="drawerTab === 'fd'" class="cv-dr-panel">
          <div class="cv-dr-fd">
            <div class="cv-dr-fd-main">
              <span class="cv-dr-fs-l">Direction consensus</span>
              <div class="cv-dr-fd-big" :class="fdClass(detail.fdDirection)">
                {{ fdBigLabel(detail.fdDirection) }}
              </div>
              <span class="cv-dr-fs-cap">{{ fdSizeNote(detail.fdDirection) }}</span>
            </div>
            <div class="cv-dr-fd-votes">
              <span class="cv-dr-fs-l">Five votes</span>
              <div
                v-for="vote in detail.fdVotes"
                :key="vote.label"
                class="cv-dr-vote"
                :class="voteClass(vote.direction)"
              >
                <span class="cv-dr-vote-icon">{{ voteIcon(vote.direction) }}</span>
                <span>{{ vote.label }}</span>
              </div>
              <p v-if="detail.fdSummary" class="cv-dr-fd-summary">{{ detail.fdSummary }}</p>
              <p v-else-if="!detail.fdVotes.length" class="cv-dr-empty">No direction votes on file</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalDetail } from '~/types/conviction'
import {
  fdClass,
  fdSizeNote,
  formatConviction,
  fsCapNote,
  parseTaxNoteParts,
} from '~/utils/conviction-display'

const props = defineProps<{
  open: boolean
  detail?: ConvictionSignalDetail
  initialTab?: 'bq' | 'fs' | 'fd'
}>()

defineEmits<{ close: []; 'fs-page': [ticker: string] }>()

const drawerTab = ref<'bq' | 'fs' | 'fd'>('bq')

const taxParts = computed(() =>
  props.detail?.taxNote ? parseTaxNoteParts(props.detail.taxNote) : [],
)

const heroTone = computed(() => {
  const s = props.detail?.conviction ?? 0
  if (s >= 5) return 'tone-g'
  if (s >= 2) return 'tone-a'
  return 'tone-r'
})

const statTiles = computed(() => {
  const d = props.detail
  if (!d) return []
  return [
    { label: 'BQ raw', value: signed(d.bq), tone: toneKey(d.bq) },
    { label: 'Valuation tax', value: signed(d.tax), tone: toneKey(d.tax) },
    { label: 'Conviction', value: formatConviction(d.conviction), tone: heroTone.value.replace('tone-', '') },
    { label: 'FS class', value: d.fsClass.replace('_', '-'), tone: '' },
  ]
})

watch(() => props.open, (isOpen) => {
  if (isOpen) drawerTab.value = props.initialTab ?? 'bq'
})

const drawerTabs = [
  { id: 'bq' as const, label: 'BQ dimensions', shortLabel: 'BQ' },
  { id: 'fs' as const, label: 'Financial strength', shortLabel: 'FS' },
  { id: 'fd' as const, label: 'Fundamental direction', shortLabel: 'FD' },
]

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function toneKey(n: number) {
  if (n > 0) return 'g'
  if (n < 0) return 'r'
  return ''
}

function toneClass(n: number) {
  const k = toneKey(n)
  return k ? `tone-${k}` : ''
}

function oeyClass(oey: number) {
  if (oey >= 4) return 'tone-g'
  if (oey >= 2) return 'tone-a'
  return 'tone-r'
}

function peClass(pct: number) {
  if (pct > 80) return 'tone-r'
  if (pct > 60) return 'tone-a'
  return 'tone-g'
}

function peFillStyle(pct: number) {
  const color = pct > 80 ? 'var(--red)' : pct > 60 ? 'var(--amber)' : 'var(--green)'
  return { width: `${pct}%`, background: color }
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
.cv-dr {
  padding: 0;
  overflow: hidden;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.cv-dr-yt {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 16px;
  background: rgba(192, 57, 43, 0.12);
  border-bottom: 1px solid rgba(231, 76, 60, 0.35);
  font-size: 11px;
  line-height: 1.45;
  color: #f1948a;
}

.cv-dr-yt strong {
  display: block;
  color: #fff;
  margin-bottom: 2px;
}

.cv-dr-yt-icon {
  font-size: 16px;
  line-height: 1;
}

.cv-dr-hero-wrap {
  padding: 12px 14px 0;
}

.cv-dr-hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.cv-dr-actions,
.cv-dr-title-block {
  position: relative;
  z-index: 1;
}

.cv-dr-identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.cv-dr-score {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.25);
}

.cv-dr-score.tone-g {
  border-color: rgba(39, 174, 96, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(125, 206, 160, 0.2),
    0 0 20px rgba(39, 174, 96, 0.15);
}

.cv-dr-score.tone-a {
  border-color: rgba(230, 126, 34, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(240, 178, 122, 0.2),
    0 0 20px rgba(230, 126, 34, 0.12);
}

.cv-dr-score.tone-r {
  border-color: rgba(231, 76, 60, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(241, 148, 138, 0.2),
    0 0 20px rgba(231, 76, 60, 0.14);
}

.cv-dr-score-n {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.cv-dr-score-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t3);
  margin-top: 3px;
}

.cv-dr-ticker {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
  line-height: 1.1;
  margin: 0;
}

.cv-dr-btype {
  display: inline-block;
  margin-top: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t2);
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-transform: capitalize;
}

.cv-dr-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cv-dr-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--gold);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.cv-dr-link:hover {
  background: rgba(201, 168, 76, 0.14);
  border-color: rgba(201, 168, 76, 0.5);
}

.cv-dr-link-arrow {
  opacity: 0.85;
}

.cv-dr-close {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--t3);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.cv-dr-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.cv-dr-formula {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cv-dr-formula-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.cv-dr-formula-chip.result {
  border-color: rgba(255, 255, 255, 0.12);
}

.cv-dr-formula-chip.result.tone-g {
  border-color: rgba(39, 174, 96, 0.35);
  background: rgba(39, 174, 96, 0.1);
  box-shadow: inset 0 1px 0 rgba(125, 206, 160, 0.15), 0 0 12px rgba(39, 174, 96, 0.1);
}

.cv-dr-formula-chip.result.tone-a {
  border-color: rgba(230, 126, 34, 0.35);
  background: rgba(230, 126, 34, 0.1);
  box-shadow: inset 0 1px 0 rgba(240, 178, 122, 0.15), 0 0 12px rgba(230, 126, 34, 0.08);
}

.cv-dr-formula-chip.result.tone-r {
  border-color: rgba(231, 76, 60, 0.4);
  background: rgba(192, 57, 43, 0.12);
  box-shadow: inset 0 1px 0 rgba(241, 148, 138, 0.15), 0 0 12px rgba(231, 76, 60, 0.1);
}

.cv-dr-formula-k {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--t3);
}

.cv-dr-formula-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.cv-dr-formula-v.tone-g { color: #7dcea0; }
.cv-dr-formula-v.tone-a { color: #f0b27a; }
.cv-dr-formula-v.tone-r { color: #f1948a; }

.cv-dr-formula-op {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--t4);
}

.cv-dr-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--b1);
  border-bottom: 1px solid var(--b1);
}

.cv-dr-stat {
  padding: 12px 14px;
  background: var(--s2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cv-dr-stat.g .cv-dr-stat-v { color: #7dcea0; }
.cv-dr-stat.r .cv-dr-stat-v { color: #f1948a; }
.cv-dr-stat.a .cv-dr-stat-v { color: #f0b27a; }

.cv-dr-stat-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: var(--t3);
}

.cv-dr-stat-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}

.cv-dr-tabs {
  display: flex;
  gap: 0;
  padding: 0 14px;
  border-bottom: 1px solid var(--b1);
  background: rgba(0, 0, 0, 0.2);
}

.cv-dr-tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3px;
  padding: 11px 14px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--t3);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.cv-dr-tab:hover {
  color: var(--t2);
}

.cv-dr-tab.on {
  color: #fff;
  border-bottom-color: var(--gold);
}

.cv-dr-body {
  max-height: min(46vh, 440px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.cv-dr-panel {
  padding: 14px 16px 16px;
}

.cv-dr-panel-lead {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t4);
  margin: 0 0 8px;
  line-height: 1.4;
}

.cv-dr-panel-lead .pos { color: #7dcea0; }
.cv-dr-panel-lead .neg { color: #f1948a; }

.cv-dr-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--b1);
}

.cv-dr-foot-title {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 8px;
}

.cv-dr-foot-block {
  padding: 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--b1);
}

.cv-dr-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.cv-dr-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--b2);
  color: var(--t2);
}

.cv-dr-tag.total {
  border-color: rgba(201, 168, 76, 0.4);
  color: var(--gold);
  font-weight: 600;
}

.cv-dr-verdict {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  line-height: 1.55;
  color: #7dcea0;
}

.cv-dr-fs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cv-dr-fs-card {
  padding: 14px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--b1);
}

.cv-dr-fs-card.wide {
  grid-column: 1 / -1;
}

.cv-dr-fs-l {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 6px;
}

.cv-dr-fs-v {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}

.cv-dr-fs-v.tone-g { color: #7dcea0; }
.cv-dr-fs-v.tone-a { color: #f0b27a; }
.cv-dr-fs-v.tone-r { color: #f1948a; }

.cv-dr-fs-cap {
  display: block;
  margin-top: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  line-height: 1.4;
}

.cv-dr-pe {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 8px;
}

.cv-dr-pe-track {
  flex: 1;
  height: 10px;
  background: var(--b2);
  border-radius: 5px;
  position: relative;
  overflow: visible;
}

.cv-dr-pe-fill {
  height: 100%;
  border-radius: 5px;
  opacity: 0.85;
}

.cv-dr-pe-pin {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 16px;
  background: #fff;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
}

.cv-dr-pe-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.cv-dr-fd {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 1.4fr;
  gap: 16px;
}

.cv-dr-fd-big {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 600;
  margin: 4px 0 8px;
}

.cv-dr-vote {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: var(--t2);
  padding: 6px 0;
  border-bottom: 1px solid var(--b1);
}

.cv-dr-vote:last-of-type {
  border-bottom: none;
}

.cv-dr-vote.pos { color: #7dcea0; }
.cv-dr-vote.neg { color: #f1948a; }

.cv-dr-vote-icon {
  width: 18px;
  text-align: center;
  font-weight: 700;
}

.cv-dr-fd-summary,
.cv-dr-empty {
  margin: 10px 0 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t3);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .cv-dr-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cv-dr-foot {
    grid-template-columns: 1fr;
  }

  .cv-dr-fd {
    grid-template-columns: 1fr;
  }

  .cv-dr-fs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
