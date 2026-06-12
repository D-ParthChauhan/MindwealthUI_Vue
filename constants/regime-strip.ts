import {
  deployStripColor,
  deriveRegimeLabel,
  formatRegimeStripRight,
  regimeValColor,
  sentimentStripColor,
  sigmaStripColor,
  vixStripColor,
} from '~/utils/runic-regime'
import type {
  DashboardResponse,
  OverwatchResponse,
  PortfolioResponse,
  RunicNightlyResponse,
  SentimentResponse,
  SignalCountsResponse,
} from '~/types/api'
import type { ConvictionResponse } from '~/types/conviction'
import { formatConviction } from '~/utils/conviction-display'

/** Set true to restore the SIGMA chip on the dashboard regime strip */
export const showDashboardSigmaStrip = false

export type RegimeStripConfig = {
  dotClass?: string
  headline: string
  labelColor?: string
  items?: string[]
  right?: string
}

export type AgentBarItem = { dot: string; label: string; right?: boolean }

export type RegimeStripContext = {
  counts?: SignalCountsResponse | null
  dashboard?: DashboardResponse | null
  sentiment?: SentimentResponse | null
  nightly?: RunicNightlyResponse | null
  conviction?: ConvictionResponse | null
  portfolio?: PortfolioResponse | null
  overwatch?: OverwatchResponse | null
}

function chip(label: string, value: string, color: string): string {
  return `${label} <span class="rsv" style="color:${color}">${value}</span>`
}

function chipParts(
  label: string,
  parts: Array<{ text: string; color: string }>,
): string {
  const value = parts
    .map((p) => `<span class="rsv" style="color:${p.color}">${p.text}</span>`)
    .join(' · ')
  return `${label} ${value}`
}

function sentimentPair(
  score?: string,
  label?: string,
): { score: string; label: string } | null {
  if (!score) return null
  return { score, label: label ?? '' }
}

function formatComboRegime(nightly: RunicNightlyResponse): string {
  const parts: string[] = []
  for (const c of nightly.active_combos) {
    const status = (c.status ?? 'ACTIVE').toUpperCase()
    parts.push(`${c.combo} ${status}`)
  }
  for (const w of nightly.watch_combos) {
    parts.push(`${w.combo} WATCH`)
  }
  return parts.join(' · ')
}

function convictionItemColor(score: number | null, verdict: string): string {
  if (verdict === 'YIELD TRAP' || verdict === 'CANCEL') return 'var(--red)'
  if (score == null) return 'var(--t3)'
  if (score >= 5) return 'var(--green)'
  if (score >= 2) return 'var(--amber)'
  return 'var(--red)'
}

