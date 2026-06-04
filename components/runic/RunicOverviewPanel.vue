<template>
  <div>
    <div class="kr k5">
      <KpiCard
        v-for="kpi in kpis"
        :key="kpi.label"
        :label="kpi.label"
        :value="kpi.value"
        :delta="kpi.delta"
        :accent="kpi.accent"
        :delta-class="kpi.deltaClass"
        :class="kpi.valueClass"
      />
    </div>

    <div class="runic-two-col">
      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Active Combos</div></div>
        <div style="padding:10px 14px">
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--red)">C · Stagflation / Energy Shock</span>
              <span class="runic-badge b-act">MEDIUM WK {{ comboCWk }}</span>
            </div>
            <div class="runic-body">
              WTI fired ~Mar 10 (Iran, +50% peak $117). Now $91 → 4wk Δ = {{ wtiPct }}%.<br>
              WTI cancel leg: {{ wtiPct }}% 4wk Δ — below +5% gate. Potential wk 1 of 4 if confirmed Fri close.<br>
              CPI Apr 10: 0.2% vs 0.3% → not hot ✓. Next CPI: Jun 11.<br>
              <span style="color:var(--amber)">CANCEL: 4 consecutive Fri both legs clear. Counter at {{ cancelFri }}/4.</span>
            </div>
            <div style="margin-top:6px">
              <div class="runic-body" style="margin-bottom:3px">CANCEL PROGRESS · {{ cancelFri }} of 4 Fridays</div>
              <div class="runic-cancel-dots">
                <div
                  v-for="i in 4"
                  :key="i"
                  :class="{ filled: i <= cancelFri, pending: i === cancelFri + 1 && cancelFri < 4 }"
                />
              </div>
              <div class="runic-body" style="margin-top:2px">Fri 3 = CPI week (Jun 11/13)</div>
            </div>
          </div>
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--gold)">E · Valuation Extreme</span>
              <span class="runic-badge b-conf">{{ eBadge }}</span>
            </div>
            <div class="runic-body">
              CAPE 42.0× &gt; 28× gate ✓ (EXTREME tier &gt;32×)<br>
              NFCI −0.52 &lt; −0.3 gate ✓ (easy = RARE tier)<br>
              CFTC: PENDING Friday — 2/3 already confirmed.<br>
              <span style="color:var(--gold)">2 of 3 required → E IS CONFIRMED. Multiplier on D active.</span>
            </div>
          </div>
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--green)">F · Recovery / Re-entry</span>
              <span class="runic-badge b-bull">WK {{ fWk }} OF 26</span>
            </div>
            <div class="runic-body">
              Fired Mar 30, 2026 · SPX reclaimed 50WMA +4.2% weekly.<br>
              SPX currently ~7,550 from fire ~6,200 = <span style="color:var(--green)">+{{ fMtm }}% MTD from fire.</span><br>
              Active until Sep 22, 2026.<br>
              <span style="color:var(--green)">D+F TENSION: D tactical vs F strategic. Both valid.</span>
            </div>
            <div style="margin-top:5px">
              <div class="runic-body" style="margin-bottom:2px">F WINDOW · {{ fWk }} of 26 weeks ({{ fPct }}%)</div>
              <div class="prog-wrap"><div class="prog-fill" style="width:var(--f-pct);background:var(--green)" :style="{ width: `${fPct}%` }" /></div>
            </div>
          </div>
        </div>
      </div>

      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Watch + Resolved</div></div>
        <div style="padding:10px 14px">
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--amber)">D · FOMO Top / Euphoria</span>
              <span class="runic-badge b-watch">WATCH · {{ dLegs }}/3 LEGS</span>
            </div>
            <div class="runic-body">
              VXTS 1.25 → EXTREME contango ✓ · VIX 16.7 → below 18 ✓<br>
              CFTC: est. &gt;75th–85th pctile · PENDING Friday TFF report ⚠<br>
              <span style="color:var(--amber)">If CFTC &gt;85th confirmed → D FIRES. With E confirmed → D+E = structural top.</span>
            </div>
          </div>
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--t4)">B · Maximum Capitulation</span>
              <span class="runic-badge b-off">RESOLVED · Apr 2025</span>
            </div>
            <div class="runic-body">
              Apr 7, 2025: VIX 52 + HY &gt;400bps + CFTC &lt;15th pctile. All 3 confirmed.<br>
              7/8 positive 3m = 87.5%. SPX +25% from lows by May 2026.<br>
              <span style="color:var(--t4)">CRITICAL: If B fires again → Combo F 26wk window cancels immediately.</span>
            </div>
          </div>
          <div class="runic-combo-block">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--t4)">G · Hidden Stress</span>
              <span class="runic-badge b-off">RESOLVED · Apr 2025</span>
            </div>
            <div class="runic-body">
              Led Apr 2025 spike by ~3 weeks (G→B cascade). VXTS now 1.25 contango (resolved from backwardation). HY OAS ~305bps — not widening.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCftcAlert" class="cftc-alert">
      <div class="nd amber" style="width:6px;height:6px;margin-top:2px;animation:pu 2s infinite;flex-shrink:0" />
      <div class="runic-body" style="color:var(--amber)">
        CFTC 3-DAY LAG · TFF published each Friday reflects prior Tuesday's positions.
        Combos B, D, E, F all require CFTC. Last available (Tue May 26): est. {{ cftcEst }} pctile net long.
        Flag any Combo D or B fire this week as <span style="color:#fff">PENDING CFTC CONFIRM</span> until Friday report posts (~15:30 ET).
        Combo D is 2/3 confirmed — one leg pending Friday TFF.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { comboEBadge } from '~/utils/runic-regime'

