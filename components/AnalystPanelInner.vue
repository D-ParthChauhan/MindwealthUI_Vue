<template>
  <aside
    class="cpanel"
    :class="{ open: embedded || isOpen, 'cpanel-embed': embedded }"
    aria-label="AI Analyst panel"
  >
    <div class="cph">
      <div class="cph-icon">💬</div>
      <div class="cph-main">
        <div class="cpt">AI ANALYST</div>
        <div class="cp-badge">{{ badgeText }}</div>
      </div>
      <button
        v-if="!embedded"
        type="button"
        class="cph-close"
        aria-label="Close"
        @click="close"
      >
        ✕
      </button>
    </div>

    <div class="cp-tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        type="button"
        class="cp-tab"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="cp-body">
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
        <div class="ow-empty">
          <div class="ow-empty-icon">{{ activeTab === 'signals' ? '✓' : '◎' }}</div>
          <template v-if="activeTab === 'signals' || activeTab === 'all'">
            <div>NO ACTIVE SIGNAL ALERTS</div>
            <div>ALL FWD RATES ABOVE 60% FLOOR</div>
            <div>NEXT CHECK: WEEKLY · MON 08:00 NZDT</div>
          </template>
          <template v-else>
            <div>NO RUNIC CONDITIONS ACTIVE</div>
            <div>ALL MACRO VARIABLES WITHIN NORMAL RANGE</div>
            <div>NEXT SCAN: DAILY · 08:00 NZDT</div>
          </template>
        </div>
      </template>

      <template v-else>
        <article
          v-for="alert in tabAlerts"
          :key="alert.id"
          class="ow-block"
          :class="alert.type === 'degradation' ? 'ruby' : 'gold'"
        >
          <div class="ow-block-label">{{ alert.label }}</div>
          <div class="ow-block-body" v-html="alert.html" />
          <div v-if="alert.fwd_trend?.length" class="ow-trend">
            <div class="ow-trend-head">
              <span>4-WK FWD RATE</span>
              <span class="ow-floor">60% FLOOR</span>
            </div>
            <div class="ow-trend-bars">
              <div v-for="(val, i) in alert.fwd_trend" :key="i" class="ow-trend-bar-wrap">
                <div class="ow-trend-bar" :style="{ height: `${val}%` }" />
                <div class="ow-trend-val">{{ val }}%</div>
              </div>
              <div class="ow-floor-line" />
            </div>
          </div>
          <div v-if="alert.recommendation" class="ow-rec">Recommend: {{ alert.recommendation }}</div>
          <div v-if="alert.footer" class="ow-footer">{{ alert.footer }}</div>
        </article>
      </template>

      <div v-if="chatMessages.length" class="cp-chat">
        <div v-for="msg in chatMessages" :key="msg.id" class="cmw">
          <div class="cmr" :class="{ ag: msg.role === 'agent' }">{{ msg.label }}</div>
          <div class="cmb" :class="{ ag: msg.role === 'agent' }" v-html="msg.html" />
        </div>
      </div>
    </div>

    <div class="cpinp">
      <div class="cpii">
        <input
          v-model="draft"
          placeholder="Ask about signals, regime, portfolio..."
          @keydown.enter.prevent="sendMessage"
        />
        <button type="button" class="cpsend" aria-label="Send" :disabled="sending" @click="sendMessage">
          ↑
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { AnalystTab } from '~/composables/useOverwatch'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
    defaultTab?: AnalystTab
  }>(),
  { embedded: false, defaultTab: 'all' },
)

const { isOpen, chatMessages, draft, sending, close, sendMessage } = useClaudePanel()
const { activeTab, badgeText, visibleTabs, tabAlerts, systemChecks, setActiveTab } = useOverwatch()

onMounted(() => {
  if (props.embedded && props.defaultTab) setActiveTab(props.defaultTab)
})
</script>
