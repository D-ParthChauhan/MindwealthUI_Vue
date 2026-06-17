<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="isEmpty"
    label="signals"
    @retry="refresh"
  >
    <!-- Outstanding / New / Shortlist / All Signal Report -->
    <div v-if="isSignalListView && listData" class="scroll">
      <div v-if="filterActive" class="filter-hint-bar">
        {{ filteredSignals.length }} of {{ listData.signals.length }} signals
        <span v-if="activeFunctionLabels.length"> · {{ activeFunctionLabels.join(', ') }}</span>
      </div>
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="LONG"
          :value="String(displaySummary.long)"
          :delta="`${displaySummary.long_pct}%`"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="SHORT"
          :value="String(displaySummary.short)"
          :delta="displaySummary.short_note"
          accent="r"
          delta-class="r"
        />
        <KpiCard
          v-if="viewMode !== 'all-signal'"
          label="NEW TODAY"
          :value="String(listData.summary.new_long + listData.summary.new_short)"
          :delta="`${listData.summary.new_long}L\n${listData.summary.new_short}S`"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          v-else
          label="TOTAL SIGNALS"
          :value="String(listData.signals.length)"
          :delta="reportDateLabel"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          v-if="viewMode !== 'all-signal'"
          label="SHORTLISTED"
          :value="String(listData.summary.shortlisted ?? 0)"
          delta="cross-confirmed"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          v-else
          label="FUNCTIONS"
          :value="String(listData.function_counts?.length ?? 0)"
          delta="active in book"
          accent="b"
          delta-class="b"
        />
      </div>
      <div class="card signals-card" :class="{ 'has-detail': detailOpen }">
        <div class="ct">{{ tableTitle }}</div>
        <div class="cm">
          <template v-if="detailOpen">FUNCTION · INTERVAL · DIRECTION · BT · FWD · SENTIMENT</template>
          <template v-else>FUNCTION · INTERVAL · DIRECTION · BT WIN RATE · FWD WIN RATE · SENTIMENT SCORE · STATUS</template>
        </div>
        <div class="signals-table-wrap" :class="{ 'has-detail': detailOpen }">
          <div class="signals-table-main">
            <div class="m-tbl-scroll">
              <table class="tbl" :class="{ 'tbl-squeezed': detailOpen }">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>{{ detailOpen ? 'Fn' : 'Function' }}</th>
                    <th>{{ detailOpen ? 'Int' : 'Interval' }}</th>
                    <th>Dir</th>
                    <th>BT WR</th>
                    <th>FWD WR</th>
                    <th>Signal Date</th>
                    <th>{{ detailOpen ? 'Sent.' : 'Sentiment Score' }}</th>
                    <th v-if="!detailOpen">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in tableRows"
                    :key="row.key"
                    :class="{
                      'row-fwd-degraded': row.fwdDegraded,
                      'row-selected': detailOpen && rowIndex === selectedIndex,
                    }"
                    @click="openDetail(rowIndex)"
                  >
                    <td>
                      <div class="tkr-cell">
                        <span class="fwd-deg-slot" aria-hidden="true">
                          <span v-if="row.fwdDegraded" class="fwd-deg-line" title="FWD degrading" />
                        </span>
                        <button
                          type="button"
                          class="tkr tkr-btn"
                          :class="{ active: detailOpen && rowIndex === selectedIndex }"
                          :title="`View ${row.ticker} details`"
                          @click.stop="openDetail(rowIndex)"
                        >
                          {{ row.ticker }}
                        </button>
                      </div>
                    </td>
                    <td
                      class="tfn fn-cell"
                      :title="detailOpen ? row.function : undefined"
                    >
                      {{ detailOpen ? row.functionShort : row.function }}
                    </td>
                    <td class="tfn" :title="detailOpen ? row.interval : undefined">
                      {{ detailOpen ? row.intervalShort : row.interval }}
                    </td>
                    <td><DirectionBadge :direction="row.direction" /></td>
                    <td class="wr" :class="row.btClass">{{ row.btWr }}</td>
                    <td class="wr" :class="row.fwdClass">{{ row.fwdWr }}</td>
                    <td class="tfn">{{ row.date }}</td>
                    <td><span class="ctag" :class="row.tagClass">{{ row.tag }}</span></td>
                    <td v-if="!detailOpen" class="tfn" :style="{ color: row.statusColor }">{{ row.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <SignalDetailPanel
            v-if="detailOpen && selectedSignal"
            :signal="selectedSignal"
            :index="selectedIndex!"
            :total="filteredSignals.length"
            @close="closeDetail"
            @prev="selectPrev"
            @next="selectNext"
          />
        </div>
        <div v-if="hasDegraded" class="signals-note">
          <span class="fwd-deg-slot inline" aria-hidden="true"><span class="fwd-deg-line" /></span>
          Gold line: FWD win rate trails backtest by more than 10pp (may still be above the 60% floor).
        </div>
        <div v-if="filterActive && tableRows.length === 0" class="signals-note">
          No signals match the current function or interval filters. Clear sidebar function selections or choose All intervals.
        </div>
      </div>
    </div>

    <!-- SBI Breadth -->
    <div v-else-if="viewMode === 'breadth' && breadthData" class="scroll">
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="SBI COMPOSITE"
          :value="breadthData.sentiment.score"
          :delta="breadthData.sentiment.label"
          accent="p"
          delta-class="t"
        />
        <KpiCard
          label="FUNCTIONS"
          :value="String(breadthFunctionRows.length)"
          :delta="reportDateLabel"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="COMBINED LONG %"
          :value="`${combinedBreadth?.bullish_signal_percentage.toFixed(1) ?? '—'}%`"
          delta="signal percentile"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="COMBINED ASSET %"
          :value="`${combinedBreadth?.bullish_asset_percentage.toFixed(1) ?? '—'}%`"
          delta="asset breadth"
          accent="b"
          delta-class="b"
        />
      </div>
      <div class="card">
        <div class="ct">Signal Breadth Indicator (SBI)</div>
        <div class="cm">TODAY LONG SIGNAL % · TODAY LONG ASSET % · LAST 6 MONTH PERCENTILE</div>
        <div class="breadth-bars">
          <div v-for="row in breadthRows" :key="row.function" class="breadth-row">
            <div class="breadth-fn">{{ row.function }}</div>
            <div class="breadth-bar-wrap">
              <div
                class="breadth-bar signal"
                :style="{ width: `${Math.min(100, row.bullish_signal_percentage)}%` }"
              />
            </div>
            <div class="breadth-val">{{ row.bullish_signal_percentage.toFixed(1) }}%</div>
            <div class="breadth-val asset">{{ row.bullish_asset_percentage.toFixed(1) }}%</div>
          </div>
        </div>
        <div class="m-tbl-scroll" style="margin-top:12px">
          <table class="tbl">
            <thead>
              <tr>
                <th>Function</th><th>Long Signal %</th><th>Long Asset %</th><th>Signal Bar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in breadthRows" :key="`tbl-${row.function}`">
                <td><div class="tkr">{{ row.function }}</div></td>
                <td class="wr" :class="wrClass(row.bullish_signal_percentage)">{{ row.bullish_signal_percentage.toFixed(1) }}%</td>
                <td class="wr mid">{{ row.bullish_asset_percentage.toFixed(1) }}%</td>
                <td>
                  <div class="inline-bar">
                    <div class="inline-bar-fill" :style="{ width: `${Math.min(100, row.bullish_signal_percentage)}%` }" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Horizontal & New High -->
    <div v-else-if="viewMode === 'horizontal' && horizontalData" class="scroll">
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="TOTAL ROWS"
          :value="String(horizontalData.row_count)"
          :delta="reportDateLabel"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="NEW HIGH"
          :value="String(horizontalNewHighCount)"
          delta="at or near highs"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="HORIZONTAL"
          :value="String(horizontalFlatCount)"
          delta="consolidation"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          label="UNIQUE TICKERS"
          :value="String(horizontalUniqueTickers)"
          delta="in report"
          accent="t"
          delta-class="t"
        />
      </div>
      <div class="card">
        <div class="ct">Horizontal &amp; New High Report</div>
        <div class="cm">REPORT TYPE · SYMBOL · TODAY PRICE · NEW HIGHEST</div>
        <div class="m-tbl-scroll">
          <table class="tbl">
            <thead>
              <tr>
                <th>Type</th><th>Ticker</th><th>Today Price</th><th>New Highest</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in horizontalData.rows" :key="`${row.symbol}-${row.report_type}`">
                <td>
                  <span class="ctag" :class="row.report_type.toLowerCase().includes('high') ? 'aligned' : 'neutral'">
                    {{ row.report_type }}
                  </span>
                </td>
                <td><div class="tkr">{{ row.symbol }}</div></td>
                <td class="tfn">{{ row.today_price }}</td>
                <td class="tfn" :style="{ color: row.new_highest.includes('√') ? 'var(--green)' : 'var(--t3)' }">
                  {{ row.new_highest }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Combined Performance -->
    <div v-else-if="viewMode === 'performance' && performanceData" class="scroll">
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="AVG FWD WR"
          :value="`${performanceData.aggregates?.avg_forward_wr ?? 0}%`"
          delta="forward testing"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          label="AVG BT WR"
          :value="`${performanceData.aggregates?.avg_backtest_wr ?? 0}%`"
          delta="backtested"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="TOTAL TRADES"
          :value="String(performanceData.aggregates?.total_trades ?? 0)"
          :delta="reportDateLabel"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="DEGRADING"
          :value="String(performanceData.aggregates?.degrading_count ?? 0)"
          delta="FWD &gt;10pp below BT"
          accent="r"
          delta-class="r"
        />
      </div>

      <div class="card" style="margin-bottom:12px">
        <div class="ct">Forward Testing · Function Health</div>
        <div class="cm">STRATEGY · INTERVAL · DIRECTION · FWD WR · BT WR · TRADES · AVG PROFIT</div>
        <div class="m-tbl-scroll">
          <table class="tbl">
            <thead>
              <tr>
                <th>Strategy</th><th>Interval</th><th>Dir</th>
                <th>FWD WR</th><th>BT WR</th><th>Gap</th><th>Trades</th><th>Avg Profit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in performanceData.forward_testing"
                :key="`${row.strategy}-${row.interval}-${row.signal_type}`"
                :class="{ 'row-fwd-degraded': perfDegraded(row) }"
              >
                <td>
                  <div class="tkr-cell">
                    <span class="fwd-deg-slot" aria-hidden="true">
                      <span v-if="perfDegraded(row)" class="fwd-deg-line" title="FWD degrading" />
                    </span>
                    <div class="tkr">{{ row.strategy }}</div>
                  </div>
                </td>
                <td class="tfn">{{ row.interval }}</td>
                <td><DirectionBadge :direction="row.signal_type" /></td>
                <td class="wr" :class="wrClass(row.win_percentage)">{{ row.win_percentage.toFixed(1) }}%</td>
                <td class="wr hi">{{ row.avg_backtested_win_rate.toFixed(1) }}%</td>
                <td class="tfn" :style="{ color: perfGapColor(row) }">{{ perfGap(row) }}</td>
                <td class="tfn">{{ row.total_trades }}</td>
                <td class="tfn">{{ row.avg_profit != null ? `${row.avg_profit.toFixed(1)}%` : '—' }}</td>
                <td class="tfn" :style="{ color: perfDegraded(row) ? 'var(--gold)' : 'var(--green)' }">
                  {{ perfDegraded(row) ? '⚠ degrading' : '✓ healthy' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="ct">Latest Performance Summary</div>
        <div class="cm">AGGREGATED LATEST PERFORMANCE ROWS BY INTERVAL</div>
        <div class="m-tbl-scroll">
          <table class="tbl">
            <thead>
              <tr>
                <th>Interval</th><th>Dir</th><th>Win %</th><th>BT WR</th><th>Trades</th>
                <th>Best</th><th>Worst</th><th>Avg Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in performanceData.latest_performance"
                :key="`latest-${row.interval}-${row.signal_type}-${row.total_trades}`"
              >
                <td class="tfn">{{ row.interval }}</td>
                <td><DirectionBadge :direction="row.signal_type" /></td>
                <td class="wr" :class="wrClass(row.win_percentage)">{{ row.win_percentage.toFixed(1) }}%</td>
                <td class="wr hi">{{ row.avg_backtested_win_rate.toFixed(1) }}%</td>
                <td class="tfn">{{ row.total_trades }}</td>
                <td class="tfn green">{{ row.best_profit != null ? `${row.best_profit.toFixed(1)}%` : '—' }}</td>
                <td class="tfn" style="color:var(--red)">{{ row.worst_profit != null ? `${row.worst_profit.toFixed(1)}%` : '—' }}</td>
                <td class="tfn">{{ row.avg_profit != null ? `${row.avg_profit.toFixed(1)}%` : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
import type { CombinedPerformanceReportRow } from '~/types/api'
import SignalDetailPanel from '~/components/signals/SignalDetailPanel.vue'
import {
  activeFilterLabels,
  buildSignalsSummary,
  filterSignals,
} from '~/utils/signal-filters'
import { mapSignalRow, winRateClass } from '~/utils/signals'

definePageMeta({ layout: 'terminal' })

type SignalViewMode = 'signals' | 'all-signal' | 'breadth' | 'horizontal' | 'performance'

const navActiveId = useState<string>('terminal-nav-id', () => 'outstanding')
const { selectedFunctionIds, intervalFilter } = useSignalFilters()
const {
  fetchSignalsOutstanding,
  fetchSignalsNew,
  fetchShortlist,
  fetchAllSignals,
  fetchBreadth,
  fetchHorizontalNewHigh,
  fetchCombinedPerformanceReport,
} = useApi()

const outstanding = fetchSignalsOutstanding()
const newSignals = fetchSignalsNew()
const shortlist = fetchShortlist()
const allSignals = fetchAllSignals()
const breadth = fetchBreadth()
const horizontal = fetchHorizontalNewHigh()
const combinedPerformance = fetchCombinedPerformanceReport()

const viewMode = computed((): SignalViewMode => {
  const nav = navActiveId.value
  if (nav === 'report') return 'all-signal'
  if (nav === 'sbi') return 'breadth'
  if (nav === 'high') return 'horizontal'
  if (nav === 'perf') return 'performance'
  return 'signals'
})

const isSignalListView = computed(() =>
  viewMode.value === 'signals' || viewMode.value === 'all-signal',
)

const activeSource = computed(() => {
  const nav = navActiveId.value
  if (nav === 'new') return newSignals
  if (nav === 'shortlist') return shortlist
  return outstanding
})

const listData = computed(() => {
  if (viewMode.value === 'all-signal') return allSignals.data.value
  if (navActiveId.value === 'shortlist') {
    const sl = shortlist.data.value
    if (!sl) return null
    const symbols = new Set((sl.rows ?? []).map((r) => r.symbol))
    const sigs = outstanding.data.value?.signals.filter((s) => symbols.has(s.symbol)) ?? []
    return {
      meta: sl.meta,
      summary: outstanding.data.value?.summary ?? {
        long: 0,
        short: 0,
        long_pct: 0,
        short_note: '',
        new_long: 0,
        new_short: 0,
        shortlisted: sl.count,
      },
      signals: sigs,
    }
  }
  return activeSource.value.data.value
})

const filteredSignals = computed(() => {
  const signals = listData.value?.signals ?? []
  return filterSignals(signals, selectedFunctionIds.value, intervalFilter.value)
})

const displaySummary = computed(() => {
  const base = listData.value?.summary
  const shortlisted = base?.shortlisted ?? 0
  return buildSignalsSummary(filteredSignals.value, shortlisted)
})

const filterActive = computed(
  () => selectedFunctionIds.value.size > 0 || intervalFilter.value !== 'all',
)

const activeFunctionLabels = computed(() => activeFilterLabels(selectedFunctionIds.value))

const breadthData = computed(() => breadth.data.value)
const horizontalData = computed(() => horizontal.data.value)
const performanceData = computed(() => combinedPerformance.data.value)

const breadthRows = computed(() =>
  (breadthData.value?.rows ?? []).filter((r) => r.function.toLowerCase() !== 'combined'),
)
const breadthFunctionRows = computed(() => breadthRows.value)
const combinedBreadth = computed(() =>
  breadthData.value?.rows.find((r) => r.function.toLowerCase() === 'combined'),
)

const horizontalNewHighCount = computed(() =>
  (horizontalData.value?.rows ?? []).filter((r) => r.report_type.toLowerCase().includes('high')).length,
)
const horizontalFlatCount = computed(() =>
  (horizontalData.value?.rows ?? []).filter((r) => r.report_type.toLowerCase().includes('horizontal')).length,
)
const horizontalUniqueTickers = computed(() =>
  new Set((horizontalData.value?.rows ?? []).map((r) => r.symbol)).size,
)

const reportDateLabel = computed(() => {
  const meta =
    listData.value?.meta ??
    breadthData.value?.meta ??
    horizontalData.value?.meta ??
    performanceData.value?.meta
  const date =
    horizontalData.value?.report_date ??
    performanceData.value?.report_date ??
    meta?.data_updated_at?.date
  return date ? `as of ${date}` : 'live'
})

const pending = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') return allSignals.pending.value
  if (nav === 'breadth') return breadth.pending.value
  if (nav === 'horizontal') return horizontal.pending.value
  if (nav === 'performance') return combinedPerformance.pending.value
  if (navActiveId.value === 'shortlist') {
    return outstanding.pending.value || shortlist.pending.value
  }
  return activeSource.value.pending.value
})

const error = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') return allSignals.error.value
  if (nav === 'breadth') return breadth.error.value
  if (nav === 'horizontal') return horizontal.error.value
  if (nav === 'performance') return combinedPerformance.error.value
  if (navActiveId.value === 'shortlist') {
    return outstanding.error.value || shortlist.error.value
  }
  return activeSource.value.error.value
})

const isEmpty = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') return !allSignals.data.value?.signals?.length
  if (nav === 'breadth') return !breadthData.value?.rows?.length
  if (nav === 'horizontal') return !horizontalData.value?.rows?.length
  if (nav === 'performance') {
    return !performanceData.value?.forward_testing?.length && !performanceData.value?.latest_performance?.length
  }
  return !listData.value
})

function refresh() {
  outstanding.refresh()
  newSignals.refresh()
  shortlist.refresh()
  allSignals.refresh()
  breadth.refresh()
  horizontal.refresh()
  combinedPerformance.refresh()
}

const tableTitle = computed(() => {
  if (viewMode.value === 'all-signal') return 'All Signal Report'
  if (navActiveId.value === 'new') return 'New Signals'
  if (navActiveId.value === 'shortlist') return 'Claude Shortlisted'
  return 'Outstanding Signals'
})

const tableRows = computed(() => filteredSignals.value.map(mapSignalRow))
const hasDegraded = computed(() => tableRows.value.some((r) => r.fwdDegraded))

const selectedIndex = ref<number | null>(null)
const detailOpen = computed(() => selectedIndex.value !== null)

const selectedSignal = computed(() => {
  const idx = selectedIndex.value
  if (idx == null || idx < 0) return null
  return filteredSignals.value[idx] ?? null
})

function openDetail(index: number) {
  if (index >= 0 && index < filteredSignals.value.length) {
    selectedIndex.value = index
  }
}

function closeDetail() {
  selectedIndex.value = null
}

function selectPrev() {
  const idx = selectedIndex.value
  if (idx != null && idx > 0) selectedIndex.value = idx - 1
}

function selectNext() {
  const idx = selectedIndex.value
  if (idx != null && idx < filteredSignals.value.length - 1) {
    selectedIndex.value = idx + 1
  }
}

watch([viewMode, navActiveId], () => {
  selectedIndex.value = null
})

watch(filteredSignals, (list) => {
  const idx = selectedIndex.value
  if (idx == null) return
  if (idx >= list.length) selectedIndex.value = null
})

function wrClass(pct: number) {
  return winRateClass(pct)
}

function perfGap(row: CombinedPerformanceReportRow) {
  const gap = Math.round((row.win_percentage - row.avg_backtested_win_rate) * 10) / 10
  return `${gap >= 0 ? '+' : ''}${gap}pp`
}

function perfGapColor(row: CombinedPerformanceReportRow) {
  const gap = row.win_percentage - row.avg_backtested_win_rate
  if (gap < -10) return 'var(--red)'
  if (gap < 0) return 'var(--gold)'
  return 'var(--green)'
}

function perfDegraded(row: CombinedPerformanceReportRow) {
  return row.win_percentage < row.avg_backtested_win_rate - 10
}
</script>

<style scoped>
.filter-hint-bar {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-bottom: 10px;
}
.tkr-cell {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
}
.fwd-deg-slot {
  width: 7px;
  min-width: 7px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fwd-deg-slot.inline {
  display: inline-flex;
  vertical-align: middle;
  margin-right: 5px;
}
.fwd-deg-line {
  display: block;
  width: 1px;
  height: 13px;
  border-radius: 1px;
  background: var(--gold);
}
.row-fwd-degraded .tkr {
  color: #fff;
}
.row-fwd-degraded .tfn {
  color: #e2e6ec;
}
.row-fwd-degraded .wr.lo {
  color: #ff8a7a;
}
.signals-note {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  padding: 10px 10px 2px;
  border-top: 1px solid var(--b1);
  margin-top: 8px;
}
.signals-card.has-detail {
  overflow: hidden;
}
.signals-table-wrap {
  width: 100%;
  min-width: 0;
}
.signals-table-wrap.has-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 0;
  border-top: 1px solid var(--b1);
  margin-top: 4px;
  align-items: stretch;
}
.signals-table-main {
  min-width: 0;
  overflow: hidden;
}
.signals-table-wrap.has-detail .signals-table-main {
  border-right: 1px solid var(--b1);
}
.signals-table-wrap.has-detail .m-tbl-scroll {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}
.tbl-squeezed {
  table-layout: fixed;
  width: 100%;
}
.tbl-squeezed th,
.tbl-squeezed td {
  padding-left: 6px;
  padding-right: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tbl-squeezed th:nth-child(1),
.tbl-squeezed td:nth-child(1) {
  width: 18%;
}
.tbl-squeezed th:nth-child(2),
.tbl-squeezed td:nth-child(2) {
  width: 8%;
}
.tbl-squeezed th:nth-child(3),
.tbl-squeezed td:nth-child(3) {
  width: 7%;
}
.tbl-squeezed .fn-cell {
  font-size: 9px;
}
.tbl-squeezed th:nth-child(8),
.tbl-squeezed td:nth-child(8) {
  white-space: normal;
}
.tkr-btn {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.tkr-btn:hover,
.tkr-btn.active {
  color: var(--gold);
}
tbody tr {
  cursor: pointer;
}
.row-selected td {
  background: rgba(201, 168, 76, 0.06);
}
.row-selected .tkr-btn {
  color: #fff;
}
@media (max-width: 900px) {
  .signals-table-wrap.has-detail {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
  }
  .signals-table-wrap.has-detail .signals-table-main {
    border-right: none;
    border-bottom: 1px solid var(--b1);
  }
  .signals-table-wrap.has-detail :deep(.sig-detail) {
    max-width: none;
    min-width: 0;
    border-left: none;
    max-height: 50vh;
  }
}
.breadth-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0 8px;
}
.breadth-row {
  display: grid;
  grid-template-columns: 120px 1fr 52px 52px;
  gap: 8px;
  align-items: center;
}
.breadth-fn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.breadth-bar-wrap {
  height: 8px;
  background: var(--s2);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--b1);
}
.breadth-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--green);
}
.breadth-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--green);
  text-align: right;
}
.breadth-val.asset {
  color: var(--blue);
}
.inline-bar {
  height: 6px;
  background: var(--s2);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
}
.inline-bar-fill {
  height: 100%;
  background: var(--green);
  border-radius: 3px;
}
.green { color: var(--green); }
</style>
