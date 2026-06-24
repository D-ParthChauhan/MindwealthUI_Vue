<template>
  <div class="ach-view">
    <div ref="scrollRef" class="ach-scroll">
      <div v-if="historyLoading" class="ach-loading">
        <span class="ach-loading-dot" />
        Loading conversation…
      </div>

      <div v-else-if="!messages.length" class="ach-empty">
        <div class="ach-empty-icon">💬</div>
        <div class="ach-empty-title">AI ANALYST</div>
        <div class="ach-empty-sub">
          Ask about signals, macro regime, portfolio sizing, or any ticker. Deep research and web search when needed.
        </div>
        <div class="ach-prompts">
          <button
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            type="button"
            class="ach-prompt"
            :disabled="sending"
            @click="$emit('suggest', prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <div v-else class="ach-thread">
        <AnalystChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :role="msg.role"
          :label="msg.label"
          :html="msg.html"
          :pending="msg.pending"
          :timestamp="msg.timestamp"
        />
      </div>
    </div>

    <AnalystChatInput
      ref="inputRef"
      :model-value="draft"
      :disabled="sending"
      placeholder="Ask about signals, regime, portfolio..."
      @update:model-value="$emit('update:draft', $event)"
      @send="$emit('send')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ClaudeMessage } from '~/composables/useClaudePanel'

const props = defineProps<{
  messages: ClaudeMessage[]
  draft: string
  sending: boolean
  historyLoading: boolean
  suggestedPrompts: readonly string[]
  scrollTick: number
}>()

defineEmits<{
  'update:draft': [value: string]
  send: []
  suggest: [prompt: string]
}>()

const scrollRef = ref<HTMLElement | null>(null)
const inputRef = ref<{ focus?: () => void } | null>(null)

defineExpose({
  focusInput: () => inputRef.value?.focus?.(),
})

function scrollToBottom() {
  const el = scrollRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

watch(
  () => [props.messages.length, props.scrollTick, props.historyLoading] as const,
  () => nextTick(scrollToBottom),
  { immediate: true },
)
</script>
