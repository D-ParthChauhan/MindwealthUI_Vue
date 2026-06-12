<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="dashboard"
    @retry="refresh"
  >
    <div v-if="data" class="main">
      <div class="kr" :class="showOverwatchKpi ? 'k4' : 'k3'">
        <KpiCard
          label="Avg Fwd win rate"
          :value="data.kpis.avg_win_rate_display"
          :delta="data.kpis.win_rate_mom_display"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="OUTSTANDING SIGNALS"
          :value="String(data.kpis.outstanding_count)"
          :delta="`${data.kpis.new_today} new today`"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="SENTIMENT SCORE (SSI)"
          :value="data.kpis.sentiment_score"
          :delta="data.kpis.sentiment_label"
          accent="t"
          delta-class="t"
        />
        <KpiCard
          v-if="showOverwatchKpi"
          label="OVERWATCH ALERTS"
          :value="String(data.kpis.overwatch_count)"
          :delta="data.kpis.overwatch_message"
          accent="r"
          delta-class="r"
        />
      </div>
      <div class="dash-grid">
        <div class="card dash-chart">
          <div class="ct">
            Win Rate Trend{{ data.win_rate_chart?.properties.metric ? ` — ${data.win_rate_chart.properties.metric}` : '' }}
          </div>
          <div class="m-chart-scroll">
            <div class="chart-wrap">
              <WinRateChart :chart="data.win_rate_chart" />
            </div>
          </div>
        </div>
        <div class="dash-side">
          <div class="card">
            <div class="ct">Top Active Signals</div>
            <div class="m-tbl-scroll">
            <table class="tbl dash-signals-tbl">
              <thead>
                <tr><th>Ticker</th><th>Function · Interval</th><th>Dir</th><th>BT WR</th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sig, i) in topSignals"
                  :key="`${sig.ticker}-${sig.functionInterval}-${i}`"
                  :class="{ 'row-degraded': sig.dimmed }"
                >
                  <td><div class="tkr">{{ sig.ticker }}</div></td>
                  <td class="fn-cell">{{ sig.functionInterval }}</td>
                  <td><DirectionBadge :direction="sig.direction" /></td>
                  <td class="wr" :class="sig.wrClass">{{ sig.wr }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
          <div class="card ai-card">
            <div class="ai-card-head">
              <div class="ai-label">⚡ AI ANALYST · ON DEMAND</div>
              <div class="tavily-badge">+ Tavily web</div>
            </div>
            <div class="ai-brief">{{ data.analyst_snippet }}</div>
          </div>
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
import { mapTopSignalRow } from '~/utils/signals'

definePageMeta({ layout: 'terminal' })

/** Set true to restore the Overwatch Alerts KPI card */
const showOverwatchKpi = false

const { fetchDashboard } = useApi()
const { data, pending, error, refresh } = fetchDashboard()

const topSignals = computed(() =>
  (data.value?.top_signals ?? []).map((s) =>
    mapTopSignalRow(s, data.value?.degraded_strategy),
  ),
)

</script>

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.dash-chart { display: flex; flex-direction: column; min-width: 0; }
.chart-wrap { flex: 1; min-height: 392px; min-width: 0; }
.dash-side { display: flex; flex-direction: column; gap: 11px; }
.ai-card { background: rgba(201, 168, 76, 0.03); border-color: rgba(201, 168, 76, 0.18); }
.ai-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.ai-label { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 1.5px; color: var(--gold); }
.tavily-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--blue);
  background: rgba(52, 152, 219, 0.08);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(52, 152, 219, 0.15);
}
.ai-brief {
  font-size: 11px;
  color: #9a7a38;
  line-height: 1.65;
  border-left: 2px solid rgba(201, 168, 76, 0.25);
  padding-left: 9px;
  font-family: 'JetBrains Mono', monospace;
}
.dash-signals-tbl td {
  color: var(--t1);
}
.dash-signals-tbl .fn-cell {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: #e2e6ec;
  letter-spacing: 0.2px;
}
.dash-signals-tbl .tkr {
  color: #fff;
}
.dash-signals-tbl .wr.hi { color: #3ddc84; }
.dash-signals-tbl .wr.mid { color: #e8c45a; }
.dash-signals-tbl .wr.lo { color: #f06a5a; }
.dash-signals-tbl tr.row-degraded td:first-child {
  box-shadow: inset 2px 0 0 rgba(201, 168, 76, 0.45);
}
</style>
