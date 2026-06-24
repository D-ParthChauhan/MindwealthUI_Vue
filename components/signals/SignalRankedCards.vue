<template>
  <div class="ranked-cards-wrap">
    <div v-if="missingFields.length" class="ranked-missing-banner">
      <span class="ranked-missing-title">API fields not yet in payload</span>
      <span class="ranked-missing-list">{{ missingFields.join(', ') }}</span>
      <span class="ranked-missing-note">
        Ranked cards sort by backend <code>composite_score</code> when present. Tier badges need <code>tier</code>.
      </span>
    </div>

    <div v-if="showTierFilter" class="ranked-tier-filter">
      <span class="ranked-tier-filter-label">Tier</span>
      <div class="ranked-tier-filter-pills" role="group" aria-label="Filter by signal tier">
        <button
          v-for="opt in visibleTierFilters"
          :key="opt.value"
          type="button"
          class="ranked-tier-pill"
          :class="[tierPillClass(opt.value), { active: tierFilter === opt.value }]"
          @click="tierFilter = opt.value"
        >
          {{ opt.label }}
          <span class="ranked-tier-count">{{ tierCounts[opt.value] }}</span>
        </button>
      </div>
    </div>

    <div v-if="activeCards.length === 0 && exitedCards.length === 0" class="ranked-empty">
      <template v-if="tierFilter !== 'all'">
        No signals in <strong>{{ activeTierLabel }}</strong> with the current filters.
      </template>
      <template v-else>
        No signals match the current filters.
      </template>
    </div>

    <div v-else class="ranked-grid">
      <article
        v-for="card in activeCards"
        :key="card.key"
        class="ranked-card-outer"
      >
        <button
          type="button"
          class="ranked-card-btn"
          :class="{ selected: selectedKey === card.key }"
          @click="$emit('select', card.index)"
        >
          <div class="mw-glass-hero-wrap">
            <div class="mw-glass-hero ranked-card-glass" :class="heroTone(card)">
              <div class="mw-glass-hero-inner">
                <div class="ranked-top">
                  <span class="ranked-ticker">{{ card.symbol }}</span>
                  <div v-if="card.compositeScore != null" class="ranked-quality-block">
                    <div class="ranked-quality-v">{{ formatScore(card.compositeScore) }}</div>
                    <div class="ranked-quality-l">Quality</div>
                  </div>
                </div>

                <div class="ranked-badges">
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

                <div class="ranked-pills">
                  <span class="ranked-pill fn" :title="card.function">{{ abbreviateFunction(card.function) }}</span>
                  <span class="ranked-pill int">{{ abbreviateInterval(card.interval) }}</span>
                  <DirectionBadge :direction="card.direction" />
                </div>

                <div class="ranked-date">
                  <span>{{ card.signalDate }}</span>
                  <span v-if="card.daysElapsed != null" class="ranked-date-sep">·</span>
                  <span v-if="card.daysElapsed != null">{{ card.daysElapsed }}d held</span>
                </div>

                <div class="ranked-stats-grid">
                  <div class="ranked-stat">
                    <div class="ranked-stat-v" :class="wrClass(card.btWr)">{{ card.btWr.toFixed(1) }}%</div>
                    <div class="ranked-stat-l">BT WR</div>
                  </div>
                  <div class="ranked-stat">
                    <div
                      class="ranked-stat-v"
                      :class="card.fwdWr != null ? wrClass(card.fwdWr) : 'na'"
                    >
                      {{ card.fwdWr != null ? `${card.fwdWr.toFixed(1)}%` : '—' }}
                    </div>
                    <div class="ranked-stat-l">FWD WR</div>
                  </div>
                  <div class="ranked-stat">
                    <div
                      class="ranked-stat-v"
                      :class="mtmClass(card.mtmPct)"
                    >
                      {{ card.mtmPct != null ? `${formatSigned(card.mtmPct)}%` : '—' }}
                    </div>
                    <div class="ranked-stat-l">MTM</div>
                  </div>
                  <div v-if="card.signalAlpha != null" class="ranked-stat">
                    <div class="ranked-stat-v" :class="alphaClass(card.signalAlpha)">
                      {{ formatSigned(card.signalAlpha) }}%
                    </div>
                    <div class="ranked-stat-l">Alpha</div>
                  </div>
                  <div v-if="card.convictionBqScore != null" class="ranked-stat">
                    <div class="ranked-stat-v conviction">{{ card.convictionBqScore }}</div>
                    <div class="ranked-stat-l">BQ</div>
                  </div>
                  <div v-if="card.windowRemainingPct != null" class="ranked-stat">
                    <div class="ranked-stat-v" :class="windowClass(card.windowRemainingPct)">
                      {{ card.windowRemainingPct.toFixed(0) }}%
                    </div>
                    <div class="ranked-stat-l">Window</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>
      </article>
    </div>

    <details v-if="exitedCards.length" class="ranked-exited">
      <summary class="ranked-exited-summary">
        Exited signals ({{ exitedCards.length }})
      </summary>
      <div class="ranked-grid exited">
        <article
          v-for="card in exitedCards"
          :key="card.key"
          class="ranked-card-outer"
        >
          <button
            type="button"
            class="ranked-card-btn exited"
            :class="{ selected: selectedKey === card.key }"
            @click="$emit('select', card.index)"
          >
            <div class="mw-glass-hero-wrap">
              <div class="mw-glass-hero ranked-card-glass tone-r">
                <div class="mw-glass-hero-inner">
                  <div class="ranked-top">
                    <span class="ranked-ticker">{{ card.symbol }}</span>
                    <div v-if="card.compositeScore != null" class="ranked-quality-block muted">
                      <div class="ranked-quality-v">{{ formatScore(card.compositeScore) }}</div>
                      <div class="ranked-quality-l">Quality</div>
                    </div>
                  </div>
                  <div class="ranked-badges">
                    <span v-if="card.tier" class="ranked-tier tier-exit">{{ tierLabel(card.tier) }}</span>
                    <span class="ranked-exit-tag">Exited</span>
                  </div>
                  <div class="ranked-pills">
                    <span class="ranked-pill fn">{{ abbreviateFunction(card.function) }}</span>
                    <span class="ranked-pill int">{{ abbreviateInterval(card.interval) }}</span>
                    <DirectionBadge :direction="card.direction" />
                  </div>
                  <div class="ranked-stats-grid compact">
                    <div class="ranked-stat">
                      <div class="ranked-stat-v" :class="mtmClass(card.mtmPct)">
                        {{ card.mtmPct != null ? `${formatSigned(card.mtmPct)}%` : '—' }}
                      </div>
                      <div class="ranked-stat-l">MTM</div>
                    </div>
                    <div v-if="card.compositeScore != null" class="ranked-stat">
                      <div class="ranked-stat-v muted">{{ formatScore(card.compositeScore) }}</div>
                      <div class="ranked-stat-l">Quality</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </article>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { SignalSurfacePoint } from '~/utils/signal-surface'
