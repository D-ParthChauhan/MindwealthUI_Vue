<template>
  <div class="ranked-cards-wrap">
    <div v-if="missingFields.length" class="ranked-missing-banner">
      <span class="ranked-missing-title">API fields not yet in payload</span>
      <span class="ranked-missing-list">{{ missingFields.join(', ') }}</span>
      <span class="ranked-missing-note">
        Ranked cards sort by backend <code>composite_score</code> when present. Tier badges need <code>tier</code>.
      </span>
    </div>

    <div v-if="activeCards.length === 0 && exitedCards.length === 0" class="ranked-empty">
      No signals match the current filters.
    </div>

    <div v-else class="ranked-grid">
      <button
        v-for="card in activeCards"
        :key="card.key"
        type="button"
        class="ranked-card"
        :class="{ selected: selectedKey === card.key }"
        @click="$emit('select', card.index)"
      >
        <div class="ranked-card-head">
          <span class="ranked-ticker">{{ card.symbol }}</span>
          <span v-if="card.tier" class="ranked-tier" :class="tierBadgeClass(card.tier)">
            {{ tierLabel(card.tier) }}
          </span>
          <span
            v-if="card.alphaInterpretation?.label"
            class="ranked-alpha-tag"
            :class="card.alphaInterpretation.type ?? 'info'"
          >
            {{ card.alphaInterpretation.label }}
          </span>
        </div>
        <div class="ranked-meta">
          {{ card.function }} · {{ card.interval }} · {{ card.direction }} · {{ card.signalDate }}
          <span v-if="card.daysElapsed != null"> · {{ card.daysElapsed }}d</span>
        </div>
        <div class="ranked-stats">
          <span>BT {{ card.btWr.toFixed(1) }}%</span>
          <span v-if="card.signalAlpha != null">Alpha {{ formatSigned(card.signalAlpha) }}%</span>
          <span v-if="card.mtmPct != null">MTM {{ formatSigned(card.mtmPct) }}%</span>
          <span v-if="card.compositeScore != null" class="ranked-quality">Q {{ card.compositeScore }}</span>
          <span v-if="card.convictionBqScore != null" class="ranked-conviction">BQ {{ card.convictionBqScore }}</span>
        </div>
      </button>
    </div>

    <details v-if="exitedCards.length" class="ranked-exited">
      <summary class="ranked-exited-summary">
        Exited signals ({{ exitedCards.length }})
      </summary>
      <div class="ranked-grid exited">
        <button
          v-for="card in exitedCards"
          :key="card.key"
          type="button"
          class="ranked-card exited"
          :class="{ selected: selectedKey === card.key }"
          @click="$emit('select', card.index)"
        >
          <div class="ranked-card-head">
            <span class="ranked-ticker">{{ card.symbol }}</span>
            <span v-if="card.tier" class="ranked-tier tier-exit">{{ tierLabel(card.tier) }}</span>
          </div>
          <div class="ranked-meta">
            {{ card.function }} · {{ card.interval }} · {{ card.direction }}
          </div>
          <div class="ranked-stats muted">
            <span v-if="card.mtmPct != null">MTM {{ formatSigned(card.mtmPct) }}%</span>
            <span v-if="card.compositeScore != null">Q {{ card.compositeScore }}</span>
          </div>
        </button>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { SignalSurfacePoint } from '~/utils/signal-surface'
import { sortByQuality, tierBadgeClass, tierLabel } from '~/utils/signal-surface'

const props = defineProps<{
  points: SignalSurfacePoint[]
  missingFields: string[]
  selectedKey?: string | null
}>()

defineEmits<{ select: [index: number] }>()

type CardRow = SignalSurfacePoint & { index: number }

const indexed = computed((): CardRow[] =>
  props.points.map((p, index) => ({ ...p, index })),
)

const sorted = computed(() => sortByQuality(indexed.value))

const activeCards = computed(() => sorted.value.filter((c) => !c.exitFired))
const exitedCards = computed(() => sorted.value.filter((c) => c.exitFired))

function formatSigned(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}
</script>

<style scoped>
.ranked-cards-wrap {
  width: 100%;
  min-width: 0;
}
.ranked-missing-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(186, 117, 23, 0.35);
  background: rgba(186, 117, 23, 0.08);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t2);
}
.ranked-missing-title {
  color: var(--gold);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ranked-missing-list { color: var(--t1); }
.ranked-missing-note {
  color: var(--t3);
  line-height: 1.45;
}
.ranked-missing-note code { color: var(--gold); }
.ranked-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t3);
}
.ranked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.ranked-grid.exited {
  margin-top: 10px;
}
.ranked-card {
  text-align: left;
  padding: 10px 12px;
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.ranked-card:hover {
  border-color: var(--b3);
  background: #0c0c0c;
}
.ranked-card.selected {
  border-color: rgba(201, 168, 76, 0.45);
  background: rgba(201, 168, 76, 0.06);
}
.ranked-card.exited {
  opacity: 0.65;
}
.ranked-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}
.ranked-ticker {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--t1);
}
.ranked-tier {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.ranked-tier.tier-a {
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
}
.ranked-tier.tier-best {
  color: var(--blue);
  border: 1px solid rgba(91, 141, 184, 0.4);
  background: rgba(91, 141, 184, 0.1);
}
.ranked-tier.tier-c,
.ranked-tier.neutral {
  color: var(--t3);
  border: 1px solid var(--b2);
}
.ranked-tier.tier-exit {
  color: var(--red);
  border: 1px solid rgba(216, 90, 48, 0.35);
}
.ranked-alpha-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 5px;
  border-radius: 3px;
}
.ranked-alpha-tag.warn {
  color: var(--gold);
  background: rgba(186, 117, 23, 0.15);
}
.ranked-alpha-tag.fail {
  color: var(--red);
  background: rgba(216, 90, 48, 0.12);
}
.ranked-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t3);
  margin-bottom: 8px;
  line-height: 1.4;
}
.ranked-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t2);
}
.ranked-stats.muted { color: var(--t3); }
.ranked-quality { color: var(--gold); font-weight: 600; }
.ranked-conviction { color: var(--purple, #9F4AB7); }
.ranked-exited {
  margin-top: 16px;
  border-top: 1px solid var(--b1);
  padding-top: 10px;
}
.ranked-exited-summary {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  cursor: pointer;
  list-style: none;
  margin-bottom: 4px;
}
.ranked-exited-summary::-webkit-details-marker { display: none; }
</style>
