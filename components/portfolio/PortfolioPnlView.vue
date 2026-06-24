<template>
  <div class="pf-view pf-view-pnl">
    <div class="pf-sub-hd pf-sub-hd-compact">
      <div class="pf-sub-hd-txt pf-sub-muted">
        Open positions · virtual trading book · drawdown flag when MTM &lt; −10%
      </div>
      <div class="pf-live-badge">● LIVE</div>
    </div>
    <div class="pf-pnl-inner">
      <table class="pf-tbl">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Investment type</th>
            <th title="Data frequency: Monthly = longer-duration; Weekly = days to weeks; Daily = short-term.">Signal · Frequency</th>
            <th class="r">Entry $</th>
            <th class="r">Current $</th>
            <th class="r">Shares</th>
            <th class="r">Market value</th>
            <th class="r">P&amp;L $</th>
            <th class="r">P&amp;L %</th>
            <th class="c">BQ</th>
            <th class="c">Size tier</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data.pnl_rows"
            :key="`${row.ticker}-${row.function}`"
            :class="{ 'pf-row-blocked': row.blocked }"
          >
            <td><div class="pf-tkr" :class="{ 'pf-blocked-ticker': row.blocked }">{{ row.ticker }}</div></td>
            <td><div class="pf-tsub">{{ pfText(data, row.investment_type) }}</div></td>
            <td><div class="pf-tsub">{{ row.function }} · {{ row.interval }}</div></td>
            <td class="pf-mono">{{ pfNum(data, row.entry_price) }}</td>
            <td class="pf-mono">{{ pfNum(data, row.current_price) }}</td>
            <td class="pf-mono">{{ pfNum(data, row.shares, 0) }}</td>
            <td class="pf-mono">{{ pfUsd(data, row.market_value) }}</td>
            <td class="pf-mono" :class="pnlClass(row.pnl_usd)">{{ pfUsd(data, row.pnl_usd) }}</td>
            <td class="pf-mono" :class="pnlClass(row.pnl_pct)">
              {{ row.pnl_pct != null ? `${row.pnl_pct > 0 ? '+' : ''}${row.pnl_pct}%` : UNAVAILABLE_COMPUTE }}
            </td>
            <td class="c">
              <div class="pf-bq-cell" :class="bqClass(row.bq_score)">
                {{ row.bq_score != null ? `${row.bq_score > 0 ? '+' : ''}${row.bq_score}` : '—' }}
              </div>
              <div class="pf-tsub">{{ pfText(data, row.size_tier) }}</div>
            </td>
            <td class="c">
              <div class="pf-sz-pill" :class="bqClass(row.bq_score)">{{ pfText(data, row.size_tier) }}</div>
            </td>
            <td>
              <div class="pf-pr-flags">
                <PortfolioFlagBadge v-for="flag in row.flags" :key="flag.id" :flag="flag" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!data.pnl_rows.length" class="pf-empty-msg">No open positions in virtual trading book.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UNAVAILABLE_COMPUTE } from '~/constants/unavailable'
import type { PortfolioResponse } from '~/types/api'
import { bqClass, pfNum, pfText, pfUsd, pnlClass } from '~/utils/portfolio-display'

defineProps<{ data: PortfolioResponse }>()
</script>
