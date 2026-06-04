<template>
  <div v-if="detail" class="cv-depth card">
    <div class="cv-depth-hd">
      <div>
        <div class="cv-depth-title">{{ layerTitle }}</div>
        <div class="cv-depth-sub">{{ detail.ticker }} · {{ detail.businessType }}</div>
      </div>
      <div class="cv-meta-grid">
        <div class="cv-mg-item">
          <div class="cv-mg-l">BQ raw</div>
          <div class="cv-mg-v" :class="scoreTone(detail.bq)">{{ detail.bq > 0 ? '+' : '' }}{{ detail.bq }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">Valuation tax</div>
          <div class="cv-mg-v" :class="scoreTone(detail.tax)">{{ detail.tax > 0 ? '+' : '' }}{{ detail.tax }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">Conviction</div>
          <div class="cv-mg-v" :class="convTone(detail.conviction)">{{ formatConviction(detail.conviction) }}</div>
        </div>
        <div class="cv-mg-item">
          <div class="cv-mg-l">FS class</div>
          <div class="cv-mg-v">{{ detail.fsClass.replace('_', '-') }}</div>
        </div>
      </div>
    </div>

    <div v-if="layer === 'yt' && detail.yieldTrap" class="cv-yt-banner">
      <strong>Yield trap active — BUY cancelled.</strong>
      Dividend yield exceeds TSX threshold. Hard gate: no override possible.
    </div>

    <div v-if="layer === 'bq'" class="cv-depth-body">
      <div class="cv-dpanel-hint">15 BQ dimensions · 7 auto + 8 manual</div>
      <div
        v-for="(dim, i) in detail.dimensions"
        :key="dim.name"
        class="bq-row"
        :class="{ 'bq-warn': dim.score < 0 && dim.name.toLowerCase().includes('coverage') }"
      >
        <div class="bq-num">{{ i + 1 }}</div>
        <div class="bq-name">{{ dim.name }}</div>
        <div class="bq-s" :class="dimScoreClass(dim.score)">{{ dim.score > 0 ? '+' : '' }}{{ dim.score }}</div>
        <div class="bq-src">{{ dim.source }}</div>
      </div>
    </div>

    <div v-else-if="layer === 'val'" class="cv-depth-body">
      <div class="cv-tax-note">
        <strong>Valuation tax breakdown</strong><br>
        {{ detail.taxNote }}
      </div>
      <div class="cv-tax-note" style="margin-top:8px">
        <strong>Verdict note</strong><br>
        <span class="cv-verdict-note">{{ detail.verdictNote }}</span>
      </div>
    </div>

    <div v-else-if="layer === 'fs'" class="cv-depth-body">
      <div class="cv-fs-grid">
        <div class="cv-fs-block">
          <div class="cv-fs-bl">FS class</div>
          <div class="cv-fs-bv">{{ detail.fsClass.replace('_', '-') }}</div>
          <div class="cv-fs-cap">Long signal cap: {{ fsCapNote(detail.fsClass) }}</div>
        </div>
        <div class="cv-fs-block">
          <div class="cv-fs-bl">OEY</div>
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
          <div class="cv-fs-cap">Current PE: {{ detail.pe }}× · trailing-4Q EPS</div>
        </div>
      </div>
    </div>

    <div v-else-if="layer === 'fd'" class="cv-depth-body">
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

    <div v-else-if="layer === 'yt'" class="cv-depth-body">
      <div v-if="detail.yieldTrap" class="cv-tax-note">
        {{ detail.taxNote }}
      </div>
      <div v-else class="cv-dpanel-hint">No yield trap active for this ticker.</div>
    </div>
  </div>
  <div v-else class="cv-depth cv-depth-empty card">
    <div class="cv-dpanel-hint">Select a signal chip to open depth view · Engine layers in sidebar</div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionSignalDetail } from '~/types/conviction'
import { formatConviction, fdClass, fdSizeNote, fsCapNote } from '~/utils/conviction-display'

const props = defineProps<{
  layer: string
  detail?: ConvictionSignalDetail
}>()

const layerTitle = computed(() => {
  switch (props.layer) {
    case 'val': return 'Valuation Tax · sector-calibrated'
    case 'fs': return 'FS Cap · graduated sizing'
    case 'fd': return 'fd direction · 5-vote consensus'
    case 'yt': return 'Yield Trap · 2-condition hard gate'
    default: return 'BQ Score · 15 dimensions'
  }
})

function scoreTone(n: number) {
  if (n > 0) return 'g'
  if (n < 0) return 'r'
  return ''
}

function convTone(n: number) {
  if (n >= 5) return 'g'
  if (n >= 2) return 'a'
  return 'r'
}

function dimScoreClass(score: number) {
  if (score > 0) return 'pos'
  if (score < 0) return 'neg'
  return 'zero'
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
  return '→'
}
</script>

<style scoped>
.bq-warn { border-color: rgba(192, 57, 43, 0.25) !important; }
</style>
