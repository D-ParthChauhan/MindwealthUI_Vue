<template>
  <div class="tb">
    <NuxtLink class="logo" to="/" aria-label="MindWealth">
      <span class="logo-slot">
        <span class="logo-line logo-line-mw">
          <span
            v-for="(item, i) in mindWealthLetters"
            :key="`mw-${i}`"
            class="logo-char"
            :style="{ transitionDelay: `${i * 32}ms` }"
          >
            <span class="logo-char-flip">
              <span class="logo-char-face">{{ item.char }}</span>
            </span>
          </span>
        </span>
        <span class="logo-line logo-line-at" aria-hidden="true">
          <span
            v-for="(item, i) in alphaTerminalLetters"
            :key="`at-${i}`"
            class="logo-char"
            :class="{ 'logo-char-alpha': item.alpha, 'logo-char-space': item.space }"
            :style="{ transitionDelay: `${i * 32}ms` }"
          >
            <span class="logo-char-flip">
              <span class="logo-char-face">{{ item.char }}</span>
            </span>
          </span>
        </span>
      </span>
    </NuxtLink>
    <div class="tabs">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.path"
        class="tn"
        :class="{ on: activeTab === tab.id }"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>
    <div class="tbr">
      <div v-if="status" class="lp">
        <div class="ld" :class="status.dot" />
        {{ status.label }}
      </div>
      <div v-else class="lp">
        <div class="ld g" />
        LIVE · {{ marketLabel }}
      </div>
      <button
        type="button"
        class="tb-sync"
        :class="{ syncing: syncing }"
        aria-label="Refresh engine data"
        title="Refresh engine data"
        @click="onSync"
      >
        <span class="tb-sync-dot" />
      </button>
      <span v-if="lastUpdated" class="tb-updated">{{ lastUpdated }}</span>
      <div class="tb-user-capsule">
        <span class="tb-user-name">rohit</span>
        <span class="tb-user-verified" aria-label="Authorized">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 4.2L3.2 5.9L6.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MAIN_TABS, type TabId } from '~/constants/navigation'

defineProps<{
  activeTab: TabId
  status?: { dot: string; label: string }
}>()

const mindWealthLetters = 'MindWealth'.split('').map((char) => ({ char }))

const alphaTerminalLetters = [
  { char: 'α', alpha: true },
  { char: '\u00a0', space: true },
  { char: 't' },
  { char: 'e' },
  { char: 'r' },
  { char: 'm' },
  { char: 'i' },
  { char: 'n' },
  { char: 'a' },
  { char: 'l' },
]

const { lastUpdated, marketLabel, refresh } = useAppMeta()
const { counts, refresh: refreshCounts } = useSignalCounts()
const syncing = ref(false)

const tabs = computed(() =>
  MAIN_TABS.map((tab) => {
    if (tab.id === 'signals' && counts.value) {
      return { ...tab, label: `SIGNALS · ${counts.value.outstanding}` }
    }
    return tab
  }),
)

async function onSync() {
  if (syncing.value) return
  syncing.value = true
  try {
    await Promise.all([refresh(), refreshCounts(), refreshNuxtData()])
  } finally {
    syncing.value = false
  }
}
</script>

<style scoped>
.tbr {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.tb-sync {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.tb-sync-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px rgba(39, 174, 96, 0.45);
  animation: pu 2s infinite;
}
.tb-sync:hover .tb-sync-dot {
  background: var(--gold);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.5);
}
.tb-sync.syncing .tb-sync-dot {
  background: var(--gold);
  animation: sync-spin 0.7s linear infinite;
}
@keyframes sync-spin {
  to { transform: rotate(360deg); }
}
.tb-updated {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #b4bcc8;
  white-space: nowrap;
}
.tb-user-capsule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 4px 3px 9px;
  border-radius: 20px;
  background: rgba(201, 168, 76, 0.06);
  border: 1px solid rgba(201, 168, 76, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}
.tb-user-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.4px;
  color: #d4dae3;
  text-transform: lowercase;
}
.tb-user-verified {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(145deg, #e8c96a 0%, #c9a84c 100%);
  color: #1a1408;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(201, 168, 76, 0.35);
}
</style>
