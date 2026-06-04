<template>
  <div>
    <div v-if="analogC" class="runic-card card-flush" style="margin-bottom:12px">
      <div class="runic-card-hd">
        <div class="runic-card-title" :style="{ color: analogC.title_color }">{{ analogC.title }}</div>
        <span class="runic-body">{{ analogC.subtitle }}</span>
      </div>
      <table class="at">
        <thead>
          <tr>
            <th>Fire Date</th><th>Context</th><th>WTI at Fire</th><th>Duration</th>
            <th>Max DD</th><th>Bottom Timing</th>
            <th v-for="col in analogC.columns" :key="col">{{ col }}</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in analogC.rows" :key="row.date" :class="row.row_class">
            <td class="atd" :style="row.date_color ? { color: row.date_color } : undefined">{{ row.date }}</td>
            <td class="runic-body" style="max-width:120px">{{ row.context }}</td>
            <td :style="{ color: 'var(--amber)' }">{{ row.wti }}</td>
            <td :style="{ color: 'var(--amber)' }">{{ row.duration }}</td>
            <td class="ret neg">{{ row.max_dd }}</td>
            <td class="runic-body">{{ row.bottom_timing }}</td>
            <td v-for="(ret, i) in row.returns" :key="i" class="ret" :class="ret.cls">{{ ret.val }}</td>
            <td><span class="runic-badge" :class="row.verdict_class">{{ row.verdict }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="analogF" class="runic-card card-flush">
      <div class="runic-card-hd">
        <div class="runic-card-title" :style="{ color: analogF.title_color }">{{ analogF.title }}</div>
        <span class="runic-body">{{ analogF.subtitle }}</span>
      </div>
      <table class="at">
        <thead>
          <tr>
            <th>Fire Date</th><th>Context</th><th>CFTC at Fire</th><th>Mtm Now</th>
            <th v-for="col in analogF.columns" :key="col">{{ col }}</th>
            <th>Max DD</th><th>Bottom Timing</th><th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in analogF.rows" :key="row.date" :class="row.row_class">
            <td class="atd" :style="row.date_color ? { color: row.date_color } : undefined">{{ row.date }}</td>
            <td class="runic-body" style="max-width:110px">{{ row.context }}</td>
            <td :style="{ color: row.cftc_color }">{{ row.cftc }}</td>
            <td class="runic-body" :style="row.mtm_style">{{ row.mtm }}</td>
            <td v-for="(ret, i) in row.returns" :key="i" class="ret" :class="ret.cls">{{ ret.val }}</td>
            <td class="ret" :class="row.max_dd_cls">{{ row.max_dd }}</td>
            <td class="runic-body">{{ row.bottom_timing }}</td>
            <td><span class="runic-badge" :class="row.verdict_class">{{ row.verdict }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-if="analogF.footnote" class="analog-foot">{{ analogF.footnote }}</div>
    </div>

    <div class="runic-df-tension">
      BOTH VALID SIMULTANEOUSLY. Different time horizons.
    </div>
  </div>
</template>

<script setup lang="ts">
const { analogC, analogF } = useRunicMacro()
</script>

<style scoped>
.card-flush { padding: 0; overflow: hidden; }
.analog-foot {
  padding: 7px 13px;
  background: var(--s2);
  border-top: 1px solid var(--b2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  color: var(--t4);
}
</style>
