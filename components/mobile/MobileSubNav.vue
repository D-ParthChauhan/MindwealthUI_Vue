<template>
  <div v-if="items.length" class="m-subnav" role="tablist">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="m-subnav-chip"
      :class="{ on: isActive(item) }"
      role="tab"
      :aria-selected="isActive(item)"
      @click="$emit('select', item.id)"
    >
      <span class="m-subnav-dot" :class="item.dot" />
      <span class="m-subnav-text">{{ plainLabel(item.label) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
type NavItem = {
  id: string
  label: string
  dot: string
  chips?: Array<{ id: string; label: string }>
}

const props = defineProps<{
  groups: Array<{ items: NavItem[] }>
  activeId: string
  multiActiveIds?: string[]
}>()

defineEmits<{ select: [id: string] }>()

const items = computed(() => props.groups.flatMap((g) => g.items))

function isActive(item: NavItem) {
  if (props.multiActiveIds?.includes(item.id)) return true
  if (props.activeId === item.id) return true
  return item.chips?.some((c) => c.id === props.activeId) ?? false
}

function plainLabel(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
</script>
