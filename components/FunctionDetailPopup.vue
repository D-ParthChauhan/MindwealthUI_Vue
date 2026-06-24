<template>
  <Teleport to="body">
    <Transition name="fn-pop">
      <div v-if="open" class="fn-pop-root" role="presentation">
        <div class="fn-pop-backdrop" aria-hidden="true" @click="close" />
        <div class="fn-pop-card" role="dialog" :aria-label="`${displayName} details`">
          <div class="fn-pop-head">
            <div>
              <div class="fn-pop-title">{{ displayName }}</div>
              <div v-if="sidebarItem?.subtitle" class="fn-pop-sub">{{ sidebarItem.subtitle }}</div>
            </div>
            <div class="fn-pop-head-right">
              <span
                v-if="sidebarItem?.status"
                class="fn-pop-status"
                :class="sidebarItem.status"
              >
                {{ sidebarItem.status === 'green' ? 'Healthy' : 'Degraded' }}
              </span>
              <button type="button" class="fn-pop-close" aria-label="Close" @click="close">×</button>
            </div>
          </div>

          <div v-if="dataPending" class="fn-pop-empty">Loading performance…</div>
          <div v-else-if="displayRows.length === 0" class="fn-pop-empty">
            No performance rows returned for this function.
          </div>
          <div v-else class="fn-pop-table-wrap">
            <table class="tbl fn-pop-tbl">
              <thead>
                <tr>
                  <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in displayRows"
                  :key="`${row.strategy ?? row.function}-${row.interval}-${row.signal_type}-${i}`"
                  :class="{ 'row-fwd-degraded': isDegraded(row) }"
                >
                  <td v-for="col in columns" :key="col.key" :class="cellClass(col.key, row)">
                    <template v-if="col.key === 'signal_type'">
                      <DirectionBadge :direction="String(row.signal_type)" />
                    </template>
                    <template v-else>
                      {{ formatCell(col.key, row[col.key]) }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { apiPercent } from '~/utils/api-display'

const {
  open,
  displayName,
  sidebarItem,
  displayRows,
  dataPending,
  dashboard,
  close,
} = useFunctionPopup()

const HIDDEN_KEYS = new Set([
  'function',
  'strategy',
  'best_profit',
  'worst_profit',
  'avg_profit',
  'max_holding_days',
  'min_holding_days',
  'avg_holding_days',
  'avg_backtested_holding_days',
])

const columns = computed(() => {
  const row = displayRows.value[0]
  if (!row) return [] as Array<{ key: string; label: string }>
  return Object.keys(row)
    .filter((key) => !HIDDEN_KEYS.has(key))
    .map((key) => ({ key, label: humanizeKey(key) }))
})

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCell(key: string, value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') {
    if (/percentage|profit|rate|wr/i.test(key)) {
      return apiPercent(dashboard.value, value, 'fetch')
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }
  if (key === 'section') {
    return String(value).replace(/_/g, ' ')
  }
  return String(value)
}

function isDegraded(row: Record<string, unknown>): boolean {
  const win = row.win_percentage
  const bt = row.avg_backtested_win_rate
  if (typeof win !== 'number' || typeof bt !== 'number') return false
  return win < bt - 10
}

function cellClass(key: string, row: Record<string, unknown>): string | undefined {
  const win = row.win_percentage
  if (key === 'win_percentage' && typeof win === 'number') {
    if (win >= 85) return 'wr hi'
    if (win >= 70) return 'wr mid'
    return 'wr lo'
  }
  if (key === 'avg_backtested_win_rate') return 'wr hi'
  return undefined
}
</script>

<style scoped>
.fn-pop-root {
  position: fixed;
  inset: 0;
  z-index: 650;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.fn-pop-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}
.fn-pop-card {
  position: relative;
  width: min(560px, 100%);
  max-height: min(80vh, 640px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: 6px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65);
}
.fn-pop-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--b2);
  background: var(--s2);
  flex-shrink: 0;
}
.fn-pop-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.fn-pop-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-top: 3px;
}
.fn-pop-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.fn-pop-status {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid var(--b2);
}
.fn-pop-status.green {
  color: var(--green);
  border-color: rgba(61, 220, 132, 0.25);
  background: rgba(61, 220, 132, 0.06);
}
.fn-pop-status.red {
  color: var(--gold);
  border-color: rgba(201, 168, 76, 0.25);
  background: rgba(201, 168, 76, 0.06);
}
.fn-pop-close {
  background: none;
  border: none;
  color: var(--t3);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  border-radius: 3px;
}
.fn-pop-close:hover {
  color: var(--t2);
  background: var(--s1);
}
.fn-pop-table-wrap {
  overflow: auto;
  padding: 0 0 4px;
  flex: 1;
  min-height: 0;
}
.fn-pop-tbl {
  font-size: 10px;
}
.fn-pop-tbl th,
.fn-pop-tbl td {
  white-space: nowrap;
}
.fn-pop-empty {
  padding: 28px 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  line-height: 1.6;
}
.fn-pop-enter-active,
.fn-pop-leave-active {
  transition: opacity 0.18s ease;
}
.fn-pop-enter-active .fn-pop-card,
.fn-pop-leave-active .fn-pop-card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.fn-pop-enter-from,
.fn-pop-leave-to {
  opacity: 0;
}
.fn-pop-enter-from .fn-pop-card,
.fn-pop-leave-to .fn-pop-card {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
