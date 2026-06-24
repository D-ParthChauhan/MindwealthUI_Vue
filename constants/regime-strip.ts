import { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH } from '~/constants/unavailable'
import { isApiUnavailable } from '~/utils/api-display'
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
  MacroCombosResponse,
  MacroStatusResponse,
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
  macroStatus?: MacroStatusResponse | null
  macroCombos?: MacroCombosResponse | null
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

function shortPosturePart(display: string, part: 'tactical' | 'strategic'): string {
  const segments = display.split('/').map((s) => s.trim()).filter(Boolean)
  const raw = part === 'tactical' ? segments[0] : segments[1]
  if (!raw) return ''
  return raw
    .replace(/^TACTICAL /i, 'TAC ')
    .replace(/^STRATEGIC /i, 'STR ')
}

function shortCftcStatus(status: string): string {
  return status
    .replace('PENDING_3DAY_LAG', 'PENDING 3D')
    .replace('PENDING_CFTC_CONFIRM', 'PENDING CFTC')
    .replace(/_/g, ' ')
}

function formatStripWti(pct: number): string {
  const rounded = Math.round(pct * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function postureStripColor(text: string): string {
  const t = text.toUpperCase()
  if (t.includes('FEAR') || t.includes('TIGHT')) return 'var(--red)'
  if (t.includes('BRAVE') || t.includes('EASY')) return 'var(--green)'
  return 'var(--gold)'
}

function macroStatusList(
  status: MacroStatusResponse | null | undefined,
  nightlyIds: string[],
  key: 'active_combos' | 'watch_combos',
): string[] {
  const fromStatus = status?.[key] ?? []
  if (status && !isApiUnavailable(status) && fromStatus.length) return fromStatus
  return nightlyIds.length ? nightlyIds : fromStatus
}

function macroStatusField<T>(
  status: MacroStatusResponse | null | undefined,
  nightlyValue: T | null | undefined,
  pick: (s: MacroStatusResponse) => T,
): T | null | undefined {
  if (status && !isApiUnavailable(status)) return pick(status)
  return nightlyValue
}

function formatMacroActiveChip(
  ids: string[],
  combos: MacroCombosResponse['combos'],
): string {
  return ids
    .map((id) => {
      const c = combos.find((x) => x.combo === id)
      if (!c) return id
      const wk = c.duration_weeks != null ? ` wk${c.duration_weeks}` : ''
      const tag =
        c.status.toUpperCase() === 'CONFIRMED'
          ? ' CONF'
          : c.duration_bucket
            ? ` ${c.duration_bucket.slice(0, 3)}`
            : ''
      return `${id}${wk}${tag}`
    })
    .join(' · ')
}

function formatMacroWatchChip(
  ids: string[],
  combos: MacroCombosResponse['combos'],
  nightly?: RunicNightlyResponse | null,
): string {
  return ids
    .map((id) => {
      const c = combos.find((x) => x.combo === id)
      const watchRow = nightly?.watch_combos?.find((w) => w.combo === id)
      const total = c?.total_legs || c?.legs_required || 0
      const confirmed = c?.confirmed_legs?.length ?? watchRow?.legs_confirmed
      if (!total || confirmed == null) return id
      return `${id} ${confirmed}/${total}`
    })
    .join(' · ')
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
      const status = ctx.macroStatus
      const combos = ctx.macroCombos?.combos ?? []
      const n = ctx.nightly
      const items: string[] = []
      const posture =
        macroStatusField(status, n?.brave_fearful_display, (s) => s.brave_fearful_display)
        ?? ''

      const dominant =
        macroStatusField(status, n?.dominant_signal, (s) => s.dominant_signal)
        ?? n?.dominant_signal
      if (dominant && dominant !== '—' && !dominant.includes(UNAVAILABLE_FETCH)) {
        items.push(chip('DOMINANT', dominant, 'var(--gold)'))
      }

      const activeIds = macroStatusList(
        status,
        n?.active_combos?.map((c) => c.combo) ?? [],
        'active_combos',
      )
      if (activeIds.length) {
        items.push(chip('ACTIVE', formatMacroActiveChip(activeIds, combos), 'var(--green)'))
      }

      const watchIds = macroStatusList(
        status,
        n?.watch_combos?.map((w) => w.combo) ?? [],
        'watch_combos',
      )
      if (watchIds.length) {
        items.push(chip('WATCH', formatMacroWatchChip(watchIds, combos, n), 'var(--amber)'))
      }

      const cancelWeek = macroStatusField(status, n?.combo_c_cancel_fri, (s) => s.combo_c_cancel_week)
      const cancelCancelled = status && !isApiUnavailable(status) ? status.combo_c_cancelled : false
      if (cancelWeek != null || cancelCancelled) {
        const label = cancelCancelled ? 'CANCELLED' : `${cancelWeek}/4`
        items.push(chip('C CANCEL', label, cancelCancelled ? 'var(--t3)' : 'var(--amber)'))
      }

      const cftc = macroStatusField(status, n?.cftc_status, (s) => s.cftc_status)
      if (cftc && !String(cftc).includes(UNAVAILABLE_FETCH)) {
        const short = shortCftcStatus(String(cftc))
        const color = short.includes('PENDING') || short.includes('STALE')
          ? 'var(--amber)'
          : 'var(--green)'
        items.push(chip('CFTC', short, color))
      }

      const pendingCpi = status && !isApiUnavailable(status) ? status.pending_cpi_release : false
      if (pendingCpi) {
        items.push(chip('CPI', 'PENDING', 'var(--amber)'))
      }

      const vixBypass =
        (status && !isApiUnavailable(status) ? status.vix_bypass : false)
        || Boolean(n?.vix_bypass_active)
      if (vixBypass) {
        items.push(chip('VIX', 'BYPASS', 'var(--amber)'))
      }

      if (n && !isApiUnavailable(n) && Number.isFinite(n.wti_4wk_pct)) {
        const wti = formatStripWti(n.wti_4wk_pct)
        items.push(chip('WTI 4W', wti, n.wti_4wk_pct >= 0 ? 'var(--green)' : 'var(--red)'))
      }

      const tactical = posture && !posture.includes(UNAVAILABLE_FETCH)
        ? shortPosturePart(posture, 'tactical')
        : ''
      const strategic = posture && !posture.includes(UNAVAILABLE_FETCH)
        ? shortPosturePart(posture, 'strategic')
        : ''
      if (strategic) {
        items.push(chip('STR', strategic.replace(/^STR\s+/i, ''), postureStripColor(strategic)))
      }

      const headline = tactical || (n && !isApiUnavailable(n) ? deriveRegimeLabel(n) : 'RUNIC MACRO')
      const bearish = headline.toLowerCase().includes('fear') || headline.toLowerCase().includes('tight')

      return {
        dotClass: bearish ? 'er' : watchIds.length ? 'warn' : 'ok',
        headline,
        items,
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
            c.storeLive
              ? `conviction_store live · as of ${c.asOf}`
              : isApiUnavailable(c)
                ? `${UNAVAILABLE_FETCH} · as of ${c.asOf}`
                : `as of ${c.asOf}`,
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
      const c = ctx.portfolio?.ceiling
      if (!c) {
        return { dotClass: 'ok', headline: 'PORTFOLIO SIZER', items: [] }
      }
      const items: string[] = []
      if (c.vix != null) items.push(chip('VIX', String(c.vix), vixStripColor(c.vix, c.vix_regime ?? '')))
      if (c.ssi_multiplier != null) {
        items.push(chip(
          'SSI MULT',
          `${c.ssi_multiplier.toFixed(2)}×`,
          c.ssi_multiplier >= 1 ? 'var(--green)' : 'var(--amber)',
        ))
      }
      if (c.final_ceiling_pct != null) {
        items.push(chip('CEILING', `${c.final_ceiling_pct}%`, 'var(--gold)'))
      } else {
        items.push(chip('CEILING', UNAVAILABLE_COMPUTE, 'var(--t3)'))
      }
      if (c.val_regime) items.push(chip('VAL REGIME', c.val_regime, 'var(--amber)'))
      return {
        dotClass: ctx.portfolio?.macro_override?.active ? 'warn' : 'ok',
        headline: c.vix_regime ? `VIX REGIME: ${c.vix_regime}` : 'PORTFOLIO SIZER',
        items,
        right: c.formula_text
          ? `<span class="rsv" style="color:var(--t3)">${c.formula_text}</span>`
          : undefined,
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
        if (ow.kpis.backtest_wr != null) {
          items.push(chip('BT WR', `${ow.kpis.backtest_wr}%`, 'var(--green)'))
        }
        if (ow.kpis.forward_wr != null) {
          items.push(chip('FWD WR', `${ow.kpis.forward_wr}%`, 'var(--blue)'))
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
      const status = ctx.macroStatus
      const combos = ctx.macroCombos?.combos ?? []
      if (status?.active_combos?.length) {
        const label = status.active_combos
          .map((id) => {
            const c = combos.find((x) => x.combo === id)
            return c?.duration_weeks != null ? `${id} WK${c.duration_weeks}` : id
          })
          .join(' · ')
          .toUpperCase()
        const dot = status.watch_combos?.length || status.vix_bypass ? 'gold' : 'g'
        return { dot, label }
      }
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
      if (ctx.portfolio?.ceiling?.vix_regime) {
        return { dot: 'g', label: `VIX ${ctx.portfolio.ceiling.vix_regime}` }
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

    case '/macro': {
      const status = ctx.macroStatus
      const combos = ctx.macroCombos?.combos ?? []
      const activeIds = status?.active_combos?.slice(0, 2)
        ?? ctx.nightly?.active_combos?.slice(0, 2).map((c) => c.combo)
        ?? []
      for (const id of activeIds) {
        const c = combos.find((x) => x.combo === id)
        const nightlyC = ctx.nightly?.active_combos?.find((x) => x.combo === id)
        const wk = c?.duration_weeks ?? nightlyC?.wk
        items.push({
          dot: c?.status?.toLowerCase().includes('confirm') ? 'on' : 'wa',
          label: `COMBO ${id}${wk != null ? ` · wk ${wk}` : ''}`.toUpperCase(),
        })
      }
      const dominant = status?.dominant_signal ?? ctx.nightly?.dominant_signal
      if (dominant && dominant !== '—') {
        items.push({ dot: 'wa', label: dominant, right: true })
      }
      break
    }

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
      if (ctx.portfolio?.summary.open_position_count) {
        items.push({
          dot: 'on',
          label: `OPEN · ${ctx.portfolio.summary.open_position_count}`,
        })
      }
      if (ctx.portfolio?.ceiling?.final_ceiling_pct != null) {
        items.push({
          dot: 'on',
          label: `CEILING · ${ctx.portfolio.ceiling.final_ceiling_pct}%`,
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
