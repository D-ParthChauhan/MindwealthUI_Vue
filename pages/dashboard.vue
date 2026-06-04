<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="dashboard"
    @retry="refresh"
  >
    <div v-if="data" class="main">
      <div class="kr k4">
        <KpiCard
          label="AVG WIN RATE"
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
          label="OVERWATCH ALERTS"
          :value="String(data.kpis.overwatch_count)"
          :delta="data.kpis.overwatch_message"
          accent="r"
          delta-class="r"
        />
      </div>
      <div class="dash-grid">
        <div class="card dash-chart">
          <div class="ct">Win Rate Trend — All Functions</div>
          <div class="cm">FRACTAL TRACK · TRENDPULSE · DELTADRIFT · SIGMASHELL · BAND MATRIX</div>
          <div class="chart-wrap">
            <WinRateChart :chart="data.win_rate_chart" />
          </div>
        </div>
        <div class="dash-side">
          <div class="card">
            <div class="ct">Top Active Signals</div>
            <div class="cm" style="margin-bottom:9px">FUNCTION · INTERVAL · DIRECTION · WIN RATE · SENTIMENT SCORE</div>
            <table class="tbl">
              <thead>
                <tr><th>Ticker</th><th>Function · Interval</th><th>Dir</th><th>BT WR</th><th>Sentiment</th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="sig in topSignals"
                  :key="sig.ticker"
                  :style="sig.dimmed ? { opacity: 0.45 } : undefined"
                >
                  <td><div class="tkr">{{ sig.ticker }}</div></td>
                  <td style="font-size:9.5px">{{ sig.functionInterval }}</td>
                  <td><DirectionBadge :direction="sig.direction" /></td>
                  <td class="wr" :class="sig.wrClass">{{ sig.wr }}</td>
                  <td><span class="ctag" :class="sig.tagClass">{{ sig.tag }}</span></td>
                </tr>
              </tbody>
            </table>
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
  overflow: hidden;
}
.dash-chart { display: flex; flex-direction: column; }
.chart-wrap { flex: 1; min-height: 0; }
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
</style>
