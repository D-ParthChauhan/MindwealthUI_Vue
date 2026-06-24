<template>
  <div class="ach-msg" :class="role === 'user' ? 'ach-msg-user' : 'ach-msg-agent'">
    <div class="ach-msg-meta">
      <span class="ach-msg-avatar">{{ role === 'user' ? '◆' : '💬' }}</span>
      <span class="ach-msg-label">{{ label }}</span>
      <span v-if="timeLabel" class="ach-msg-time">{{ timeLabel }}</span>
    </div>
    <div class="ach-msg-bubble" :class="{ 'ach-msg-pending': pending }">
      <div v-if="pending" class="ach-typing" aria-label="Analyzing">
        <span /><span /><span />
      </div>
      <div v-else class="ach-msg-body" v-html="html" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  role: 'user' | 'agent'
  label: string
  html: string
  pending?: boolean
  timestamp?: string
}>()

const timeLabel = computed(() => {
  if (!props.timestamp) return ''
  const d = new Date(props.timestamp)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>
