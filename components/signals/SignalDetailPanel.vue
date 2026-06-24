<template>
  <aside class="sig-detail" role="complementary" aria-label="Signal detail">
    <div class="sig-detail-toolbar">
      <div class="sig-detail-nav">
        <button
          type="button"
          class="sig-detail-arrow"
          :disabled="index <= 0"
          aria-label="Previous signal"
          @click="$emit('prev')"
        >
          ‹
        </button>
        <span class="sig-detail-counter">{{ index + 1 }} / {{ total }}</span>
        <button
          type="button"
          class="sig-detail-arrow"
          :disabled="index >= total - 1"
          aria-label="Next signal"
          @click="$emit('next')"
        >
          ›
        </button>
      </div>
      <button type="button" class="sig-detail-close" aria-label="Close" @click="$emit('close')">
        ×
      </button>
    </div>

    <div class="sig-detail-hero-wrap mw-glass-hero-wrap">
      <header class="sig-detail-hero mw-glass-hero" :class="heroToneClass">
        <div class="mw-glass-hero-inner">
          <div class="sig-detail-title-row">
            <div class="sig-detail-ticker">{{ signal.symbol }}</div>
            <div class="sig-detail-badges">
              <DirectionBadge :direction="direction" />
              <span v-if="degraded" class="sig-detail-chip warn">FWD ↓</span>
              <span v-else-if="isActive" class="sig-detail-chip ok">Active</span>
            </div>
          </div>

          <div v-if="functionLabel || intervalLabel" class="sig-detail-fn-row">
            <span v-if="functionLabel" class="sig-fn-pill fn">{{ functionLabel }}</span>
            <span v-if="intervalLabel" class="sig-fn-pill int">{{ intervalLabel }}</span>
          </div>

          <div class="sig-detail-meta">
            <div
              v-for="field in visibleHeaderFields"
              :key="field.key"
              class="sig-detail-meta-item"
              :class="[headerItemClass(field.key), { wide: field.key === 'confirmation_status' }]"
            >
              <div class="sig-detail-meta-label">{{ field.label }}</div>
              <div
                class="sig-detail-meta-value"
                :class="headerValueClass(field)"
                :title="field.value.length > 48 ? field.value : undefined"
              >
                {{ field.value }}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>

    <div class="sig-detail-body">
      <details
        v-for="section in dropdownSections"
        :key="section.id"
        class="sig-acc"
        :open="openSections.has(section.id)"
        @toggle="onSectionToggle(section.id, $event)"
      >
        <summary class="sig-acc-summary">
          <span class="sig-acc-chevron" aria-hidden="true" />
          <span class="sig-acc-title">{{ section.title }}</span>
          <span class="sig-acc-count">{{ section.fields.length }}</span>
        </summary>
        <div class="sig-acc-panel">
          <div v-for="field in section.fields" :key="field.key" class="sig-acc-field">
            <div class="sig-acc-label">{{ field.label }}</div>
            <div
              class="sig-acc-value"
              :class="bodyValueClass(field)"
              :title="field.value.length > 64 ? field.value : undefined"
            >
              {{ field.value }}
            </div>
          </div>
        </div>
      </details>
    </div>

    <footer v-if="showAcrossAllNote" class="sig-detail-foot">
      {{ acrossAllNote }}
    </footer>
  </aside>
</template>

<script setup lang="ts">
import type { Signal } from '~/types/api'
import {
  buildSignalDetailLayout,
  SIGNAL_DETAIL_ACROSS_ALL_NOTE,
  type SignalDetailField,
} from '~/utils/signal-detail'
import { deriveSignalStatus, formatDirection } from '~/utils/signals'

const props = defineProps<{
  signal: Signal
  index: number
  total: number
}>()

defineEmits<{
  close: []
  prev: []
  next: []
}>()

const signalHealth = computed(() => deriveSignalStatus(props.signal))
const direction = computed(() => formatDirection(props.signal.signal_type))
const degraded = computed(() => signalHealth.value === 'degraded')
const isActive = computed(() => signalHealth.value === 'active')

const layout = computed(() => buildSignalDetailLayout(props.signal))
const headerFields = computed(() => layout.value.headerFields)
const functionLabel = computed(() => headerFields.value.find((f) => f.key === 'function')?.value)
const intervalLabel = computed(() => headerFields.value.find((f) => f.key === 'interval')?.value)
const visibleHeaderFields = computed(() =>
  headerFields.value.filter((f) => f.key !== 'function' && f.key !== 'interval'),
)
const heroToneClass = computed(() => {
  if (degraded.value) return 'tone-a'
  if (isActive.value) return 'tone-g'
  return ''
})
const dropdownSections = computed(() => layout.value.sections)
const showAcrossAllNote = computed(() => layout.value.showAcrossAllNote)
const acrossAllNote = SIGNAL_DETAIL_ACROSS_ALL_NOTE

const openSections = ref<Set<string>>(new Set(['performance']))

watch(
  () => props.signal.symbol + props.index,
  () => {
    openSections.value = new Set(
      dropdownSections.value.some((s) => s.id === 'performance') ? ['performance'] : [],
    )
  },
)

function onSectionToggle(id: string, event: Event) {
  const el = event.target as HTMLDetailsElement
  const next = new Set(openSections.value)
  if (el.open) next.add(id)
  else next.delete(id)
  openSections.value = next
}

