<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!listData"
    label="signals"
    @retry="refresh"
  >
    <div v-if="listData" class="scroll">
      <div class="kr k4" style="margin-bottom:16px">
        <KpiCard
          label="LONG"
          :value="String(listData.summary.long)"
          :delta="`${listData.summary.long_pct}%`"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="SHORT"
          :value="String(listData.summary.short)"
          :delta="listData.summary.short_note"
          accent="r"
          delta-class="r"
        />
        <KpiCard
          label="NEW TODAY"
          :value="String(listData.summary.new_long + listData.summary.new_short)"
          :delta="`${listData.summary.new_long}L\n${listData.summary.new_short}S`"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="SHORTLISTED"
          :value="String(listData.summary.shortlisted ?? 0)"
          delta="cross-confirmed"
          accent="b"
          delta-class="b"
        />
      </div>
      <div class="card">
        <div class="ct">{{ tableTitle }}</div>
        <div class="cm">FUNCTION · INTERVAL · DIRECTION · BT WIN RATE · FWD WIN RATE · SENTIMENT SCORE · STATUS</div>
        <table class="tbl">
          <thead>
            <tr>
              <th>Ticker</th><th>Function</th><th>Interval</th><th>Dir</th>
              <th>BT WR</th><th>FWD WR</th><th>Signal Date</th><th>Sentiment Score</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tableRows"
              :key="`${row.ticker}-${row.function}-${row.date}`"
              :style="row.dimmed ? { opacity: 0.45 } : undefined"
            >
              <td><div class="tkr">{{ row.ticker }}</div></td>
              <td style="font-size:9.5px">{{ row.function }}</td>
              <td class="tfn">{{ row.interval }}</td>
              <td><DirectionBadge :direction="row.direction" /></td>
              <td class="wr" :class="row.btClass">{{ row.btWr }}</td>
              <td class="wr" :class="row.fwdClass">{{ row.fwdWr }}</td>
              <td class="tfn">{{ row.date }}</td>
              <td><span class="ctag" :class="row.tagClass">{{ row.tag }}</span></td>
              <td class="tfn" :style="{ color: row.statusColor }">{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="hasDegraded" class="signals-note">
          Note: degraded signals are shown dimmed when forward test win rate trails backtest by more than 10pp but may still be above the 60% minimum threshold.
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
import { mapSignalRow } from '~/utils/signals'

definePageMeta({ layout: 'terminal' })

const navActiveId = useState<string>('terminal-nav-id', () => 'outstanding')
const { fetchSignalsOutstanding, fetchSignalsNew, fetchShortlist } = useApi()

const outstanding = fetchSignalsOutstanding()
const newSignals = fetchSignalsNew()
const shortlist = fetchShortlist()

const activeSource = computed(() => {
  const nav = navActiveId.value
  if (nav === 'new') return newSignals
  if (nav === 'shortlist') return shortlist
  return outstanding
})

const listData = computed(() => {
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

const pending = computed(() => {
  if (navActiveId.value === 'shortlist') {
    return outstanding.pending.value || shortlist.pending.value
  }
  return activeSource.value.pending.value
})

const error = computed(() => {
  if (navActiveId.value === 'shortlist') {
    return outstanding.error.value || shortlist.error.value
  }
  return activeSource.value.error.value
})

function refresh() {
  outstanding.refresh()
  newSignals.refresh()
  shortlist.refresh()
}

const tableTitle = computed(() => {
  if (navActiveId.value === 'new') return 'New Signals'
  if (navActiveId.value === 'shortlist') return 'Claude Shortlisted'
  return 'Outstanding Signals'
})

const tableRows = computed(() => (listData.value?.signals ?? []).map(mapSignalRow))

const hasDegraded = computed(() => tableRows.value.some((r) => r.dimmed))
</script>

<style scoped>
.signals-note {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  padding: 10px 10px 2px;
  border-top: 1px solid var(--b1);
  margin-top: 8px;
}
</style>
