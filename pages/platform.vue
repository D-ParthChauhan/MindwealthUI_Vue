<template>
  <div class="landing-page platform-layout">
    <div class="pl">
      <div class="hey">
        <span class="hey-line" />MINDWEALTH · ALPHA TERMINAL
      </div>
      <h1 class="platform-h1">
        The systematic quant<br>model <span>with a difference.</span>
      </h1>
      <p class="platform-p">
        Systematic discipline. Macro intelligence. Fundamental conviction. Every morning, before the market opens, the platform has already sized your portfolio, checked system health, and written your briefing.
      </p>
      <div class="platform-stats">
        <div><div class="platform-stat-v">{{ avgWinRate }}</div><div class="hsl">AVG WIN RATE</div></div>
        <div><div class="platform-stat-v">{{ avgCagr }}</div><div class="hsl">AVG 10YR CAGR</div></div>
        <div><div class="platform-stat-v">{{ sharpeRatio }}</div><div class="hsl">SHARPE RATIO</div></div>
      </div>
      <div class="platform-footer">
        Authorized access · London · Singapore · North America<br>
        <span class="gold-text">Secure login · Role-based · Agentic morning brief 08:00 NZDT</span>
      </div>
      <NuxtLink to="/dashboard" class="hero-cta">Launch Terminal →</NuxtLink>
    </div>
    <div class="pr">
      <div class="arch-label">PLATFORM ARCHITECTURE</div>
      <div v-for="block in archBlocks" :key="block.title" class="arch-card">
        <div class="arch-icon" :style="{ borderColor: block.border, background: block.bg }">{{ block.icon }}</div>
        <div>
          <div class="arch-title">{{ block.title }}</div>
          <div class="arch-desc">{{ block.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { avgWinRate, avgCagr, sharpeRatio } = useLandingStats()

const archBlocks = [
  {
    icon: '⚡',
    title: '10 Backtested Signal Functions',
    desc: 'FractalTrack · TrendPulse · DeltaDrift · BandMatrix · SigmaShell · PulseGauge · SBI · AltitudeAlpha + 2 more. Forward-test monitored live with degradation alerts.',
    bg: 'rgba(39,174,96,0.1)',
    border: 'rgba(39,174,96,0.2)',
  },
  {
    icon: '🔮',
    title: 'Runic Macro Agent — Pattern Library',
    desc: '12 macro variables. Seminal market situations. "This setup occurred 5 times since 1990 — here\'s the forward return table." Rare + extreme. Not function replication. Macro-level only.',
    bg: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.2)',
  },
  {
    icon: '📊',
    title: 'Super Sentiment Index — 13 Signals',
    desc: 'AAII · NAAIM · Put/Call EMA · CNN F&G · VIX term structure · %200DMA · McClellan · NH/NL · HY · SKEW · COT Real/Fast · DBMF. Score −3 to +3.',
    bg: 'rgba(142,68,173,0.1)',
    border: 'rgba(142,68,173,0.2)',
  },
  {
    icon: '🏦',
    title: 'Portfolio Sizer + Conviction Engine',
    desc: 'VIX regime → cluster budgets → SSI multiplier → credit adjustment → final deploy ceiling. Conviction Engine fundamental filter modifies per-signal sizing.',
    bg: 'rgba(22,160,133,0.1)',
    border: 'rgba(22,160,133,0.2)',
  },
]
</script>

<style scoped>
.hey-line {
  width: 22px;
  height: 1px;
  background: var(--gold);
  display: block;
}
.platform-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(26px, 4vw, 46px);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 18px;
}
.platform-h1 span { color: var(--gold); }
.platform-p {
  font-size: 13px;
  color: var(--t2);
  line-height: 1.7;
  margin-bottom: 26px;
  max-width: 380px;
}
.platform-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 26px;
}
.platform-stat-v {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--gold);
}
.platform-footer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--t3);
  line-height: 2;
  margin-bottom: 20px;
}
.gold-text { color: var(--gold); }
.arch-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 2px;
  color: var(--t4);
  margin-bottom: 14px;
}
.arch-card {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 7px;
  padding: 13px 15px;
  display: flex;
  gap: 12px;
  margin-bottom: 9px;
}
.arch-icon {
  width: 34px;
  height: 34px;
  border-radius: 7px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.arch-title {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}
.arch-desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: var(--t3);
}
.hero-cta {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  padding: 10px 18px;
  border-radius: 4px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
}
</style>
