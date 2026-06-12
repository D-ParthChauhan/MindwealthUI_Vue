<template>
  <nav class="m-nav" aria-label="Main navigation">
    <NuxtLink
      v-for="tab in primaryTabs"
      :key="tab.id"
      :to="tab.path"
      class="m-nav-item"
      :class="{ on: activeTab === tab.id }"
    >
      <span class="m-nav-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="m-nav-label">{{ tab.shortLabel }}</span>
    </NuxtLink>
    <button
      type="button"
      class="m-nav-item"
      :class="{ on: moreOpen || isMoreTabActive }"
      aria-label="More sections"
      @click="moreOpen = !moreOpen"
    >
      <span class="m-nav-icon" aria-hidden="true">···</span>
      <span class="m-nav-label">More</span>
    </button>

    <Transition name="m-sheet">
      <div v-if="moreOpen" class="m-more-backdrop" @click="moreOpen = false" />
    </Transition>
    <Transition name="m-sheet-up">
      <div v-if="moreOpen" class="m-more-sheet" role="dialog" aria-label="More navigation">
        <div class="m-more-handle" />
        <div class="m-more-title">Sections</div>
        <NuxtLink
          v-for="tab in moreTabs"
          :key="tab.id"
          :to="tab.path"
          class="m-more-row"
          :class="{ on: activeTab === tab.id }"
          @click="moreOpen = false"
        >
          <span>{{ tab.label }}</span>
          <span class="m-more-arrow">→</span>
        </NuxtLink>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { MAIN_TABS, type TabId } from '~/constants/navigation'

defineProps<{ activeTab: TabId }>()

const moreOpen = ref(false)

const primaryTabs = [
  { id: 'dashboard' as TabId, path: '/dashboard', shortLabel: 'Home', icon: '◈' },
  { id: 'signals' as TabId, path: '/signals', shortLabel: 'Signals', icon: '◎' },
  { id: 'macro' as TabId, path: '/macro', shortLabel: 'Macro', icon: '◉' },
  { id: 'portfolio' as TabId, path: '/portfolio', shortLabel: 'Port', icon: '◆' },
]

const moreTabs = computed(() =>
  MAIN_TABS.filter((t) => !primaryTabs.some((p) => p.id === t.id)),
)

const route = useRoute()
const isMoreTabActive = computed(() =>
  moreTabs.value.some((t) => route.path.startsWith(t.path)),
)

watch(() => route.path, () => {
  moreOpen.value = false
})
</script>
