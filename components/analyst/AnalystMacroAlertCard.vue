<template>
  <article class="runic-combo-card" :class="cardClass">
    <div class="aa-macro-label">{{ label }}</div>

    <div class="c-hd">
      <div class="c-letter">{{ comboLetter }}</div>
      <div style="flex: 1; min-width: 0">
        <div class="aa-macro-badges">
          <span class="runic-badge b-conf">RUNIC</span>
          <span class="runic-badge" :class="variantBadgeClass">{{ variantLabel }}</span>
          <span v-if="macro.combo && macro.combo !== '—'" class="runic-badge b-watch">
            COMBO {{ macro.combo }}
          </span>
        </div>
        <div class="c-name">{{ headline }}</div>
        <div v-if="macro.reason" class="c-vars">{{ macro.reason }}</div>
      </div>
    </div>

    <div v-if="macro.narrative" class="c-note">{{ macro.narrative }}</div>

    <div v-if="footerTags.length" class="c-legs">
      <span v-for="tag in footerTags" :key="tag" class="leg leg-pend">{{ tag }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { OverwatchPanelMacroDetail } from '~/types/api'

const props = defineProps<{
  label: string
  macro: OverwatchPanelMacroDetail
  footer?: string
}>()

const comboLetter = computed(() => {
  const c = props.macro.combo?.trim()
  if (!c || c === '—') return '◈'
  return c.charAt(0).toUpperCase()
})

const cardClass = computed(() => (props.macro.variant === 'ssi' ? 'watch-c' : 'conf-c'))

const variantLabel = computed(() =>
  props.macro.variant === 'ssi' ? 'SSI + MACRO' : 'DOMINANT SIGNAL',
)

const variantBadgeClass = computed(() =>
  props.macro.variant === 'ssi' ? 'b-watch' : 'b-conf',
)

const headline = computed(() => {
  if (props.macro.variant === 'dominant' && props.macro.combo) {
    return `Combo ${props.macro.combo} active`
  }
  if (props.macro.combo && props.macro.combo !== '—') {
    return `${props.macro.combo} macro extreme`
  }
  return 'Macro intelligence alert'
})

const footerTags = computed(() => {
  const tags: string[] = []
  if (props.macro.brave_fearful) {
    tags.push(props.macro.brave_fearful.replace(/_/g, ' ').toUpperCase())
  }
  if (props.footer) {
    for (const part of props.footer.split('·').map((s) => s.trim()).filter(Boolean)) {
      if (!tags.includes(part)) tags.push(part)
    }
  }
  return tags.slice(0, 4)
})
</script>

<style scoped>
.aa-macro-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.9px;
  color: var(--t4);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.aa-macro-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.c-hd {
  margin-top: 0;
}
</style>