export function buildRegimeStrip(path: string, ctx: RegimeStripContext): RegimeStripConfig {
  const sent =
    sentimentPair(ctx.sentiment?.composite.score, ctx.sentiment?.composite.label) ??
    sentimentPair(ctx.dashboard?.kpis.sentiment_score, ctx.dashboard?.kpis.sentiment_label)

  switch (path) {
    case '/dashboard': {
      const k = ctx.dashboard?.kpis
      const n = ctx.nightly
      const dashSent =
        sentimentPair(k?.sentiment_score, k?.sentiment_label) ?? sent
      const items: string[] = []
      if (n && (n.active_combos.length || n.watch_combos.length)) {
        items.push(chip('REGIME', formatComboRegime(n), 'var(--gold)'))
      }
      if (showDashboardSigmaStrip && k?.sigma && k.sigma !== '—') {
        items.push(chip('SIGMA', k.sigma, sigmaStripColor(k.sigma)))
      }
      if (dashSent) {
        items.push(chip('SENTIMENT SCORE', dashSent.score, sentimentStripColor(dashSent.score)))
      }
      if (n?.vix != null) {
        items.push(chip('VIX', String(n.vix), vixStripColor(n.vix, n.regime?.val_regime)))
      }
      if (n?.regime?.val_regime && n.max_deploy_pct != null) {
        items.push(chipParts('VIX REGIME', [
          { text: n.regime.val_regime, color: regimeValColor(n.regime.val_regime) },
          { text: `${n.max_deploy_pct}% DEPLOY`, color: deployStripColor(n.max_deploy_pct) },
        ]))
      }
      return {
        dotClass: n?.watch_combos?.length ? 'warn' : 'ok',
        headline: n ? deriveRegimeLabel(n) : 'DASHBOARD',
        items,
        right: n ? formatRegimeStripRight(n) : undefined,
      }
    }

    case '/signals': {
      const items: string[] = []
      if (sent) {
        items.push(chip(
          'SENTIMENT',
          `${sent.score}${sent.label ? ` · ${sent.label}` : ''}`,
          sentimentStripColor(sent.score),
        ))
      }
      if (ctx.counts) {
        items.push(chip('OUTSTANDING', String(ctx.counts.outstanding), 'var(--blue)'))
        if (ctx.counts.new > 0) items.push(chip('NEW', String(ctx.counts.new), 'var(--gold)'))
      }
      return { dotClass: 'ok', headline: 'SIGNALS', items }
    }

    case '/macro': {
      const n = ctx.nightly
      const items: string[] = []
      if (n?.dominant_signal && n.dominant_signal !== '—') {
        items.push(chip('DOMINANT', n.dominant_signal, 'var(--gold)'))
      }
      if (n?.dominant_reason) {
        items.push(chip('REASON', n.dominant_reason, 'var(--amber)'))
      }
      for (const c of n?.active_combos ?? []) {
        const wk = c.wk != null ? `wk ${c.wk}` : ''
        const bucket = c.bucket ? ` · ${c.bucket}` : ''
        const status = c.status ? ` · ${c.status}` : ''
        items.push(chip(
          `COMBO ${c.combo}`,
          `${wk}${bucket}${status}`.trim() || 'active',
          'var(--green)',
        ))
      }
      for (const w of n?.watch_combos ?? []) {
        items.push(
          chip(
            `WATCH ${w.combo}`,
            `${w.legs_confirmed}/3 legs · ${w.pending}`,
            'var(--amber)',
          ),
        )
      }
      if (n && Number.isFinite(n.wti_4wk_pct)) {
        const wti = `${n.wti_4wk_pct > 0 ? '+' : ''}${n.wti_4wk_pct}%`
        items.push(chip('WTI 4W', wti, n.wti_4wk_pct >= 0 ? 'var(--green)' : 'var(--red)'))
      }
      if (n && n.combo_c_cancel_fri != null) {
        items.push(chip('C CANCEL FRI', `${n.combo_c_cancel_fri}/4`, 'var(--amber)'))
      }
      const headline = n ? deriveRegimeLabel(n) : 'RUNIC MACRO'
      const bearish = headline.toLowerCase().includes('bear') || headline.toLowerCase().includes('fearful')
      return {
        dotClass: bearish ? 'er' : n?.watch_combos?.length ? 'warn' : 'ok',
        headline,
        items,
        right: n ? formatRegimeStripRight(n) : undefined,
      }
    }

    case '/sentiment': {
      const items: string[] = []
      if (sent) {
        items.push(chip(
          'SCORE',
          `${sent.score}${sent.label ? ` · ${sent.label}` : ''}`,
          sentimentStripColor(sent.score),
        ))
      }
      items.push(chip('LONG TRIGGER', '< −0.60', 'var(--green)'))
      items.push(chip('SHORT TRIGGER', '> +0.60', 'var(--red)'))
      return {
        dotClass: 'purple',
        headline: 'SUPER SENTIMENT INDEX (SSI)',
        labelColor: 'var(--purple)',
        items,
      }
    }

    case '/conviction': {
      const c = ctx.conviction
      const items = (c?.signals ?? [])
        .filter((s) => s.isEquity)
        .slice(0, 3)
        .map((s) => {
          const score = s.convictionScore != null ? formatConviction(s.convictionScore) : '—'
          const color = convictionItemColor(s.convictionScore, s.verdict)
          return chip(s.ticker, `${score} · ${s.verdict}`, color)
        })
      const right = c
        ? chip(
            'SOURCE',
            `${c.storeLive ? 'conviction_store live' : 'mock data'} · as of ${c.asOf}`,
            c.storeLive ? 'var(--green)' : 'var(--t3)',
          )
        : undefined
      return {
        dotClass: c && c.health.yieldTraps > 0 ? 'er' : 'purple',
        headline: 'CONVICTION ENGINE v5',
        labelColor: 'var(--purple)',
        items,
        right,
      }
    }

    case '/portfolio': {
      const r = ctx.portfolio?.regime
      if (!r) {
        return { dotClass: 'ok', headline: 'PORTFOLIO SIZER', items: [] }
      }
      return {
        dotClass: 'ok',
        headline: `VIX REGIME: ${r.regime}`,
        items: [
          chip('MAX DEPLOY', `${r.max_deploy}%`, 'var(--green)'),
          chip(
            'SSI MULT',
            `${r.ssi_multiplier.toFixed(2)}×`,
            r.ssi_multiplier >= 1 ? 'var(--green)' : 'var(--amber)',
          ),
          chip(
            'CREDIT ADJ',
            `${r.credit_adj.toFixed(2)}×`,
            r.credit_adj >= 1 ? 'var(--green)' : 'var(--amber)',
          ),
          chip('CEILING', `${r.final_ceiling}%`, 'var(--gold)'),
          chip('CASH', `${r.cash_pct}%`, 'var(--teal)'),
          chip('VIX', String(r.vix), vixStripColor(r.vix, r.regime)),
        ],
      }
    }

    case '/overwatch': {
      const ow = ctx.overwatch
      const count = ow?.count ?? 0
      const items: string[] = []
      if (ow?.message && count > 0) {
        items.push(chip('TOP ALERT', ow.message, 'var(--red)'))
      }
      if (ow?.kpis) {
        items.push(chip('BT WR', `${ow.kpis.backtest_wr}%`, 'var(--green)'))
        items.push(chip('FWD WR', `${ow.kpis.forward_wr}%`, 'var(--blue)'))
        if (ow.kpis.forced_portfolio_ytd) {
          items.push(chip('FORCED YTD', `+${ow.kpis.forced_portfolio_ytd}%`, 'var(--gold)'))
        }
      }
      return {
        dotClass: count > 0 ? 'er' : 'ok',
        headline: count > 0 ? `${count} DEGRADATION ALERT${count === 1 ? '' : 'S'}` : 'OVERWATCH',
        labelColor: count > 0 ? 'var(--red)' : undefined,
        items,
        right: 'LAYER 1 · PERFORMANCE · LAYER 2 · SYSTEM',
      }
    }

    default:
      return { dotClass: 'ok', headline: 'TERMINAL', items: [] }
  }
}

