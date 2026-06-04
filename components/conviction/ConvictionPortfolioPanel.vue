<template>
  <div>
    <div class="cv-section-hint" style="margin-bottom:10px">Current held positions — conviction monitored daily</div>
    <div class="cv-portfolio-grid">
      <div
        v-for="card in portfolio"
        :key="card.ticker"
        class="cv-port-card"
        :class="portBorderClass(card.borderClass)"
      >
        <div class="cv-port-head">
          <div>
            <div class="cv-port-ticker">{{ card.ticker }}</div>
            <div class="cv-port-sub">{{ card.name }} · {{ card.businessType }}</div>
          </div>
          <span class="cvb" :class="verdictBadgeClass(card.verdict)">{{ shortVerdict(card.verdict) }}</span>
        </div>
        <div class="cv-port-stats">
          <span>MTM: <strong :style="{ color: card.mtmPositive ? '#27ae60' : '#c0392b' }">{{ card.mtm }}</strong></span>
          <span>Conv: <strong :style="{ color: card.convictionScore >= 2 ? '#27ae60' : '#c0392b' }">{{ formatConviction(card.convictionScore) }}</strong></span>
        </div>
        <div class="cv-port-note" :style="{ color: card.actionColor }">{{ card.actionNote }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConvictionPortfolioCard, ConvictionVerdict } from '~/types/conviction'
import { formatConviction, verdictBadgeClass } from '~/utils/conviction-display'

defineProps<{ portfolio: ConvictionPortfolioCard[] }>()

function shortVerdict(v: ConvictionVerdict) {
  if (v === 'MAX CONVICTION') return 'MAX'
  return v
}

function portBorderClass(b: ConvictionPortfolioCard['borderClass']) {
  if (b === 'hold') return 'cv-port-hold'
  if (b === 'monitor') return 'cv-port-monitor'
  return 'cv-port-review'
}
</script>
