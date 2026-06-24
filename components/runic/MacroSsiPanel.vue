<template>
  <div v-if="ssi" class="runic-card" style="margin-bottom:12px">
    <div class="runic-card-hd">
      <div class="runic-card-title">SSI · {{ ssi.date }}</div>
      <span class="runic-badge" :class="postureClass">{{ ssi.posture }}</span>
    </div>
    <div style="padding:10px 14px">
      <div class="ssi-kv-row">
        <div class="ssi-kv">
          <div class="ssi-kv-l">Level</div>
          <div class="ssi-kv-v">{{ ssi.ssi_level.toFixed(4) }}</div>
        </div>
        <div class="ssi-kv">
          <div class="ssi-kv-l">Multiplier</div>
          <div class="ssi-kv-v" :class="multClass">{{ ssi.ssi_multiplier.toFixed(2) }}×</div>
        </div>
        <div v-if="ssi.ssi_percentile_5y != null" class="ssi-kv">
          <div class="ssi-kv-l">5Y Pctile</div>
          <div class="ssi-kv-v">{{ ssi.ssi_percentile_5y.toFixed(1) }}%</div>
        </div>
        <div class="ssi-kv">
          <div class="ssi-kv-l">Layer 2</div>
          <div class="ssi-kv-v">{{ ssi.layer2_status }} · {{ ssi.layer2_confirmed_count }}/{{ ssi.layer2_required }}</div>
        </div>
      </div>
      <div v-if="inputRows.length" class="ssi-inputs">
        <div v-for="row in inputRows" :key="row.key" class="ssi-input-row">
          <span class="ssi-input-key">{{ row.label }}</span>
          <span class="ssi-input-val">{{ row.raw }}</span>
          <span v-if="row.signal" class="runic-badge b-watch">{{ row.signal }}</span>
          <span class="ssi-input-vote" :class="row.vote ? 'ok' : 'off'">{{ row.vote ? '✓' : '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isApiUnavailable } from '~/utils/api-display'

const { ssiSummary } = useRunicMacro()

const SSI_LABELS: Record<string, string> = {
  hyg_lqd: 'HYG/LQD',
  dbmf_beta: 'DBMF β',
  cnn_fg: 'CNN F&G',
  vix_ratio: 'VIX ratio',
}

const ssi = computed(() =>
  ssiSummary.value && !isApiUnavailable(ssiSummary.value) ? ssiSummary.value : null,
)

const postureClass = computed(() => {
  const p = ssi.value?.posture?.toUpperCase() ?? ''
  if (p.includes('RISK_ON')) return 'b-ok'
  if (p.includes('RISK_OFF')) return 'b-bear'
  return 'b-watch'
})

const multClass = computed(() => {
  const m = ssi.value?.ssi_multiplier ?? 1
  if (m > 1) return 'ok'
  if (m < 1) return 'warn'
  return ''
})

const inputRows = computed(() => {
  if (!ssi.value?.inputs) return []
  return Object.entries(ssi.value.inputs).map(([key, input]) => ({
    key,
    label: SSI_LABELS[key] ?? key.toUpperCase(),
    raw: Number.isFinite(input.raw) ? input.raw.toFixed(3) : '—',
    signal: input.signal?.replace(/_/g, ' ') ?? '',
    vote: input.vote,
  }))
})
</script>

<style scoped>
.ssi-kv-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}
.ssi-kv {
  background: var(--s2);
  border: 1px solid var(--b1);
  border-radius: 4px;
  padding: 8px 10px;
}
.ssi-kv-l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--t2);
  margin-bottom: 4px;
}
.ssi-kv-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--t1);
}
.ssi-kv-v.ok { color: var(--green); }
.ssi-kv-v.warn { color: var(--amber); }
.ssi-inputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--b2);
  padding-top: 8px;
}
.ssi-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}
.ssi-input-key {
  width: 72px;
  color: var(--t2);
  flex-shrink: 0;
}
.ssi-input-val {
  width: 48px;
  color: var(--t1);
}
.ssi-input-vote {
  margin-left: auto;
  color: var(--t3);
}
.ssi-input-vote.ok { color: var(--green); }
</style>
