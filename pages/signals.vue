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
          label="CLAUDE SHORTLISTED"
          :value="String(shortlistCount)"
          :delta="shortlistDateLabel"
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
      <div v-if="isMobile && isSignalListView" class="signals-mobile-display-mode">
        <SignalsDisplayModeSelect />
      </div>
      <div class="card signals-card" :class="{ 'has-detail': detailOpen }">
        <div class="ct">{{ contentTitle }}</div>

        <!-- Tables -->
        <template v-if="displayMode === 'tables'">
          <div class="signals-table-wrap" :class="{ 'has-detail': detailOpen }">
            <div class="signals-table-main">
              <div class="m-tbl-scroll signals-tbl-scroll">
                <table class="tbl signals-tbl" :class="{ 'tbl-squeezed': detailOpen }">
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
        </template>

        <!-- Surface bubble chart -->
        <template v-else-if="displayMode === 'surface'">
          <div class="signals-table-wrap" :class="{ 'has-detail': detailOpen }">
            <div class="signals-visual-main">
              <SignalSurfaceChart
                :points="surfacePoints"
                :missing-fields="surfaceMissingFields"
                :enrichment-note="surfaceEnrichmentNote"
                :selected-key="selectedSurfaceKey"
                @select="openDetail"
              />
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
        </template>

        <!-- Ranked cards -->
        <template v-else>
          <div class="signals-table-wrap" :class="{ 'has-detail': detailOpen }">
            <div class="signals-visual-main">
              <SignalRankedCards
                :points="surfacePoints"
                :missing-fields="rankedMissingFields"
                :selected-key="selectedSurfaceKey"
                @select="openDetail"
              />
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
        </template>

        <div v-if="filterActive && filteredSignals.length === 0" class="signals-note">
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

    <!-- Combined Performance / Strategy Health -->
    <div v-else-if="viewMode === 'performance' && (useStrategyHealthTable || performanceData)" class="scroll">
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="AVG FWD WR"
          :value="`${perfAvgFwd}%`"
          delta="forward testing"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          label="AVG BT WR"
          :value="`${perfAvgBt}%`"
          delta="backtested"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="TOTAL TRADES"
          :value="String(perfTotalTrades)"
          :delta="reportDateLabel"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="DEGRADING"
          :value="String(perfDegradingCount)"
          delta="FWD &gt;10pp below BT"
          accent="r"
          delta-class="r"
        />
      </div>

      <div v-if="useStrategyHealthTable" class="card" style="margin-bottom:12px">
        <div class="ct">Strategy Health</div>
        <div class="cm">STRATEGY · INTERVAL · FWD WR · BT WR · Δ VS BT · TRADES · GATE A2b · STATUS</div>
        <div class="signals-note perf-disclosure">
          BT WR is computed across the full historical period for combos meeting the 70% minimum platform inclusion threshold.
          Forward-test WR is the out-of-sample measure and the basis for Gate A2b.
        </div>
        <div class="m-tbl-scroll">
          <table class="tbl">
            <thead>
              <tr>
                <th>Strategy</th><th>Interval</th>
                <th>FWD WR</th><th>BT WR</th><th>Gap</th><th>Trades</th><th>Gate A2b</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in strategyHealthRows"
                :key="`${row.strategy}-${row.interval}`"
                :class="{ 'row-fwd-degraded': healthDegraded(row) }"
              >
                <td>
                  <div class="tkr-cell">
                    <span class="fwd-deg-slot" aria-hidden="true">
                      <span v-if="healthDegraded(row)" class="fwd-deg-line" title="FWD degrading" />
                    </span>
                    <div class="tkr">{{ row.strategy }}</div>
                  </div>
                </td>
                <td class="tfn">{{ row.interval }}</td>
                <td class="wr" :class="wrClass(row.fwd_wr)">{{ row.fwd_wr.toFixed(1) }}%</td>
                <td class="wr hi">{{ row.bt_wr.toFixed(1) }}%</td>
                <td class="tfn" :style="{ color: healthGapColor(row) }">{{ healthGap(row) }}</td>
                <td class="tfn">{{ row.trades }}</td>
                <td class="tfn" :class="gateClass(row.gate_a2b)">{{ row.gate_a2b }}</td>
                <td class="tfn" :style="{ color: healthStatusColor(row) }">
                  {{ healthStatusLabel(row) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="performanceData" class="card" style="margin-bottom:12px">
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
                <td class="tfn" style="color:var(--t3)">
                  {{ perfStatusLabel(row) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="performanceData?.latest_performance?.length" class="card">
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
import type { CombinedPerformanceReportRow, StrategyHealthRow } from '~/types/api'
import SignalDetailPanel from '~/components/signals/SignalDetailPanel.vue'
import SignalRankedCards from '~/components/signals/SignalRankedCards.vue'
import SignalSurfaceChart from '~/components/signals/SignalSurfaceChart.vue'
import SignalsDisplayModeSelect from '~/components/signals/SignalsDisplayModeSelect.vue'
import { useSignalDisplayMode } from '~/composables/useSignalDisplayMode'
import {
  activeFilterLabels,
  buildSignalsSummary,
  filterSignals,
  matchesShortlistRow,
} from '~/utils/signal-filters'
import { signalKey } from '~/utils/signal-detail'
import {
  buildSurfacePoints,
  mergeSignalsWithSurfaceRecords,
  collectMissingSurfaceFields,
  RANKED_PREFERRED_FIELDS,
  SURFACE_REQUIRED_FIELDS,
} from '~/utils/signal-surface'
import { mergeSignalsWithDegradationCheck } from '~/utils/signal-degradation'
import { mapSignalRow, winRateClass } from '~/utils/signals'

definePageMeta({ layout: 'terminal' })

type SignalViewMode = 'signals' | 'all-signal' | 'breadth' | 'horizontal' | 'performance'

const isMobile = useIsMobile()
const { displayMode } = useSignalDisplayMode()

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
  fetchSignalSurface,
  fetchStrategyHealth,
  fetchCheckDegradation,
} = useApi()

const outstanding = fetchSignalsOutstanding()
const newSignals = fetchSignalsNew()
const shortlist = fetchShortlist()
const allSignals = fetchAllSignals()
const breadth = fetchBreadth()
const horizontal = fetchHorizontalNewHigh()
const combinedPerformance = fetchCombinedPerformanceReport()
const strategyHealth = fetchStrategyHealth()
const checkDegradation = fetchCheckDegradation()

const viewMode = computed((): SignalViewMode => {
  const nav = navActiveId.value
  if (nav === 'report') return 'all-signal'
  if (nav === 'sbi') return 'breadth'
  if (nav === 'high') return 'horizontal'
  if (nav === 'perf') return 'performance'
  return 'signals'
})

const surfaceReport = computed(() => {
  if (viewMode.value === 'all-signal') return 'all-signal'
  if (navActiveId.value === 'new') return 'new-signals'
  return 'outstanding-signals'
})

const surfaceApi = fetchSignalSurface(surfaceReport)

/** Surface enrichment: shortlist uses Claude report rows; otherwise /signals/surface */
const surfaceRecords = computed(() => {
  if (navActiveId.value === 'shortlist') {
    const rows = shortlist.data.value?.rows
    if (rows?.length) return rows as import('~/types/api').SignalSurfaceRecord[]
  }
  return surfaceApi.data.value?.records ?? null
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
    const rows = sl.rows ?? []
    const sigs =
      sl.signals?.length
        ? sl.signals
        : outstanding.data.value?.signals.filter((s) => matchesShortlistRow(s, rows)) ?? []
    return {
      meta: sl.meta,
      summary: buildSignalsSummary(sigs, sl.count),
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
const strategyHealthData = computed(() => strategyHealth.data.value)
const strategyHealthRows = computed(() => strategyHealthData.value?.strategy_health ?? [])
const useStrategyHealthTable = computed(() => strategyHealthRows.value.length > 0)

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

const shortlistCount = computed(() => shortlist.data.value?.count ?? 0)

const shortlistDateLabel = computed(() => {
  const date = shortlist.data.value?.meta?.data_updated_at?.date
  return date ? `as of ${date}` : 'live'
})

const reportDateLabel = computed(() => {
  const meta =
    listData.value?.meta ??
    breadthData.value?.meta ??
    horizontalData.value?.meta ??
    performanceData.value?.meta
  const date =
    strategyHealthData.value?.report_date ??
    horizontalData.value?.report_date ??
    performanceData.value?.report_date ??
    meta?.data_updated_at?.date
  return date ? `as of ${date}` : 'live'
})

const pending = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') {
    return allSignals.pending.value || surfaceApi.pending.value
  }
  if (nav === 'breadth') return breadth.pending.value
  if (nav === 'horizontal') return horizontal.pending.value
  if (nav === 'performance') {
    return strategyHealth.pending.value || combinedPerformance.pending.value
  }
  if (navActiveId.value === 'shortlist') {
    return shortlist.pending.value
  }
  if (nav === 'signals') {
    return activeSource.value.pending.value || surfaceApi.pending.value
  }
  return activeSource.value.pending.value
})

const error = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') return allSignals.error.value || surfaceApi.error.value
  if (nav === 'breadth') return breadth.error.value
  if (nav === 'horizontal') return horizontal.error.value
  if (nav === 'performance') {
    return strategyHealth.error.value || combinedPerformance.error.value
  }
  if (navActiveId.value === 'shortlist') {
    return shortlist.error.value
  }
  if (nav === 'signals') {
    return activeSource.value.error.value || surfaceApi.error.value
  }
  return activeSource.value.error.value
})

const isEmpty = computed(() => {
  const nav = viewMode.value
  if (nav === 'all-signal') {
    const signalCount = allSignals.data.value?.signals?.length ?? 0
    const surfaceCount = surfaceApi.data.value?.records?.length ?? 0
    return signalCount === 0 && surfaceCount === 0
  }
  if (nav === 'breadth') return !breadthData.value?.rows?.length
  if (nav === 'horizontal') return !horizontalData.value?.rows?.length
  if (nav === 'performance') {
    return (
      !strategyHealthRows.value.length &&
      !performanceData.value?.forward_testing?.length &&
      !performanceData.value?.latest_performance?.length
    )
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
  strategyHealth.refresh()
  checkDegradation.refresh()
  surfaceApi.refresh()
}

const tableTitle = computed(() => {
  if (viewMode.value === 'all-signal') return 'All Signal Report'
  if (navActiveId.value === 'new') return 'New Signals'
  if (navActiveId.value === 'shortlist') return 'Claude Shortlisted'
  return 'Outstanding Signals'
})

const contentTitle = computed(() => {
  if (displayMode.value === 'surface') return `${tableTitle.value} · Surface`
  if (displayMode.value === 'ranked-cards') return `${tableTitle.value} · Ranked Cards`
  return tableTitle.value
})

const displaySignals = computed(() => {
  const withSurface = mergeSignalsWithSurfaceRecords(
    filteredSignals.value,
    surfaceRecords.value,
  )
  return mergeSignalsWithDegradationCheck(withSurface, checkDegradation.data.value)
})

const surfacePoints = computed(() =>
  buildSurfacePoints(displaySignals.value, surfaceRecords.value),
)

const surfaceEnrichmentNote = computed(() => {
  const recs = surfaceApi.data.value?.records ?? []
  if (!recs.length || surfaceReport.value !== 'all-signal') return null
  const withComposite = recs.filter((r) => r.composite_score != null).length
  if (withComposite > 0) return null
  const total = filteredSignals.value.length || recs.length
  return `The /signals/surface endpoint returned ${recs.length} rows for all-signal, but composite_score is null on every row (outstanding-signals has it). The bubble chart needs composite_score and window_remaining_pct per row. Use Tables or Ranked Cards to view all ${total} signals until backend enriches the all-signal report.`
})

const surfaceMissingFields = computed(() => {
  if (surfaceEnrichmentNote.value) return []
  if (surfaceRecords.value?.length) {
    const found = collectMissingSurfaceFields(surfacePoints.value)
    return SURFACE_REQUIRED_FIELDS.filter((f) => found.includes(f))
  }
  return [...SURFACE_REQUIRED_FIELDS]
})

const rankedMissingFields = computed(() => {
  const found = collectMissingSurfaceFields(surfacePoints.value)
  return RANKED_PREFERRED_FIELDS.filter((f) => found.includes(f))
})

const tableRows = computed(() => displaySignals.value.map(mapSignalRow))
const selectedSurfaceKey = computed(() => {
  const sig = selectedSignal.value
  return sig ? signalKey(sig) : null
})

const selectedIndex = ref<number | null>(null)
const detailOpen = computed(() => selectedIndex.value !== null)

const selectedSignal = computed(() => {
  const idx = selectedIndex.value
  if (idx == null || idx < 0) return null
  return displaySignals.value[idx] ?? null
})

function openDetail(index: number) {
  if (index >= 0 && index < displaySignals.value.length) {
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
  if (idx != null && idx < displaySignals.value.length - 1) {
    selectedIndex.value = idx + 1
  }
}

watch([viewMode, navActiveId, displayMode], () => {
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

function perfDegraded(_row: CombinedPerformanceReportRow) {
  return false
}

function perfStatusLabel(_row: CombinedPerformanceReportRow) {
  return '—'
}

const perfAvgFwd = computed(() => {
  const rows = strategyHealthRows.value
  if (rows.length) {
    return Math.round((rows.reduce((a, r) => a + r.fwd_wr, 0) / rows.length) * 10) / 10
  }
  return performanceData.value?.aggregates?.avg_forward_wr ?? 0
})

const perfAvgBt = computed(() => {
  const rows = strategyHealthRows.value
  if (rows.length) {
    return Math.round((rows.reduce((a, r) => a + r.bt_wr, 0) / rows.length) * 10) / 10
  }
  return performanceData.value?.aggregates?.avg_backtest_wr ?? 0
})

const perfTotalTrades = computed(() => {
  const rows = strategyHealthRows.value
  if (rows.length) return rows.reduce((a, r) => a + r.trades, 0)
  return performanceData.value?.aggregates?.total_trades ?? 0
})

const perfDegradingCount = computed(() => {
  const rows = strategyHealthRows.value
  if (rows.length) return rows.filter((r) => healthDegraded(r)).length
  return performanceData.value?.aggregates?.degrading_count ?? 0
})

function healthDegraded(row: StrategyHealthRow) {
  const status = row.status?.toLowerCase().trim()
  if (!status) return false
  return status !== 'healthy' && status !== 'ok' && status !== 'active'
}

function healthStatusLabel(row: StrategyHealthRow) {
  const status = row.status?.trim()
  if (!status) return '—'
  if (status.toLowerCase() === 'healthy') return '✓ healthy'
  return status
}

function healthStatusColor(row: StrategyHealthRow) {
  const status = row.status?.toLowerCase().trim()
  if (!status) return 'var(--t3)'
  if (healthDegraded(row)) return 'var(--gold)'
  if (status === 'healthy' || status === 'ok' || status === 'active') return 'var(--green)'
  return 'var(--t3)'
}

function healthGap(row: StrategyHealthRow) {
  const gap = Math.round(row.delta_vs_bt * 10) / 10
  return `${gap >= 0 ? '+' : ''}${gap}pp`
}

function healthGapColor(row: StrategyHealthRow) {
  if (row.delta_vs_bt < -10) return 'var(--red)'
  if (row.delta_vs_bt < 0) return 'var(--gold)'
  return 'var(--green)'
}

function gateClass(gate: string) {
  if (gate.startsWith('PASS')) return 'gate-pass'
  return 'gate-fail'
}
</script>

<style scoped>
.signals-mobile-display-mode {
  margin-bottom: 12px;
  padding: 0 2px;
}
.signals-visual-main {
  min-width: 0;
  overflow: hidden;
  padding: 4px 2px 0;
}
.signals-table-wrap.has-detail .signals-visual-main {
  padding-right: 0;
}
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
.signals-tbl-scroll {
  max-height: min(calc(100vh - 260px), 580px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.signals-tbl {
  border-collapse: separate;
  border-spacing: 0;
}
.signals-tbl:not(.tbl-squeezed) {
  width: max-content;
  min-width: 100%;
}
.signals-tbl thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--s2);
  box-shadow: 0 1px 0 var(--b1);
}
.signals-tbl th:first-child,
.signals-tbl td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 72px;
  max-width: 108px;
  border-right: 1px solid var(--b1);
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.35);
}
.signals-tbl thead th:first-child {
  z-index: 3;
}
.signals-tbl tbody td:first-child {
  background: var(--s1);
}
.signals-tbl tbody tr:hover td:first-child {
  background: #0c0c0c;
}
.signals-tbl tbody tr.row-selected td:first-child {
  background: rgba(201, 168, 76, 0.06);
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
.signals-table-wrap.has-detail .m-tbl-scroll,
.signals-table-wrap.has-detail .signals-tbl-scroll {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  max-height: min(calc(100vh - 260px), 580px);
  overflow: auto;
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
.perf-disclosure {
  margin: 8px 10px 10px;
  padding: 8px 10px;
  border: 1px solid rgba(186, 117, 23, 0.35);
  background: rgba(186, 117, 23, 0.08);
  border-radius: 4px;
  line-height: 1.45;
}
.gate-pass { color: var(--green); }
.gate-fail { color: var(--red); }
</style>
