<template>
  <div>
    <div v-if="!cards.length" class="runic-body" style="padding:14px;color:var(--t2)">{{ UNAVAILABLE_FETCH }}</div>

    <div
      v-for="card in cards"
      :id="`cc-${card.letter}`"
      :key="card.letter"
      class="runic-combo-card"
      :class="[comboCardClass(card.row.status), { highlight: highlightCombo === card.letter }]"
    >
      <div class="c-hd">
        <div class="c-letter" :class="comboLetterClass(card.row.status)">{{ card.letter }}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
            <div class="c-name" :style="{ color: comboNameColor(card.row.direction) }">
              {{ card.row.name }}
            </div>
            <span class="runic-badge" :class="comboStatusBadgeClass(card.row.status)">
              {{ card.row.status }}
            </span>
            <span
              v-if="card.row.direction"
              class="runic-badge"
              :class="card.row.direction.toUpperCase().includes('BULLISH') ? 'b-bull' : 'b-bear'"
            >
              {{ card.row.direction }}
            </span>
            <span v-if="card.row.hit_rate_3m" class="runic-badge b-ok">{{ card.row.hit_rate_3m }}</span>
          </div>
          <div v-if="card.row.duration && card.row.duration !== '—'" class="c-vars">{{ card.row.duration }}</div>
          <div v-if="card.description" class="c-vars" style="margin-top:4px">{{ card.description }}</div>
          <div v-if="card.variables?.length" class="c-legs">
            <span
              v-for="leg in card.active?.confirmed_legs ?? []"
              :key="`ok-${leg}`"
              class="leg leg-ok"
            >{{ leg }}</span>
            <span
              v-for="leg in pendingLegs(card)"
              :key="`pend-${leg}`"
              class="leg leg-pend"
            >{{ leg }}</span>
          </div>
          <div v-else-if="card.active?.confirmed_legs?.length" class="c-legs">
            <span
              v-for="leg in card.active.confirmed_legs"
              :key="leg"
              class="leg leg-ok"
            >{{ leg }}</span>
          </div>
          <div v-else-if="card.watch" class="c-legs">
            <span class="leg leg-pend">
              {{ card.watch.legs_confirmed }}/{{ card.variables?.length ?? 3 }} legs · {{ card.watch.pending }}
            </span>
          </div>
        </div>
        <div
          v-if="cardRight(card)"
          class="runic-body"
          style="text-align:right;white-space:pre-line;color:var(--t2)"
        >
          {{ cardRight(card) }}
        </div>
      </div>
      <div v-if="cardNote(card)" class="c-note">{{ cardNote(card) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'
import {
  comboCardClass,
  comboLetterClass,
  comboNameColor,
  comboStatusBadgeClass,
  formatHitRate,
  formatReturnPct,
  mergeMacroComboCards,
  type MergedComboCard,
} from '~/utils/runic-combo-display'
import { isApiUnavailable } from '~/utils/api-display'

const { highlightCombo } = useRunicMacroPage()
const { combos } = useRunicMacro()

const cards = computed(() => {
  if (!combos.value || isApiUnavailable(combos.value)) return []
  return mergeMacroComboCards(combos.value)
})

function pendingLegs(card: MergedComboCard): string[] {
  if (!card.variables?.length) return []
  const confirmed = new Set(card.active?.confirmed_legs ?? [])
  return card.variables.filter((v) => !confirmed.has(v))
}

function cardRight(card: MergedComboCard): string | undefined {
  const a = card.active
  if (!a) return undefined
  const parts: string[] = []
  if (a.wk != null) parts.push(`WK ${a.wk}`)
  if (a.bucket) parts.push(a.bucket)
  if (a.episode_start) parts.push(`from ${a.episode_start}`)
  return parts.length ? parts.join('\n') : undefined
}

function cardNote(card: MergedComboCard): string | undefined {
  const parts: string[] = []
  const row = card.row
  if (row.avg_return_3m && row.avg_return_3m !== 'N/A') parts.push(`Avg return ${row.avg_return_3m}`)
  const a = card.active
  if (a?.primary_label && a.hit_rate_primary != null) {
    parts.push(`${a.primary_label} hit ${formatHitRate(a.hit_rate_primary)}`)
  }
  if (a?.avg_return_primary != null) {
    parts.push(`Avg ${formatReturnPct(a.avg_return_primary)}`)
  }
  if (a?.n_obs_primary != null) parts.push(`n=${a.n_obs_primary}`)
  if (a?.secondary_label && a.hit_rate_secondary != null) {
    parts.push(`${a.secondary_label} hit ${formatHitRate(a.hit_rate_secondary)}`)
  }
  return parts.length ? parts.join(' · ') : undefined
}
</script>