import { abbreviateFunction, abbreviateInterval } from '~/utils/signal-detail'
import type { RankedTierFilter } from '~/utils/signal-surface'
import {
  RANKED_TIER_FILTERS,
  matchesTierFilter,
  normalizeTierSlug,
  sortByQuality,
  tierBadgeClass,
  tierLabel,
} from '~/utils/signal-surface'
import { winRateClass } from '~/utils/signals'

const props = defineProps<{
  points: SignalSurfacePoint[]
  missingFields: string[]
  selectedKey?: string | null
}>()

defineEmits<{ select: [index: number] }>()

type CardRow = SignalSurfacePoint & { index: number }

const tierFilter = ref<RankedTierFilter>('all')

const indexed = computed((): CardRow[] =>
  props.points.map((p, index) => ({ ...p, index })),
)

const tierCounts = computed(() => {
  const counts: Record<RankedTierFilter, number> = {
    all: indexed.value.length,
    best: 0,
    ta: 0,
    tierc: 0,
    exit: 0,
  }
  for (const row of indexed.value) {
    const slug = normalizeTierSlug(row.tier)
    if (slug === 'best') counts.best++
    else if (slug === 'ta') counts.ta++
    else if (slug === 'tierc') counts.tierc++
    else if (slug === 'exit') counts.exit++
  }
  return counts
})

const showTierFilter = computed(() =>
  tierCounts.value.best > 0 ||
  tierCounts.value.ta > 0 ||
  tierCounts.value.tierc > 0 ||
  tierCounts.value.exit > 0,
)