const { nightly } = useRunicMacro()

const comboCWk = computed(() => nightly.value?.active_combos.find((c) => c.combo === 'C')?.wk ?? 11)
const fWk = computed(() => nightly.value?.active_combos.find((c) => c.combo === 'F')?.wk ?? 8)
const fMtm = computed(() => nightly.value?.active_combos.find((c) => c.combo === 'F')?.mtm_pct ?? 21.8)
const fPct = computed(() => Math.round((fWk.value / 26) * 100))
const cancelFri = computed(() => nightly.value?.combo_c_cancel_fri ?? 0)
const wtiPct = computed(() => nightly.value?.wti_4wk_pct?.toFixed(1) ?? '−17.2')
const eBadge = computed(() => comboEBadge(nightly.value?.combo_e_status ?? 'CONFIRMED_2_OF_3'))
const dLegs = computed(() => nightly.value?.watch_combos.find((c) => c.combo === 'D')?.legs_confirmed ?? 2)
const showCftcAlert = computed(() => nightly.value?.cftc_status === 'PENDING_3DAY_LAG')
const cftcEst = computed(() => nightly.value?.cftc_est_pctile ?? '75–85th')

const kpis = computed(() => [
  {
    label: 'Dominant Signal',
    value: `COMBO ${nightly.value?.dominant_signal ?? 'C'}`,
    delta: `${nightly.value?.dominant_reason ?? 'Stagflation / Energy Shock'} · 3m horizon`,
    accent: 'r',
    deltaClass: 'r',
    valueClass: 'kv-sm',
  },
  { label: 'C Duration', value: `Wk ${comboCWk.value}`, delta: 'MEDIUM (6–16 wks)', accent: 'amber', deltaClass: 'amber' },
  { label: 'Combo F Window', value: `Wk ${fWk.value}`, delta: 'of 26 · +22% from fire date', accent: 'g', deltaClass: 'g' },
  { label: 'CAPE · Combo E', value: '42.0×', delta: `${eBadge.value} (CAPE+NFCI)`, accent: 'r', deltaClass: 'r' },
  {
    label: 'WTI 4-Wk Δ',
    value: `${wtiPct.value}%`,
    delta: `Below +5% cancel gate · wk ${cancelFri.value || 1}`,
    accent: 'b',
    deltaClass: 'g',
  },
])
</script>

<style scoped>
.kv-sm :deep(.kv) {
  font-size: 14px;
  padding-top: 4px;
}
</style>
