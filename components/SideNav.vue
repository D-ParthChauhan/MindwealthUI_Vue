<template>
  <div class="nav">
    <div v-if="title" class="nav-title">{{ title }}</div>
    <div v-for="(group, gi) in groups" :key="gi" class="ng">
      <div class="ngl">{{ group.label }}</div>
      <div
        v-if="group.static"
        class="nav-static"
        v-html="stackDotsHtml(group.static)"
      />
      <template v-for="item in group.items" :key="item.id">
        <button
          type="button"
          class="ni"
          :class="{ on: isItemActive(item) }"
          @click="$emit('select', item.id)"
        >
          <div
            class="nd"
            :class="item.dot"
            :style="item.pulse ? { animation: 'pu 1.5s infinite' } : undefined"
          />
          <div class="ni-text">
            <div class="nn" v-html="stackDotsHtml(item.label)" />
            <div v-if="item.sub" class="ns2" v-html="stackDotsHtml(item.sub)" />
          </div>
        </button>
        <div v-if="item.chips?.length" class="nav-chips">
          <button
            v-for="chip in item.chips"
            :key="chip.id"
            type="button"
            class="nav-chip"
            :class="{ on: activeId === chip.id }"
            @click="$emit('select', chip.id)"
          >
            {{ chip.label }}
          </button>
        </div>
      </template>
      <slot v-if="group.widget === 'signals-display-mode'" name="signals-display-mode" />
      <slot v-else-if="group.widget === 'portfolio-ceiling'" name="portfolio-ceiling" />
      <slot v-else-if="group.widget === 'portfolio-flags'" name="portfolio-flags" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { stackDotsHtml } from '~/utils/stack-text'

type NavItem = {
  id: string
  label: string
  sub?: string
  dot: string
  pulse?: boolean
  to?: string
  chips?: Array<{ id: string; label: string }>
}

const props = defineProps<{
  title?: string
  groups: Array<{
    label: string
    items: NavItem[]
    static?: string
    widget?: 'signals-display-mode' | 'portfolio-ceiling' | 'portfolio-flags'
  }>
  activeId: string
  multiActiveIds?: string[]
}>()

defineEmits<{ select: [id: string] }>()

function isItemActive(item: NavItem) {
  if (props.multiActiveIds?.includes(item.id)) return true
  if (props.activeId === item.id) return true
  return item.chips?.some((chip) => chip.id === props.activeId) ?? false
}
</script>
