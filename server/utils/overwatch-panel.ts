import type {
  ApiMeta,
  OverwatchAlert,
  OverwatchPanelAlert,
  OverwatchResponse,
  OverwatchSystemCheck,
} from '~/types/api'
import { UNAVAILABLE_FETCH } from '~/constants/unavailable'

const FLOOR_PCT = 60

function degradationId(a: OverwatchAlert) {
  return `deg-${a.strategy}-${a.signal_type}-${a.interval}`.replace(/\s+/g, '-').toLowerCase()
}

function inferPattern(a: OverwatchAlert): string {
  if (a.win < FLOOR_PCT) {
    return `Function degradation: ${a.strategy} underperforming — FWD below absolute floor`
  }
  if (a.gap <= -15) {
    return `Combo issue: ${a.strategy}/${a.signal_type} — gap vs backtest exceeds 15pp`
  }
  return `Asset-specific: review ${a.strategy} fundamentals and recent exits-at-loss`
}

function inferRecommendation(a: OverwatchAlert): string {
  if (a.win < FLOOR_PCT) return 'review model params, reduce exposure until FWD recovers above 60%'
  if (a.gap <= -15) return 'pause new entries on this combo, monitor weekly FWD trend'
  return 'hold existing, defer new entries until gap narrows'
}

export function degradationToPanelAlert(a: OverwatchAlert): OverwatchPanelAlert {
  const aboveFloor = a.win >= FLOOR_PCT
  const floorWord = aboveFloor ? 'Above' : 'Below'
  const pattern = inferPattern(a)
  const recommendation = inferRecommendation(a)
  const trendStep = (a.win - a.backtest) / 3
  const fwdTrend = [0, 1, 2, 3].map((i) =>
    Math.round(Math.min(100, Math.max(0, a.win - trendStep * (3 - i))) * 10) / 10,
  )

  return {
    id: degradationId(a),
    type: 'degradation',
    label: 'AI ANALYST · AUTO-TRIGGERED · DEGRADATION ALERT',
    html: `<span class="wa">${a.strategy} ${a.signal_type.toLowerCase()}</span> gap: BT ${a.backtest}% vs FWD ${a.win}%. ${floorWord} 60% floor.<br>${pattern}.`,
    recommendation,
    fwd_trend: fwdTrend,
    created_at: new Date().toISOString(),
    signal: {
      strategy: a.strategy,
      interval: a.interval,
      signal_type: a.signal_type,
      fwd_wr: a.win,
      backtest_wr: a.backtest,
      gap: a.gap,
      pattern,
      above_floor: aboveFloor,
    },
  }
}

export function mockRunicPanelAlert(): OverwatchPanelAlert {
  return {
    id: 'runic-qqq-rsi-extreme',
    type: 'runic',
    label: 'AI ANALYST · RUNIC SIGNAL · SSI + MACRO EXTREME',
    html:
      'QQQ RSI 82.8 + 14.5% above 50DMA: <span class="wa">3/3 negative 1M historically</span>. Tavily confirms elevated tech concentration risk. SSI composite +0.4 — neutral, no long trigger.',
    footer: 'TAVILY ACTIVE · INTERNAL DATA PRIORITY · ONCE PER PAGE VISIT',
    created_at: new Date().toISOString(),
    macro: {
      combo: 'QQQ',
      reason: 'RSI 82.8 · +14.5% above 50DMA',
      narrative:
        '3/3 negative 1M historically. Tavily confirms elevated tech concentration risk. SSI composite +0.4 — neutral, no long trigger.',
      variant: 'ssi',
    },
  }
}

