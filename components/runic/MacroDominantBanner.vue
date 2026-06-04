<template>
  <div v-if="nightly" class="macro-dominant">
    <span class="macro-dominant-text">{{ bannerText }}</span>
    <span class="macro-dominant-bf" v-html="braveFearfulHtml" />
  </div>
</template>

<script setup lang="ts">
import { dominantBannerText, formatBraveFearful } from '~/utils/runic-regime'

const { nightly } = useRunicMacro()

const bannerText = computed(() => (nightly.value ? dominantBannerText(nightly.value) : ''))
const braveFearfulHtml = computed(() =>
  nightly.value ? formatBraveFearful(nightly.value.brave_fearful) : '',
)
</script>
