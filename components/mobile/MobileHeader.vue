<template>
  <header class="m-hd">
    <NuxtLink class="m-hd-logo" to="/dashboard" aria-label="MindWealth">
      MindWealth
    </NuxtLink>
    <div class="m-hd-title">{{ title }}</div>
    <div class="m-hd-actions">
      <div v-if="status" class="m-hd-status">
        <span class="m-hd-dot" :class="status.dot" />
        <span class="m-hd-status-label">{{ statusShort }}</span>
      </div>
      <button
        type="button"
        class="m-hd-sync"
        :class="{ syncing }"
        aria-label="Refresh"
        @click="onSync"
      >
        <span class="m-hd-sync-dot" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  status?: { dot: string; label: string }
}>()

const { refresh } = useAppMeta()
const { refresh: refreshCounts } = useSignalCounts()
const syncing = ref(false)

const statusShort = computed(() => {
  const label = props.status?.label ?? ''
  const match = label.match(/(\d+)/)
  return match ? match[1] : label.split(' ')[0] ?? ''
})

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