function headerItemClass(key: string): string {
  if (key === 'signal_price') return 'meta-price'
  if (key === 'sentiment') return 'meta-sentiment'
  if (key === 'confirmation_status') return 'meta-confirm'
  return ''
}

function headerValueClass(field: SignalDetailField): string {
  if (field.key === 'signal_price') return 'val-price'
  if (field.key === 'sentiment') {
    const v = field.value.toLowerCase()
    if (v.includes('bullish') || v.includes('aligned')) return 'val-sent-pos'
    if (v.includes('caution') || v.includes('degraded')) return 'val-sent-warn'
    return 'val-sent-neutral'
  }
  if (field.key === 'signal_date') return 'val-date'
  return ''
}

function bodyValueClass(field: SignalDetailField): string {
  if (!field.tone) return ''
  return `val-accent val-accent-${field.tone}`
}
</script>

<style scoped>
.sig-detail {
  width: 100%;
  min-width: 0;
  border-left: none;
  background: var(--s2);
  display: flex;
  flex-direction: column;
  max-height: min(72vh, 640px);
  min-height: 280px;
}

.sig-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--b1);
  flex-shrink: 0;
  background: var(--s1);
}

.sig-detail-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sig-detail-arrow {
  width: 26px;
  height: 26px;
  border: 1px solid var(--b2);
  border-radius: 4px;
  background: var(--s2);
  color: var(--t1);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sig-detail-arrow:hover:not(:disabled) {
  border-color: var(--gold);
  color: #fff;
}

.sig-detail-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.sig-detail-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t2);
  min-width: 52px;
  text-align: center;
}

.sig-detail-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--t2);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.sig-detail-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.sig-detail-hero-wrap {
  padding: 12px 14px 11px;
}

.sig-detail-fn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.sig-fn-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.3px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  line-height: 1.2;
}

.sig-fn-pill.fn {
  color: var(--gold2);
  background: rgba(201, 168, 76, 0.14);
  border-color: rgba(201, 168, 76, 0.28);
}

.sig-fn-pill.int {
  color: #7dcec4;
  background: rgba(22, 160, 133, 0.14);
  border-color: rgba(22, 160, 133, 0.28);
}

.sig-detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.sig-detail-ticker {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
  line-height: 1.1;
}

.sig-detail-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.sig-detail-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--b2);
  color: var(--t2);
}

.sig-detail-chip.ok {
  color: var(--green);
  border-color: rgba(39, 174, 96, 0.35);
  background: rgba(39, 174, 96, 0.1);
}

.sig-detail-chip.warn {
  color: var(--gold);
  border-color: rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
}

.sig-detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 10px;
}

.sig-detail-meta-item.wide {
  grid-column: 1 / -1;
}

.sig-detail-meta-label {
  font-size: 10px;
  color: var(--t3);
  line-height: 1.2;
  margin-bottom: 3px;
  letter-spacing: 0.2px;
}

.sig-detail-meta-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: var(--t1);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sig-detail-meta-item.meta-price .sig-detail-meta-label {
  color: var(--gold);
}

.sig-detail-meta-item.meta-sentiment .sig-detail-meta-label {
  color: var(--teal);
}

.sig-detail-meta-item.meta-confirm .sig-detail-meta-label {
  color: var(--blue);
}

.val-price {
  color: #fff;
  font-weight: 600;
}

.val-date {
  color: #dce2ea;
}

.val-sent-pos {
  color: #9fdcb8;
}

.val-sent-warn {
  color: #e8d08a;
}

.val-sent-neutral {
  color: #c5cad3;
}

.sig-detail-meta-item.wide .sig-detail-meta-value {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sig-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px 10px;
}

.sig-acc {
  border: 1px solid var(--b1);
  border-radius: 5px;
  background: var(--s1);
  margin-bottom: 6px;
}

.sig-acc:last-child {
  margin-bottom: 0;
}

.sig-acc-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.sig-acc-summary::-webkit-details-marker {
  display: none;
}

.sig-acc-chevron {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid var(--gold);
  border-bottom: 1.5px solid var(--gold);
  transform: rotate(-45deg);
  transition: transform 0.15s ease;
  flex-shrink: 0;
  margin-top: -2px;
}

.sig-acc[open] .sig-acc-chevron {
  transform: rotate(45deg);
  margin-top: 2px;
}

.sig-acc-title {
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
}

.sig-acc-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--t2);
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--s2);
  border: 1px solid var(--b1);
}

.sig-acc-panel {
  padding: 2px 10px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.sig-acc-field {
  display: grid;
  grid-template-columns: minmax(0, 40%) minmax(0, 1fr);
  gap: 6px 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sig-acc-field:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}

.sig-acc-label {
  font-size: 10.5px;
  color: #b4bac5;
  line-height: 1.35;
}

.sig-acc-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: var(--t1);
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.val-accent {
  display: inline-block;
  padding: 1px 0 1px 8px;
  border-left: 2px solid transparent;
}

.val-accent-pos {
  border-left-color: var(--green);
}

.val-accent-neg {
  border-left-color: var(--amber);
}

.val-accent-warn {
  border-left-color: var(--gold);
}

.val-accent-muted {
  border-left-color: var(--b3);
  color: #c5cad3;
}

.sig-detail-foot {
  flex-shrink: 0;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--b1);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  line-height: 1.45;
  color: #a8b0bc;
  background: var(--s1);
}
</style>
