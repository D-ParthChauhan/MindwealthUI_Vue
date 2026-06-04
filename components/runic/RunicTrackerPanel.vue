<template>
  <div v-if="tracker">
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px">
      <div>
        <div class="runic-card" style="margin-bottom:10px">
          <div class="runic-card-hd">
            <div class="runic-card-title">Combo C — Cancel Condition Monitor</div>
            <span class="runic-badge b-act">{{ tracker.combo_c_cancel_fri }} OF 4 FRIDAYS</span>
          </div>
          <div class="runic-body" style="padding:10px 14px;border-bottom:1px solid var(--b2)">
            <b style="color:var(--t3)">CANCEL LOGIC:</b> WTI 4wk Δ checked at NYMEX close ~14:30 ET each Friday.<br>
            <b style="color:var(--amber)">CURRENT: WTI 4wk Δ = {{ tracker.wti_4wk_pct }}%.</b> Below +5% cancel gate — potential week 1 of 4 if confirmed Friday close.
          </div>
          <div class="fri-row" style="background:var(--s2);border-bottom:1px solid var(--b2);font-size:7px">
            <span style="width:50px">FRI #</span><span style="width:75px">DATE</span><span style="width:75px">WTI 4WK Δ</span>
            <span style="width:55px">WTI LEG</span><span style="flex:1">DATA (CPI/PPI)</span><span style="width:55px">DATA LEG</span><span style="width:65px">STATUS</span>
          </div>
          <div
            v-for="row in tracker.friday_rows"
            :key="row.num"
            class="fri-row"
            :style="row.highlight ? { background: 'rgba(230,126,34,0.03)', border: '1px solid rgba(230,126,34,0.08)' } : undefined"
          >
            <span style="width:50px" :style="{ color: rowColor(row, 'num') }">{{ row.num }}</span>
            <span style="width:75px" :style="{ color: rowColor(row, 'date') }">{{ row.date }}</span>
            <span style="width:75px" :style="{ color: rowColor(row, 'wti') }">{{ row.wti }}</span>
            <span style="width:55px" :style="{ color: rowColor(row, 'wti_leg') }">{{ row.wti_leg }}</span>
            <span style="flex:1" :style="{ color: rowColor(row, 'data') }">{{ row.data }}</span>
            <span style="width:55px" :style="{ color: rowColor(row, 'data_leg') }">{{ row.data_leg }}</span>
            <span class="runic-badge" :class="row.badge_class" style="width:65px;text-align:center">{{ row.status }}</span>
          </div>
        </div>
        <div class="runic-card">
          <div class="runic-card-hd"><div class="runic-card-title">CPI / PPI Sourcing Rules · Developer Reference</div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px 14px" class="runic-body">
            <div>
              <div style="color:var(--gold);margin-bottom:3px">DATA SOURCES</div>
              CPI actual: BLS.gov (FRED: CPIAUCSL)<br>CPI consensus: Investing.com calendar<br>PPI actual: BLS.gov (FRED: PPIACO)<br>"Not hot" = actual ≤ consensus
            </div>
            <div>
              <div style="color:var(--gold);margin-bottom:3px">PAIRING RULES</div>
              CPI Mon–Thu → pairs with THAT week's Friday<br>No print that week → data passes by default<br>Counter RESETS to zero on any Friday failure
            </div>
          </div>
        </div>
      </div>
      <div class="runic-card">
        <div class="runic-card-hd"><div class="runic-card-title">Cancel Summary</div></div>
        <div style="padding:12px 14px">
          <div class="runic-cancel-dots" style="margin-bottom:10px">
            <div
              v-for="(f, i) in tracker.cancel_fridays"
              :key="i"
              :class="{ filled: f.filled, critical: f.critical }"
              :title="f.label.replace('\n', ' ')"
            />
          </div>
          <div class="runic-body">
            <div style="color:var(--amber);margin-bottom:3px">EARLIEST POSSIBLE CANCEL</div>Jun 20, 2026 (all 4 clear)<br><br>
            <div style="color:var(--red);margin-bottom:3px">CURRENT C STATUS</div>ACTIVE · MEDIUM · WK 11<br>Dominant bearish 83%<br><br>
            <div style="color:var(--green);margin-bottom:3px">IF C CANCELS</div>F becomes dominant (wk {{ tracker.f_window.weeks_elapsed }}/{{ tracker.f_window.weeks_total }})<br>E structural warning persists
          </div>
        </div>
      </div>
    </div>

    <div class="runic-card" style="margin-top:10px">
      <div class="runic-card-hd">
        <div class="runic-card-title">Combo F — 26-Week Recovery Window Monitor</div>
        <span class="runic-badge b-ok">WK {{ tracker.f_window.weeks_elapsed }} OF {{ tracker.f_window.weeks_total }} · ACTIVE</span>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;padding:12px 14px">
        <div>
          <div class="runic-body" style="margin-bottom:10px">
            Fire date: <span style="color:var(--t2)">{{ tracker.f_window.fire_date }}</span> · Window expires: <span style="color:var(--t2)">{{ tracker.f_window.expires }}</span><br>
            Current MTM from fire: <span style="color:var(--green);font-weight:600">+{{ tracker.f_window.mtm_pct }}%</span> (SPX ~6,200 → ~7,550)<br>
            <span style="color:var(--amber)">Cancel condition: Combo B fires only. Combo D does NOT cancel F.</span>
          </div>
          <div class="runic-body" style="margin-bottom:4px">WINDOW ELAPSED · {{ tracker.f_window.weeks_elapsed }} of {{ tracker.f_window.weeks_total }} weeks ({{ fPct }}%)</div>
          <div class="prog-wrap"><div class="prog-fill" style="background:var(--green)" :style="{ width: `${fPct}%` }" /></div>
          <div class="runic-body" style="margin-top:3px;display:flex;justify-content:space-between">
            <span>Mar 30 · fire</span><span style="color:var(--green)">wk {{ tracker.f_window.weeks_elapsed }} · now</span><span>Sep 22 · expires</span>
          </div>
        </div>
        <div class="runic-body">
          <div style="color:var(--green);margin-bottom:4px">WINDOW STATUS</div>
          Active · {{ tracker.f_window.weeks_total - tracker.f_window.weeks_elapsed }} weeks remaining<br>Dominant: strategic BRAVE<br>Tactical override: C (wk 11)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RunicCancelFridayRow } from '~/types/api'

const { cancelTracker: tracker } = useRunicMacro()

const fPct = computed(() => {
  if (!tracker.value) return 0
  const { weeks_elapsed, weeks_total } = tracker.value.f_window
  return Math.round((weeks_elapsed / weeks_total) * 100)
})

function rowColor(row: RunicCancelFridayRow, field: string) {
  if (row.highlight) return field === 'num' || field === 'date' || field === 'data' || field === 'data_leg' ? 'var(--amber)' : 'var(--t4)'
  if (row.status === 'PENDING') {
    if (field === 'wti' || field === 'wti_leg') return 'var(--amber)'
    if (field === 'data_leg') return 'var(--green)'
    return field === 'num' || field === 'date' ? 'var(--t2)' : 'var(--t4)'
  }
  return 'var(--t4)'
}
</script>
