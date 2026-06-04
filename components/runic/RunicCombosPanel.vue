<template>
  <div>
    <div class="runic-body" style="margin-bottom:10px;padding:9px 13px;background:var(--s2);border-radius:5px;border:1px solid var(--b2);line-height:1.8">
      298 total combinations (12C1=12 · 12C2=66 · 12C3=220). 7 pre-named (A–G) bypass the auto-discovery gate.
      291 unnamed combos: auto-discovered nightly as soon as data is available. All hit rates = directional hit rate.
    </div>

    <div
      v-for="combo in combos"
      :id="`cc-${combo.letter}`"
      :key="combo.letter"
      class="runic-combo-card"
      :class="[combo.cardClass, { highlight: highlightCombo === combo.letter }]"
    >
      <div class="c-hd">
        <div class="c-letter" :class="combo.letterClass">{{ combo.letter }}</div>
        <div>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
            <div class="c-name" :style="nameStyle(combo.nameClass)">{{ combo.name }}</div>
            <span v-for="badge in combo.badges" :key="badge.text" class="runic-badge" :class="badge.class">{{ badge.text }}</span>
          </div>
          <div class="c-vars">{{ combo.vars }}</div>
          <div class="c-legs">
            <span v-for="leg in combo.legs" :key="leg.text" class="leg" :class="leg.class">{{ leg.text }}</span>
          </div>
        </div>
        <div
          v-if="combo.right"
          class="runic-body"
          style="text-align:right;white-space:pre-line"
          :style="nameStyle(combo.right.class)"
        >
          {{ combo.right.text }}
        </div>
      </div>
      <div class="c-note">{{ combo.note }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RUNIC_COMBOS } from '~/constants/runic-macro-data'
import { comboEBadge } from '~/utils/runic-regime'

const { highlightCombo } = useRunicMacroPage()
const { nightly } = useRunicMacro()

const combos = computed(() =>
  RUNIC_COMBOS.map((combo) => {
    if (combo.letter !== 'E' || !nightly.value) return combo
    const badgeText = comboEBadge(nightly.value.combo_e_status)
    return {
      ...combo,
      badges: combo.badges.map((b) =>
        b.class === 'b-conf' ? { ...b, text: badgeText } : b,
      ),
      right: combo.right
        ? { ...combo.right, text: combo.right.text.replace(/CONFIRMED\n2 OF 3/i, badgeText.replace(' ', '\n')) }
        : combo.right,
    }
  }),
)

function nameStyle(cls?: string) {
  if (!cls) return undefined
  if (cls.includes('red')) return { color: 'var(--red)' }
  if (cls.includes('amber')) return { color: 'var(--amber)' }
  if (cls.includes('gold')) return { color: 'var(--gold)' }
  if (cls.includes('green')) return { color: 'var(--green)' }
  return undefined
}
</script>