export function buildTopbarStatus(
  path: string,
  ctx: RegimeStripContext,
): { dot: string; label: string } | undefined {
  switch (path) {
    case '/signals':
      if (ctx.counts) return { dot: 'g', label: `${ctx.counts.outstanding} ACTIVE` }
      return undefined
    case '/macro': {
      const n = ctx.nightly
      if (!n?.active_combos?.length) return { dot: 'gold', label: 'RUNIC MACRO' }
      const label = n.active_combos
        .map((c) => `${c.combo}${c.wk != null ? ` WK${c.wk}` : ''}`)
        .join(' · ')
        .toUpperCase()
      const dot = n.watch_combos?.length ? 'gold' : 'g'
      return { dot, label }
    }
    case '/sentiment':
      return { dot: 'p', label: 'SSI · 13 SIGNALS' }
    case '/conviction':
      return { dot: 'p', label: 'CONVICTION ENGINE' }
    case '/portfolio':
      if (ctx.portfolio?.regime) {
        return { dot: 'g', label: `VIX ${ctx.portfolio.regime.regime}` }
      }
      return { dot: 'g', label: 'PORTFOLIO SIZER' }
    case '/overwatch': {
      const count = ctx.overwatch?.count ?? 0
      if (count > 0) return { dot: 'r', label: `${count} ALERT${count === 1 ? '' : 'S'}` }
      return { dot: 'g', label: 'ALL CLEAR' }
    }
    default:
      return undefined
  }
}

export function buildAgentItems(path: string, ctx: RegimeStripContext): AgentBarItem[] {
  const items: AgentBarItem[] = []

  switch (path) {
    case '/dashboard':
      if (ctx.dashboard?.kpis.sentiment_score) {
        items.push({ dot: 'on', label: `SSI ${ctx.dashboard.kpis.sentiment_score}` })
      }
      if (ctx.dashboard?.kpis.overwatch_count) {
        items.push({
          dot: ctx.nightly?.watch_combos?.length ? 'wa' : 'on',
          label: `MACRO SIGNALS · ${ctx.dashboard.kpis.overwatch_count}`,
        })
      }
      if (ctx.counts) items.push({ dot: 'on', label: `SIGNALS · ${ctx.counts.outstanding}`, right: true })
      break

    case '/signals':
      if (ctx.counts) {
        items.push({ dot: 'on', label: `${ctx.counts.outstanding} OUTSTANDING` })
        if (ctx.counts.new > 0) items.push({ dot: 'on', label: `${ctx.counts.new} NEW` })
      }
      break

    case '/macro':
      for (const c of ctx.nightly?.active_combos?.slice(0, 2) ?? []) {
        items.push({
          dot: c.status?.toLowerCase().includes('confirm') ? 'on' : 'wa',
          label: `COMBO ${c.combo}${c.wk != null ? ` · wk ${c.wk}` : ''}`.toUpperCase(),
        })
      }
      if (ctx.nightly?.dominant_signal && ctx.nightly.dominant_signal !== '—') {
        items.push({ dot: 'wa', label: ctx.nightly.dominant_signal, right: true })
      }
      break

    case '/sentiment':
      if (ctx.sentiment?.composite.score) {
        items.push({ dot: 'on', label: `SSI ${ctx.sentiment.composite.score}` })
      }
      break

    case '/conviction':
      if (ctx.conviction?.health.yieldTraps) {
        items.push({
          dot: 'er',
          label: `YIELD TRAP · ${ctx.conviction.health.yieldTrapTickers.join(', ')}`,
        })
      }
      if (ctx.conviction) {
        items.push({
          dot: 'on',
          label: `AVG CONVICTION · ${formatConviction(ctx.conviction.health.avgConviction)}`,
          right: true,
        })
      }
      break

    case '/portfolio':
      if (ctx.portfolio?.regime) {
        items.push({
          dot: 'on',
          label: `CEILING · ${ctx.portfolio.regime.final_ceiling}%`,
        })
        items.push({
          dot: 'on',
          label: `CASH · ${ctx.portfolio.regime.cash_pct}%`,
          right: true,
        })
      }
      break

    case '/overwatch':
      if (ctx.overwatch?.count) {
        items.push({ dot: 'er', label: ctx.overwatch.message })
      } else {
        items.push({ dot: 'on', label: 'NO DEGRADATION ALERTS' })
      }
      break
  }

  return items
}