export function runicPanelAlertFromNightly(nightly: {
  dominant_signal?: string
  dominant_reason?: string
  narrative?: string
  brave_fearful?: string
}): OverwatchPanelAlert {
  const combo = nightly.dominant_signal ?? '—'
  const reason = nightly.dominant_reason ?? 'macro regime shift'
  const snippet = (nightly.narrative ?? '').slice(0, 220)
  return {
    id: `runic-dominant-${combo}`.toLowerCase(),
    type: 'runic',
    label: 'AI ANALYST · RUNIC SIGNAL · MACRO INTELLIGENCE',
    html: `Dominant <span class="wa">Combo ${combo}</span>: ${reason}. ${snippet}${snippet.length >= 220 ? '…' : ''}`,
    footer: nightly.brave_fearful
      ? `BRAVE/FEARFUL · ${nightly.brave_fearful.replace(/_/g, ' ')} · LIVE API`
      : 'LIVE · macro/runic/nightly',
    created_at: new Date().toISOString(),
    macro: {
      combo,
      reason,
      narrative: snippet,
      brave_fearful: nightly.brave_fearful,
      variant: 'dominant',
    },
  }
}

function csvAgeMinutes(meta?: ApiMeta): number | null {
  const dt = meta?.data_updated_at?.datetime
  if (!dt) return null
  const ts = Date.parse(dt)
  if (!Number.isFinite(ts)) return null
  return Math.round((Date.now() - ts) / 60_000)
}

function csvStatus(ageMins: number | null): OverwatchSystemCheck['status'] {
  if (ageMins == null) return 'warn'
  if (ageMins < 60) return 'ok'
  if (ageMins < 180) return 'warn'
  return 'fail'
}

export function buildSystemChecks(
  meta?: ApiMeta,
  systemLogs?: OverwatchResponse['system_logs'],
  options?: { unavailable?: boolean },
): OverwatchSystemCheck[] {
  if (options?.unavailable) {
    return [{ name: 'Backend', status: 'fail', detail: UNAVAILABLE_FETCH }]
  }

  const usAge = csvAgeMinutes(meta)
  const checks: OverwatchSystemCheck[] = [
    {
      name: 'US CSV pipeline',
      status: csvStatus(usAge),
      detail: usAge != null ? `${usAge}m ago` : UNAVAILABLE_FETCH,
    },
    {
      name: 'India CSV pipeline',
      status: 'warn',
      detail: UNAVAILABLE_FETCH,
    },
    {
      name: 'Claude API',
      status: 'warn',
      detail: UNAVAILABLE_FETCH,
    },
    {
      name: 'Tavily',
      status: 'warn',
      detail: UNAVAILABLE_FETCH,
    },
    {
      name: 'Google Sheets sync',
      status: meta?.data_updated_at?.date ? 'ok' : 'warn',
      detail: meta?.data_updated_at?.date ?? UNAVAILABLE_FETCH,
    },
  ]

  for (const log of systemLogs ?? []) {
    if (log.type === 'delay' || log.type === 'warn') {
      checks.push({
        name: log.tag,
        status: log.type === 'delay' ? 'warn' : 'fail',
        detail: log.text.slice(0, 80),
      })
    }
  }

  return checks
}

export function buildOverwatchPanelPayload(
  data: Pick<OverwatchResponse, 'alerts' | 'meta' | 'system_logs' | 'data_source'>,
  options?: { runicAlert?: OverwatchPanelAlert | null; includeMockRunic?: boolean; unavailable?: boolean },
): { panel_alerts: OverwatchPanelAlert[]; system_checks: OverwatchSystemCheck[] } {
  const degradation = data.alerts.map(degradationToPanelAlert)
  let runic: OverwatchPanelAlert[] = []
  if (options?.runicAlert) {
    runic = [options.runicAlert]
  } else if (options?.includeMockRunic === true && degradation.length > 0) {
    runic = [mockRunicPanelAlert()]
  }

  return {
    panel_alerts: [...degradation, ...runic],
    system_checks: buildSystemChecks(data.meta, data.system_logs, {
      unavailable: options?.unavailable ?? data.data_source === 'unavailable',
    }),
  }
}
