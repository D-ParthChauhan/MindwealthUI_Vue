<template>
  <div class="ach-alerts">
    <template v-if="activeTab === 'system'">
      <div class="ow-admin-pill">ADMIN ONLY</div>
      <div class="ow-sys-block">
        <div
          v-for="check in systemChecks"
          :key="check.name"
          class="ow-sys-row"
          :class="check.status"
        >
          <span class="ow-sys-dot" />
          <span class="ow-sys-name">{{ check.name }}</span>
          <span class="ow-sys-detail">{{ check.detail }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="tabAlerts.length === 0">
      <div class="aa-empty runic-card">
        <div class="runic-card-hd">
          <div class="runic-card-title">
            {{ emptyTitle }}
          </div>
          <span class="runic-badge b-ok">CLEAR</span>
        </div>
        <div class="aa-empty-body">
          <div class="aa-empty-icon">{{ activeTab === 'signals' || activeTab === 'all' ? '✓' : '◎' }}</div>
          <template v-if="activeTab === 'signals' || activeTab === 'all'">
            <p>All FWD rates above the 60% floor.</p>
            <p class="aa-empty-meta">Next check · Weekly · Mon 08:00 NZDT</p>
          </template>
          <template v-else>
            <p>All macro variables within normal range.</p>
            <p class="aa-empty-meta">Next scan · Daily · 08:00 NZDT</p>
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <template v-for="alert in tabAlerts" :key="alert.id">
        <AnalystSignalAlertCard
          v-if="alert.type === 'degradation' && alert.signal"
          :label="alert.label"
          :signal="alert.signal"
          :recommendation="alert.recommendation"
          :fwd-trend="alert.fwd_trend"
        />
        <AnalystMacroAlertCard
          v-else-if="alert.type === 'runic' && alert.macro"
          :label="alert.label"
          :macro="alert.macro"
          :footer="alert.footer"
        />
        <article
          v-else
          class="ow-block"
          :class="alert.type === 'degradation' ? 'ruby' : 'gold'"
        >
          <div class="ow-block-label">{{ alert.label }}</div>
          <div class="ow-block-body" v-html="alert.html" />
          <div v-if="alert.recommendation" class="ow-rec">Recommend: {{ alert.recommendation }}</div>
          <div v-if="alert.footer" class="ow-footer">{{ alert.footer }}</div>
        </article>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AnalystTab } from '~/composables/useOverwatch'
import type { OverwatchPanelAlert, OverwatchSystemCheck } from '~/types/api'

const props = defineProps<{
  activeTab: AnalystTab
  tabAlerts: OverwatchPanelAlert[]
  systemChecks: OverwatchSystemCheck[]
}>()

const emptyTitle = computed(() => {
  if (props.activeTab === 'macro') return 'No runic conditions'
  return 'No signal alerts'
})
</script>

<style scoped>
.aa-empty {
  margin-bottom: 0;
}

.aa-empty-body {
  padding: 16px 14px 18px;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t2);
  line-height: 1.55;
}

.aa-empty-icon {
  font-size: 20px;
  opacity: 0.45;
  margin-bottom: 8px;
}

.aa-empty-meta {
  margin: 8px 0 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t4);
  letter-spacing: 0.4px;
}
</style>
