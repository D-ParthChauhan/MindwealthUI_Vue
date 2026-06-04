<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data"
    label="overwatch"
    @retry="refresh"
  >
    <div v-if="data" class="main">
      <div class="kr k4">
        <KpiCard
          label="BACKTEST WR"
          :value="`${data.kpis?.backtest_wr ?? 0}%`"
          delta="trained period"
          accent="g"
          delta-class="g"
        />
        <KpiCard
          label="FORWARD TEST WR"
          :value="`${data.kpis?.forward_wr ?? 0}%`"
          delta="last 6m · above 60% threshold"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          label="FORCED PORTFOLIO"
          :value="`+${data.kpis?.forced_portfolio_ytd ?? 0}%`"
          delta="YTD · live"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="DEGRADATION ALERTS"
          :value="String(data.count)"
          :delta="data.message"
          accent="r"
          delta-class="r"
        />
      </div>
      <div class="ow-grid">
        <div class="ow-col">
          <div class="section-label">LAYER 1 · FUNCTION HEALTH</div>
          <div
            v-for="fn in data.function_health ?? []"
            :key="fn.name"
            class="health-card"
            :class="fn.status === 'healthy' ? 'healthy' : 'degrading'"
          >
            <div class="health-head">
              <span :class="{ gold: fn.status === 'degrading' }">{{ fn.name }}</span>
              <span class="badge" :class="fn.status === 'healthy' ? 'healthy-badge' : 'warn-badge'">
                {{ fn.status === 'healthy' ? 'HEALTHY' : 'DEGRADING' }}
              </span>
            </div>
            <div class="health-stats">
              <div><div class="health-v green">{{ fn.bt_wr }}%</div><div class="health-l">BT WR</div></div>
              <div>
                <div class="health-v" :class="fn.status === 'degrading' ? 'gold' : 'green'">{{ fn.fwd_wr }}%</div>
                <div class="health-l">FWD WR</div>
              </div>
              <div><div class="health-v">{{ fn.trades }}</div><div class="health-l">TRADES</div></div>
            </div>
            <div v-if="fn.note" class="health-note">{{ fn.note }}</div>
          </div>
          <div class="live-card">
            <div class="live-label">LIVE PORTFOLIO · FORCED MODEL (AHIL)</div>
            <div class="live-row"><span>YTD Return</span><span class="green">+{{ data.kpis?.forced_portfolio_ytd ?? 0 }}%</span></div>
            <div class="live-row"><span>Active alerts</span><span class="gold">{{ data.count }}</span></div>
          </div>
        </div>
        <div class="ow-col scroll-col">
          <div class="section-label teal">LAYER 2 · SYSTEM HEALTH</div>
          <div v-for="log in data.system_logs ?? []" :key="log.id" class="log-row" :class="log.type">
            <div class="log-dot" :class="logDotClass(log)" />
            <div>
              <div class="log-text">{{ log.text }}</div>
              <div class="log-time">{{ log.time }}</div>
            </div>
            <div class="log-tag">{{ log.tag }}</div>
          </div>
          <div class="claude-explainer">
            <div class="explainer-title">💬 AI ANALYST — WHY IT APPEARED ON THIS PAGE</div>
            <div class="explainer-body">
              1. Nightly agent wrote: <span class="gold">alerts.json</span> with degradation alert, type="degradation", target_page="overwatch"<br>
              2. Vue fetched alerts on page load (once per visit)<br>
              3. User navigated to Overwatch → Claude panel <span class="gold">auto-opened after 1.5s delay</span><br>
              4. If user had been on Dashboard → only a <span class="red">red badge dot</span> on 💬 button, panel does NOT auto-open<br>
              5. Dismissed once → never auto-opens same alert again this session
            </div>
          </div>
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
import type { OverwatchResponse } from '~/types/api'

definePageMeta({ layout: 'terminal' })

const { fetchOverwatch } = useApi()
const { data, pending, error, refresh } = fetchOverwatch()

function logDotClass(log: NonNullable<OverwatchResponse['system_logs']>[number]) {
  if (log.type === 'delay') return 'gold-pulse'
  if (log.type === 'warn') return 'gold-pulse'
  return 'green'
}
</script>

<style scoped>
.ow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.ow-col { display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
.scroll-col { overflow-y: auto; }
.section-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 2px;
  color: var(--t3);
}
.section-label.teal { color: var(--teal); }
.health-card {
  border-radius: 6px;
  padding: 10px 13px;
}
.health-card.healthy {
  background: var(--s2);
  border: 1px solid rgba(39, 174, 96, 0.2);
}
.health-card.degrading {
  background: rgba(201, 168, 76, 0.04);
  border: 1px solid rgba(201, 168, 76, 0.25);
}
.health-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t2);
}
.badge {
  font-size: 9.5px;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
}
.healthy-badge {
  color: var(--green);
  background: rgba(39, 174, 96, 0.1);
  border: 1px solid rgba(39, 174, 96, 0.2);
}
.warn-badge {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
}
.health-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  text-align: center;
}
.health-v {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  color: #fff;
}
.health-v.green { color: var(--green); }
.health-v.gold { color: var(--gold); }
.health-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--t3);
}
.health-note {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-top: 7px;
  border-top: 1px solid var(--b1);
  padding-top: 6px;
}
.live-card {
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 5px;
  padding: 9px 11px;
}
.live-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-bottom: 6px;
}
.live-row {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t2);
  margin-top: 4px;
}
.log-row {
  display: flex;
  gap: 8px;
  padding: 8px 11px;
  border-radius: 5px;
  align-items: flex-start;
  background: var(--s2);
  border: 1px solid rgba(39, 174, 96, 0.18);
}
.log-row.delay {
  background: rgba(201, 168, 76, 0.03);
  border-color: rgba(201, 168, 76, 0.2);
}
.log-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}
.log-dot.green { background: var(--green); }
.log-dot.gold-pulse {
  background: var(--gold);
  animation: pu 1.5s infinite;
}
.log-text {
  font-size: 11px;
  color: var(--t2);
  font-family: 'JetBrains Mono', monospace;
}
.log-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-top: 2px;
}
.log-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  color: var(--t3);
  background: var(--s3);
  padding: 2px 5px;
  border-radius: 3px;
  margin-left: auto;
  flex-shrink: 0;
}
.claude-explainer {
  background: rgba(201, 168, 76, 0.05);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 6px;
  padding: 12px 14px;
  margin-top: 4px;
}
.explainer-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 1.5px;
  color: var(--gold);
  margin-bottom: 8px;
}
.explainer-body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t2);
  line-height: 1.7;
}
.gold { color: var(--gold); }
.green { color: var(--green); }
.red { color: var(--red); }
</style>