const visibleTierFilters = computed(() =>
  RANKED_TIER_FILTERS.filter((opt) => opt.value === 'all' || tierCounts.value[opt.value] > 0),
)

const activeTierLabel = computed(
  () => RANKED_TIER_FILTERS.find((o) => o.value === tierFilter.value)?.label ?? tierFilter.value,
)

const tierFiltered = computed(() => {
  if (tierFilter.value === 'all') return indexed.value
  return indexed.value.filter((row) => matchesTierFilter(row.tier, tierFilter.value))
})

const sorted = computed(() => sortByQuality(tierFiltered.value))

const activeCards = computed(() => sorted.value.filter((c) => !c.exitFired))
const exitedCards = computed(() => sorted.value.filter((c) => c.exitFired))

function formatSigned(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}

function formatScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function wrClass(pct: number) {
  return winRateClass(pct)
}

function mtmClass(pct: number | null) {
  if (pct == null) return 'na'
  if (pct > 0) return 'ok'
  if (pct < 0) return 'bad'
  return 'neutral'
}

function alphaClass(n: number) {
  if (n > 0) return 'ok'
  if (n < 0) return 'bad'
  return 'neutral'
}

function windowClass(pct: number) {
  if (pct > 70) return 'ok'
  if (pct >= 30) return 'warn'
  return 'bad'
}

function heroTone(card: CardRow): string {
  const t = (card.tier ?? '').toLowerCase()
  if (t === 'ta' || t === 'best') return 'tone-g'
  if (t === 'exit') return 'tone-r'
  if (card.alphaInterpretation?.type === 'fail') return 'tone-r'
  if (card.alphaInterpretation?.type === 'warn') return 'tone-a'
  return ''
}

function tierPillClass(value: RankedTierFilter): string {
  if (value === 'all') return 'pill-all'
  if (value === 'best') return 'pill-best'
  if (value === 'ta') return 'pill-a'
  if (value === 'tierc') return 'pill-c'
  if (value === 'exit') return 'pill-exit'
  return 'pill-all'
}

watch(
  () => props.points,
  () => {
    if (tierFilter.value !== 'all' && tierCounts.value[tierFilter.value] === 0) {
      tierFilter.value = 'all'
    }
  },
)
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
  margin-bottom: 14px;
  border: 1px solid rgba(186, 117, 23, 0.35);
  background: rgba(186, 117, 23, 0.08);
  border-radius: 6px;
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

.ranked-tier-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b1);
}

.ranked-tier-filter-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 2px;
  color: var(--t3);
  text-transform: uppercase;
  flex-shrink: 0;
}

.ranked-tier-filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.ranked-tier-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  padding: 4px 9px;
  border-radius: 4px;
  border: 1px solid var(--b2);
  background: rgba(255, 255, 255, 0.03);
  color: var(--t2);
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
  letter-spacing: 0.25px;
}

.ranked-tier-pill:hover {
  border-color: var(--b3);
  color: var(--t1);
}

.ranked-tier-pill.active {
  color: var(--t1);
  border-color: rgba(201, 168, 76, 0.45);
  background: rgba(201, 168, 76, 0.1);
}

.ranked-tier-pill.pill-best.active {
  border-color: rgba(91, 141, 184, 0.5);
  background: rgba(91, 141, 184, 0.12);
  color: var(--blue);
}

.ranked-tier-pill.pill-a.active {
  border-color: rgba(201, 168, 76, 0.5);
  background: rgba(201, 168, 76, 0.12);
  color: var(--gold);
}

.ranked-tier-pill.pill-c.active {
  border-color: var(--b3);
  background: rgba(255, 255, 255, 0.06);
}

.ranked-tier-pill.pill-exit.active {
  border-color: rgba(216, 90, 48, 0.45);
  background: rgba(216, 90, 48, 0.1);
  color: var(--red);
}

.ranked-tier-count {
  font-size: 8px;
  color: var(--t3);
  padding: 1px 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.25);
}

.ranked-tier-pill.active .ranked-tier-count {
  color: inherit;
  opacity: 0.85;
}

.ranked-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t3);
  line-height: 1.5;
}

.ranked-empty strong {
  color: var(--t1);
  font-weight: 600;
}

.ranked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
  gap: 14px;
}

