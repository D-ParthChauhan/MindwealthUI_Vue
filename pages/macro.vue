<template>
  <div class="macro-page">
    <div class="macro-sticky-hd">
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
    </div>

    <div class="macro-content scroll">
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

import { RUNIC_MACRO_TABS } from '~/constants/runic-macro-data'

useRunicMacro()
const { activeTab, switchTab } = useRunicMacroPage()
</script>
