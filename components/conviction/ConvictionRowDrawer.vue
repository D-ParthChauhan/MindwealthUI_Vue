<template>
  <div class="cv-drawer" :class="{ open }">
    <div v-if="detail" class="cv-drawer-inner">
      <div v-if="detail.yieldTrap" class="cv-yt-banner">
        <strong>Yield trap active — BUY cancelled.</strong>
        Dividend yield 7.3% exceeds TSX 7% threshold AND is &gt;1.5σ above own 5Y mean. Hard gate: no override possible.
      </div>

      <div class="cv-drawer-head">
        <div class="cv-drawer-head-left">
          <div class="cv-score-ring" :class="ringClass(detail.conviction)">
            <div class="cv-score-ring-n" :class="convictionScoreClass(detail.conviction)">
              {{ formatConviction(detail.conviction) }}
            </div>
            <div class="cv-score-ring-l">conviction</div>
          </div>
          <div>
            <div class="cv-drawer-title">{{ detail.ticker }}</div>
            <div class="cv-drawer-sub">
              {{ detail.businessType }} · BQ {{ detail.bq > 0 ? '+' : '' }}{{ detail.bq }} + tax {{ detail.tax }} = {{ formatConviction(detail.conviction) }}
            </div>
          </div>
        </div>
        <div class="cv-drawer-head-actions">
          <button type="button" class="cv-link-btn" @click.stop="$emit('fs-page', detail.ticker)">
            <span class="m-lbl-long">Full FS page →</span><span class="m-lbl-short">FS →</span>
          </button>
          <button type="button" class="cv-drawer-close" aria-label="Close" @click.stop="$emit('close')">×</button>
        </div>
      </div>

      <div class="cv-meta-grid cv-meta-grid-drawer">
        <div class="cv-mg-item">
          <div class="cv-mg-l">BQ raw</div>
          <div class="cv-mg-v" :class="mgTone(detail.bq)">{{ detail.bq > 0 ? '+' : '' }}{{ detail.bq }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">Valuation tax</div>
          <div class="cv-mg-v" :class="mgTone(detail.tax)">{{ detail.tax > 0 ? '+' : '' }}{{ detail.tax }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">Conviction</div>
          <div class="cv-mg-v" :class="mgConvTone(detail.conviction)">{{ formatConviction(detail.conviction) }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">FS class</div>
          <div class="cv-mg-v">{{ detail.fsClass.replace('_', '-') }}</div>
        </div>
      </div>

      <div class="cv-dtabs">
        <button
          v-for="tab in drawerTabs"
          :key="tab.id"
          type="button"
          class="cv-dtab"
          :class="{ on: drawerTab === tab.id }"
          @click.stop="drawerTab = tab.id"
        >
          <span class="m-lbl-long">{{ tab.label }}</span>
          <span class="m-lbl-short">{{ tab.shortLabel }}</span>
        </button>
      </div>

      <div v-show="drawerTab === 'bq'" class="cv-dpanel">
        <div class="cv-dpanel-hint">
          <span class="m-lbl-long">15 BQ dimensions · green = positive · red = negative · auto = computed · manual = analyst input</span>
          <span class="m-lbl-short">15 BQ dims · +/− score · auto / manual</span>
        </div>
        <div v-for="dim in detail.dimensions" :key="dim.name" class="cv-bqbar-row">
          <div class="cv-bqbar-label">{{ dim.name }}</div>
          <div class="cv-bqbar-track">
            <div class="cv-bqbar-fill" :style="barStyle(dim.score)" />
            <div class="cv-bqbar-zero" />
          </div>
          <div class="cv-bqbar-score" :style="{ color: barColor(dim.score) }">
            {{ dim.score > 0 ? '+' : '' }}{{ dim.score }}
          </div>
          <div class="cv-bqbar-src">{{ dim.source }}</div>
        </div>
        <div class="cv-tax-note">
          <strong>Valuation tax:</strong> {{ detail.taxNote }}<br>
          <span class="cv-verdict-note">{{ detail.verdictNote }}</span>
        </div>
      </div>

      <div v-show="drawerTab === 'fs'" class="cv-dpanel">
        <div class="cv-fs-grid">
          <div class="cv-fs-block">
            <div class="cv-fs-bl">FS class</div>
            <div class="cv-fs-bv">{{ detail.fsClass.replace('_', '-') }}</div>
            <div class="cv-fs-cap">Long signal cap: {{ fsCapNote(detail.fsClass) }}</div>
          </div>
          <div class="cv-fs-block">
            <div class="cv-fs-bl">
              <span class="m-lbl-long">OEY (owner earnings yield)</span>
              <span class="m-lbl-short">OEY</span>
            </div>
            <div class="cv-fs-bv" :class="oeyClass(detail.oey)">{{ detail.oey }}%</div>
            <div class="cv-fs-cap">{{ detail.oeyFloorLabel }}</div>
          </div>
          <div class="cv-fs-block cv-fs-wide">
            <div class="cv-fs-bl">PE history (20Y percentile)</div>
            <div class="cv-pe-row">
              <div class="cv-pe-bar-wrap">
                <div class="cv-pe-bar">
                  <div class="cv-pe-fill" :style="peFillStyle(detail.pePercentile)" />
                  <div class="cv-pe-marker" :style="{ left: `${detail.pePercentile}%` }" />
                </div>
                <div class="cv-pe-labels"><span>cheap</span><span>median</span><span>expensive</span></div>
              </div>
              <div class="cv-pe-pct" :class="peClass(detail.pePercentile)">{{ detail.pePercentile }}th</div>
            </div>
            <div class="cv-fs-cap">
              <span class="m-lbl-long">Current PE: {{ detail.pe }}× · Computed using contemporaneous trailing-4Q EPS</span>
              <span class="m-lbl-short">PE: {{ detail.pe }}× · trailing-4Q EPS</span>
            </div>
          </div>
        </div>
      </div>

      <div v-show="drawerTab === 'fd'" class="cv-dpanel">
        <div class="cv-fd-split">
          <div>
            <div class="cv-fd-label">Overall direction</div>
            <div class="cv-fd-big" :class="fdClass(detail.fdDirection)">
              {{ fdBigLabel(detail.fdDirection) }}
            </div>
            <div class="cv-fs-cap">Size modifier: {{ fdSizeNote(detail.fdDirection) }}</div>
          </div>
          <div class="cv-fd-votes">
            <div class="cv-fd-label">5 direction votes</div>
            <div
              v-for="vote in detail.fdVotes"
              :key="vote.label"
              class="cv-fd-vote-row"
              :class="voteClass(vote.direction)"
            >
              <span class="cv-fd-icon">{{ voteIcon(vote.direction) }}</span>
              <span>{{ vote.label }}</span>
            </div>
            <div class="cv-fd-summary">{{ detail.fdSummary }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalDetail } from '~/types/conviction'
import {
  convictionScoreClass,
  fdClass,
  fdSizeNote,
  formatConviction,
  fsCapNote,
} from '~/utils/conviction-display'

const props = defineProps<{
  open: boolean
  detail?: ConvictionSignalDetail
  initialTab?: 'bq' | 'fs' | 'fd'
}>()

defineEmits<{ close: []; 'fs-page': [ticker: string] }>()

const drawerTab = ref<'bq' | 'fs' | 'fd'>('bq')

watch(() => props.open, (isOpen) => {
  if (isOpen) drawerTab.value = props.initialTab ?? 'bq'
})

const drawerTabs = [
  { id: 'bq' as const, label: 'BQ drilldown', shortLabel: 'BQ' },
  { id: 'fs' as const, label: 'FS + valuation', shortLabel: 'FS' },
  { id: 'fd' as const, label: 'fd direction', shortLabel: 'fd' },
]

function ringClass(score: number) {
  if (score >= 5) return ''
  if (score >= 2) return 'amber'
  return 'r'
}

function mgTone(n: number) {
  if (n > 0) return 'g'
  if (n < 0) return 'r'
  return ''
}

function mgConvTone(n: number) {
  if (n >= 5) return 'g'
  if (n >= 2) return 'a'
  return 'r'
}

function barColor(score: number) {
  if (score > 0) return '#27ae60'
  if (score < 0) return '#c0392b'
  return '#888'
}

function barStyle(score: number) {
  const bw = (Math.abs(score) / 2) * 36
  const left = score >= 0 ? 50 : 50 - bw
  return { background: barColor(score), width: `${bw}px`, left: `${left}%` }
}

function oeyClass(oey: number) {
  if (oey >= 4) return 'g'
  if (oey >= 2) return 'a'
  return 'r'
}

function peClass(pct: number) {
  if (pct > 80) return 'r'
  if (pct > 60) return 'a'
  return 'g'
}

function peFillStyle(pct: number) {
  const color = pct > 80 ? '#c0392b' : pct > 60 ? '#e67e22' : '#27ae60'
  return { width: `${pct}%`, background: color }
}

function fdBigLabel(fd: string) {
  if (fd === 'positive') return '▲ Positive'
  if (fd === 'negative') return '▼ Negative'
  return '→ Stable'
}

function voteClass(dir: string) {
  if (dir === 'positive') return 'pos'
  if (dir === 'negative') return 'neg'
  return 'sta'
}

function voteIcon(dir: string) {
  if (dir === 'positive') return '↑'
  if (dir === 'negative') return '↓'
  return '−'
}
</script>
