<template>
  <DataState
    :pending="pending"
    :error="error"
    :empty="!data?.layers"
    label="sentiment"
    @retry="refresh"
  >
    <div v-if="data?.layers" class="main">
      <div class="kr k4">
        <KpiCard
          label="SSI COMPOSITE SCORE"
          :value="data.composite.score"
          :delta="data.composite.label"
          accent="p"
          delta-class="t"
        />
        <KpiCard
          label="LAYER 1 · WEEKLY"
          :value="formatLayerScore(data.layers.weekly.score)"
          :delta="data.layers.weekly.label"
          accent="gold"
          delta-class="gold"
        />
        <KpiCard
          label="LAYER 2 · DAILY"
          :value="formatLayerScore(data.layers.daily.score)"
          :delta="data.layers.daily.label"
          accent="b"
          delta-class="b"
        />
        <KpiCard
          label="LAYER 3 · POSITIONING"
          :value="formatLayerScore(data.layers.positioning.score)"
          :delta="data.layers.positioning.label"
          accent="t"
          delta-class="t"
        />
      </div>
      <div class="ssi-grid">
        <div class="card layer-scroll">
          <div class="ct purple">Layer 1 · Weekly Pulse · 40%</div>
          <div class="cm">If data unavailable → weight redistributed to available signals</div>
          <div class="signal-stack">
            <div v-for="s in data.layers.weekly.items" :key="s.label" class="signal-box">
              <div class="signal-label">{{ s.label }}</div>
              <div class="signal-val" :style="{ color: s.color }">{{ s.value }}</div>
              <div v-if="s.sub" class="signal-sub">{{ s.sub }}</div>
            </div>
          </div>
        </div>
        <div class="card layer-scroll">
          <div class="ct blue">Layer 2 · Daily Timing · 35%</div>
          <div class="cm">≥2 OF 6 MUST CONFIRM FOR LONG OR SHORT</div>
          <div class="signal-stack tight">
            <div
              v-for="s in data.layers.daily.items"
              :key="s.label"
              class="timing-row"
              :class="{ highlight: s.highlight }"
            >
              <div class="signal-label">{{ s.label }}</div>
              <div class="timing-val" :style="{ color: s.color }">{{ s.value }}</div>
            </div>
          </div>
        </div>
        <div class="card layer-scroll">
          <div class="ct gold-text">Layer 3 · Positioning · 25%</div>
          <div class="cm">COT REAL MONEY vs FAST MONEY (TFF REPORT)</div>
          <div class="signal-stack">
            <div v-for="s in data.layers.positioning.items" :key="s.label" class="signal-box">
              <div class="signal-label">{{ s.label }}</div>
              <div class="signal-val" :style="{ color: s.color }">{{ s.value }}</div>
              <div v-if="s.sub" class="signal-sub">{{ s.sub }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DataState>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'terminal' })

const { fetchSentiment } = useApi()
const { data, pending, error, refresh } = fetchSentiment()

function formatLayerScore(score: number) {
  const sign = score >= 0 ? '+' : ''
  return `${sign}${score.toFixed(1)}`
}
</script>

<style scoped>
.purple { color: var(--purple); }
.blue { color: var(--blue); }
.gold-text { color: var(--gold); }
.ssi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 11px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.layer-scroll { overflow-y: auto; }
.signal-stack { display: flex; flex-direction: column; gap: 7px; }
.signal-stack.tight { gap: 6px; }
.signal-box {
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 5px;
  padding: 8px 11px;
}
.signal-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-bottom: 3px;
}
.signal-val {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
}
.signal-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
  margin-top: 2px;
}
.timing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 4px;
  padding: 7px 10px;
}
.timing-row.highlight {
  background: rgba(201, 168, 76, 0.05);
  border-color: rgba(201, 168, 76, 0.2);
}
.timing-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}
</style>
