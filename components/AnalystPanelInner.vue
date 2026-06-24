<template>
  <aside
    class="cpanel"
    :class="{ open: embedded || isOpen, 'cpanel-embed': embedded, 'cpanel-chat': activeTab === 'chat' }"
    aria-label="AI Analyst panel"
  >
    <div class="cph">
      <div class="cph-icon">💬</div>
      <div class="cph-main">
        <div class="cpt">AI ANALYST</div>
        <div class="cp-badge">{{ badgeText }}</div>
      </div>
      <div class="cph-actions">
        <button
          v-if="activeTab === 'chat'"
          type="button"
          class="cph-action"
          title="Start a new chat (clears this thread; prior session stays on server)"
          aria-label="Start new chat"
          @click="onNewChat"
        >
          +
        </button>
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
    </div>

    <Transition name="cp-toast">
      <div v-if="chatNotice" class="cp-toast" role="status" aria-live="polite">
        {{ chatNotice }}
      </div>
    </Transition>

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

    <div class="cp-body" :class="{ 'cp-body-chat': activeTab === 'chat' }">
      <AnalystChatView
        v-if="activeTab === 'chat'"
        ref="chatViewRef"
        :messages="chatMessages"
        :draft="draft"
        :sending="sending"
        :history-loading="historyLoading"
        :suggested-prompts="suggestedPrompts"
        :scroll-tick="chatScrollTick"
        @update:draft="setDraft"
        @send="sendMessage()"
        @suggest="sendSuggestedPrompt"
      />
      <AnalystAlertsView
        v-else
        :active-tab="activeTab"
        :tab-alerts="tabAlerts"
        :system-checks="systemChecks"
      />
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
  { embedded: false, defaultTab: 'chat' },
)

const {
  isOpen,
  chatMessages,
  draft,
  sending,
  historyLoading,
  chatScrollTick,
  chatNotice,
  suggestedPrompts,
  close,
  sendMessage,
  sendSuggestedPrompt,
  startNewChat,
  loadSessionHistory,
} = useClaudePanel()
const { activeTab, badgeText, visibleTabs, tabAlerts, systemChecks, setActiveTab } = useOverwatch()

const chatViewRef = ref<{ focusInput?: () => void } | null>(null)

function setDraft(value: string) {
  draft.value = value
}

function focusChatInput() {
  nextTick(() => chatViewRef.value?.focusInput?.())
}

function onNewChat() {
  startNewChat()
  focusChatInput()
}

onMounted(() => {
  if (props.embedded && props.defaultTab) setActiveTab(props.defaultTab)
  else if (activeTab.value === 'chat') void loadSessionHistory()
  if (activeTab.value === 'chat' && (isOpen.value || props.embedded)) focusChatInput()
})

watch(activeTab, (tab) => {
  if (tab === 'chat') {
    loadSessionHistory()
    focusChatInput()
  }
})

watch(isOpen, (open) => {
  if (open && activeTab.value === 'chat') focusChatInput()
})
</script>
