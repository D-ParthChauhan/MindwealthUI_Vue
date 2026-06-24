<template>
  <div class="landing-page hero-layout">
    <div class="hl">
      <div class="hey">MindWealth · Alpha Terminal</div>
      <h1 class="hh1">
        Systematic discipline.<br><span>Macro intelligence.</span><br>One platform.
      </h1>
      <p class="hp">
        A rules-based quant model with a 10-year backtested track record — layered with a live macro intelligence engine, a 13-signal Super Sentiment Index, and a fundamental Conviction Engine. Built for serious capital.
      </p>
      <div class="hstats">
        <div><span class="hsv">{{ avgWinRate }}</span><span class="hsl">AVG WIN RATE</span></div>
        <div><span class="hsv">{{ avgCagr }}</span><span class="hsl">AVG 10YR CAGR</span></div>
        <div><span class="hsv">{{ functionCount }}</span><span class="hsl">FUNCTIONS</span></div>
        <div><span class="hsv">{{ macroComboCount }}</span><span class="hsl">MACRO COMBOS</span></div>
      </div>
      <div class="htags">
        <div class="htag gold">Runic Macro Engine</div>
        <div class="htag gold">Super Sentiment Index · 13 signals</div>
        <div class="htag gold">Conviction Engine v5</div>
        <div class="htag">Systematic + Fundamental</div>
        <div class="htag">2-Layer Overwatch</div>
        <div class="htag">Agentic Morning Brief</div>
      </div>
      <NuxtLink
        to="/dashboard"
        class="hero-cta"
      >
        Enter Alpha Terminal →
      </NuxtLink>
    </div>
    <div class="hr">
      <div class="hr-label">WHAT MAKES IT DIFFERENT</div>
      <div v-for="card in featureCards" :key="card.num" class="fc">
        <div class="fcn">{{ card.num }}</div>
        <div class="fct">{{ card.title }}</div>
        <div class="fcd" v-html="card.body" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { avgWinRate, avgCagr, functionCount, macroComboCount } = useLandingStats()

const featureCards = [
  {
    num: '01 · SIGNAL ENGINE',
    title: '10 Backtested Strategy Functions',
    body: 'FractalTrack, TrendPulse, DeltaDrift, BandMatrix, SigmaShell, PulseGauge, SBI, AltitudeAlpha, OscillatorDelta, BaselineDivergence. Each independently backtested. Forward-test monitored live. <em>Price-action rules. No discretion.</em>',
  },
  {
    num: '02 · RUNIC MACRO AGENT',
    title: 'Macro Pattern Library — Historical Analog Tables',
    body: '12 macro variables at extrema. "This setup occurred 5 times since 1990 — here\'s the forward return table at 1W/1M/2M/3M." Rare (≤8 instances, ≥80% hit rate) AND z-score extreme. <em>Macro-only. Does not replicate existing functions.</em>',
  },
  {
    num: '03 · SUPER SENTIMENT INDEX',
    title: '13-Signal Composite Sentiment Score',
    body: 'AAII + NAAIM + Put/Call EMA + CNN F&amp;G + VIX term structure + %200DMA + McClellan + NH/NL + HY spreads + COT Real/Fast Money + DBMF intraday CTA proxy. Score −3 to +3. <em>Separate long/short entry rules.</em>',
  },
  {
    num: '04 · CONVICTION ENGINE v5',
    title: '15-Dimension Fundamental Modifier',
    body: 'BQ score, valuation tax, FS cap, yield trap hard gate. Modifies position sizing per signal. <em>Where systematic discipline meets Graham\'s margin of safety.</em>',
  },
  {
    num: '05 · PORTFOLIO SIZER + OVERWATCH',
    title: 'Cluster Budgets + Regime-Aware Sizing + 2-Layer Monitoring',
    body: 'VIX regime (low/normal/stress) sets cluster budgets. PulseGauge multiplier adjusts further. Layer 1: BT vs FWD performance. Layer 2: data pipeline + auto-correction. <em>Never fails silently.</em>',
  },
]
</script>

<style scoped>
.hr-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 3px;
  color: var(--t4);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--b1);
}
.hero-cta {
  display: inline-block;
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  padding: 10px 18px;
  border-radius: 4px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
  transition: all 0.2s;
}
.hero-cta:hover {
  background: rgba(201, 168, 76, 0.18);
  transform: translateY(-1px);
}
</style>
