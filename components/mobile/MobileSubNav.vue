<template>
  <div v-if="primaryItems.length" class="m-subnav" role="tablist">
    <button
      v-for="item in primaryItems"
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

  <div v-if="activeChips.length" class="m-subnav m-subnav-chips" role="tablist" aria-label="Sub views">
    <button
      v-for="chip in activeChips"
      :key="chip.id"
      type="button"
      class="m-subnav-chip m-subnav-chip-sm"
      :class="{ on: activeId === chip.id }"
      role="tab"
      :aria-selected="activeId === chip.id"
      @click="$emit('select', chip.id)"
    >
      {{ chip.label }}
    </button>
  </div>

  <div
    v-if="showFunctionFilters && filterItems.length"
    class="m-subnav m-subnav-filters"
    role="group"
    aria-label="Function filters"
  >
    <button
      v-for="item in filterItems"
      :key="item.id"
      type="button"
      class="m-subnav-chip m-subnav-chip-filter"
      :class="{ on: isFilterActive(item.id) }"
      @click="$emit('select', item.id)"
    >
      {{ plainLabel(item.label) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { SIGNAL_FUNCTION_FILTER_IDS, SIGNAL_LIST_NAV_IDS } from '~/utils/signal-filters'

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

const route = useRoute()
const navActiveId = useState<string>('terminal-nav-id', () => 'outstanding')

const allItems = computed(() => props.groups.flatMap((g) => g.items))

const primaryItems = computed(() =>
  allItems.value.filter((item) => !SIGNAL_FUNCTION_FILTER_IDS.has(item.id)),
)

const filterItems = computed(() =>
  allItems.value.filter((item) => SIGNAL_FUNCTION_FILTER_IDS.has(item.id)),
)

const showFunctionFilters = computed(
  () => route.path === '/signals' && SIGNAL_LIST_NAV_IDS.has(navActiveId.value),
)

const activeChips = computed(() => {
  for (const item of primaryItems.value) {
    if (!item.chips?.length) continue
    if (props.activeId === item.id) return item.chips
    if (item.chips.some((c) => c.id === props.activeId)) return item.chips
  }
  return []
})

function isActive(item: NavItem) {
  if (props.multiActiveIds?.includes(item.id)) return true
  if (props.activeId === item.id) return true
  return item.chips?.some((c) => c.id === props.activeId) ?? false
}

function isFilterActive(id: string) {
  return props.multiActiveIds?.includes(id) ?? false
}

function plainLabel(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
</script>
