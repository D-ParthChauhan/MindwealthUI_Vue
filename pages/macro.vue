<template>
  <div class="scroll macro-scroll">
    <div class="macro-sticky-hd">
      <div class="macro-page-hd">
        <span class="macro-page-badge">MACRO COMBO ENGINE</span>
        <span class="macro-page-sep">|</span>
        <span class="macro-page-count">298 COMBINATIONS</span>
      </div>
      <MacroDominantBanner />
      <MacroRegimePills />
    </div>

    <div class="macro-tab-bar">
      <button
        v-for="tab in RUNIC_MACRO_TABS"
        :key="tab.id"
        type="button"
        class="macro-tab-btn"
        :class="{ on: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="macro-panel" :class="{ on: activeTab === 'overview' }">
      <RunicOverviewPanel />
    </div>
    <div class="macro-panel" :class="{ on: activeTab === 'variables' }">
      <RunicVariablesPanel />
    </div>
    <div class="macro-panel" :class="{ on: activeTab === 'combos' }">
      <RunicCombosPanel />
    </div>
    <div class="macro-panel" :class="{ on: activeTab === 'cancel' }">
      <RunicTrackerPanel />
    </div>
    <div class="macro-panel" :class="{ on: activeTab === 'analog' }">
      <RunicAnalogPanel />
    </div>
    <div class="macro-panel" :class="{ on: activeTab === 'brief' }">
      <RunicBriefPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

import { RUNIC_MACRO_TABS } from '~/constants/runic-macro-data'

useRunicMacro()
const { activeTab, switchTab } = useRunicMacroPage()
</script>

<style scoped>
.macro-scroll {
  display: flex;
  flex-direction: column;
}
</style>