.ranked-grid.exited {
  margin-top: 12px;
}

.ranked-card-outer {
  min-width: 0;
}

.ranked-card-btn {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-radius: 10px;
  transition: transform 0.12s ease, filter 0.12s ease;
}

.ranked-card-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.ranked-card-btn.selected .ranked-card-glass {
  border-color: rgba(201, 168, 76, 0.55);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35),
    0 10px 36px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(201, 168, 76, 0.2);
}

.ranked-card-btn.exited {
  opacity: 0.72;
}

.ranked-card-glass {
  padding: 14px 15px 12px;
}

.ranked-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.ranked-ticker {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--t1);
  line-height: 1.05;
  letter-spacing: 0.02em;
}

.ranked-quality-block {
  flex-shrink: 0;
  text-align: right;
  padding-left: 8px;
}

.ranked-quality-block.muted .ranked-quality-v {
  color: var(--t2);
}

.ranked-quality-v {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
}

.ranked-quality-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  color: var(--t3);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-top: 3px;
}

.ranked-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ranked-tier {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.45px;
  font-weight: 600;
}

.ranked-tier.tier-a {
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.45);
  background: rgba(201, 168, 76, 0.12);
}

.ranked-tier.tier-best {
  color: var(--blue);
  border: 1px solid rgba(91, 141, 184, 0.45);
  background: rgba(91, 141, 184, 0.12);
}

.ranked-tier.tier-c,
.ranked-tier.neutral {
  color: var(--t2);
  border: 1px solid var(--b2);
  background: rgba(255, 255, 255, 0.03);
}

.ranked-tier.tier-exit {
  color: var(--red);
  border: 1px solid rgba(216, 90, 48, 0.4);
  background: rgba(216, 90, 48, 0.1);
}

.ranked-alpha-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.3px;
}

.ranked-alpha-tag.warn {
  color: var(--gold);
  background: rgba(186, 117, 23, 0.18);
  border: 1px solid rgba(186, 117, 23, 0.3);
}

.ranked-alpha-tag.fail {
  color: var(--red);
  background: rgba(216, 90, 48, 0.14);
  border: 1px solid rgba(216, 90, 48, 0.28);
}

.ranked-alpha-tag.info {
  color: var(--t2);
  border: 1px solid var(--b2);
}

.ranked-exit-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--red);
  border: 1px solid rgba(216, 90, 48, 0.35);
  background: rgba(216, 90, 48, 0.08);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ranked-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-bottom: 7px;
}

.ranked-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  padding: 2px 7px;
  border-radius: 3px;
  letter-spacing: 0.35px;
  white-space: nowrap;
}

.ranked-pill.fn {
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.08);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranked-pill.int {
  color: var(--t2);
  border: 1px solid var(--b2);
  background: rgba(255, 255, 255, 0.03);
}

.ranked-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--t3);
  margin-bottom: 10px;
  letter-spacing: 0.2px;
}

.ranked-date-sep {
  margin: 0 4px;
  color: var(--t4);
}

.ranked-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.ranked-stats-grid.compact {
  grid-template-columns: repeat(2, 1fr);
  padding-top: 8px;
}

.ranked-stat {
  text-align: center;
  min-width: 0;
}

.ranked-stat-v {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
}

.ranked-stat-v.hi { color: var(--green); }
.ranked-stat-v.mid { color: var(--gold); }
.ranked-stat-v.lo { color: var(--red); }
.ranked-stat-v.ok { color: var(--green); }
.ranked-stat-v.warn { color: var(--gold); }
.ranked-stat-v.bad { color: var(--red); }
.ranked-stat-v.neutral { color: var(--t2); }
.ranked-stat-v.na { color: var(--t4); }
.ranked-stat-v.muted { color: var(--t3); }
.ranked-stat-v.conviction { color: var(--purple, #9f4ab7); }

.ranked-stat-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  color: var(--t3);
  letter-spacing: 0.45px;
  text-transform: uppercase;
  margin-top: 3px;
}

.ranked-exited {
  margin-top: 20px;
  border-top: 1px solid var(--b1);
  padding-top: 12px;
}

.ranked-exited-summary {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  cursor: pointer;
  list-style: none;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.ranked-exited-summary::-webkit-details-marker { display: none; }
</style>
