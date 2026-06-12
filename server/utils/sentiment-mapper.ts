import type { SentimentLayerItem, SentimentResponse } from '~/types/api'
import { recordsToSignals } from './signal-parsers'
import { baseMeta } from './meta'

type LayersApi = {
  composite?: {
    ssi_level?: number | null
    ssi_percentile_5y?: number | null
    layer2_status?: string | null
    ssi_multiplier?: number | null
  }
  layer_inputs?: {
    layer1?: Record<string, number>
    layer2_votes?: Array<{
      input?: string
      raw?: number
      vote?: boolean
      signal?: string
      pctile?: number
    }>
    layer3_cftc?: Record<string, unknown>
  }
  layer2_votes?: Array<{
    input?: string
    raw?: number
    vote?: boolean
    signal?: string
    pctile?: number
  }>
  signal_rows?: Record<string, unknown>[]
  signal_report_date?: string
  positioning?: Record<string, unknown>
}

const LAYER1_LABELS: Record<string, string> = {
  aaii_spread: 'AAII Bull-Bear Spread',
  naaim_exposure: 'NAAIM Exposure',
  cnn_fg_raw: 'CNN Fear & Greed',
  pct_above_200dma: '% Above 200DMA',
  mcclellan: 'McClellan Oscillator',
  nh_nl_ratio: 'NH/NL Ratio',
  skew: 'CBOE Skew',
}

const LAYER2_LABELS: Record<string, string> = {
  hyg_lqd: 'HYG/LQD Credit',
  dbmf_beta: 'DBMF Beta',
  cnn_fg: 'CNN Fear & Greed',
  vix_ratio: 'VIX Term Structure',
}

function layerColor(signal?: string, vote?: boolean): string {
  if (signal === 'stress' || signal === 'bearish') return 'var(--red)'
  if (vote === true || signal === 'risk_on' || signal === 'low_beta') return 'var(--green)'
  if (signal === 'neutral') return 'var(--teal)'
  return 'var(--t2)'
}

function formatLayer1Item(key: string, value: number): SentimentLayerItem {
  const label = LAYER1_LABELS[key] ?? key.replace(/_/g, ' ')
  let display = String(value)
  if (key.includes('pct') || key.includes('exposure')) display = `${value.toFixed(1)}%`
  else if (Math.abs(value) < 100) display = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2)
  return {
    label,
    value: display,
    sub: 'Live · analytics/sentiment/layers',
    color: value >= 0 ? 'var(--green)' : 'var(--red)',
  }
}

function formatLayer2Item(v: NonNullable<LayersApi['layer2_votes']>[number]): SentimentLayerItem {
  const key = String(v.input ?? '')
  const label = LAYER2_LABELS[key] ?? key.replace(/_/g, ' ')
  const voteLabel = v.vote ? '✓' : '✗'
  return {
    label,
    value: `${voteLabel} ${v.signal ?? ''}`.trim(),
    sub: v.raw != null ? `raw ${Number(v.raw).toFixed(3)}` : undefined,
    color: layerColor(v.signal, v.vote),
    highlight: v.vote === true,
  }
}

function formatLayer3Items(cftc: Record<string, unknown> | undefined): SentimentLayerItem[] {
  if (!cftc) return []
  const items: SentimentLayerItem[] = []
  if (cftc.fm_pctile != null) {
    items.push({
      label: 'FAST MONEY (Lev Funds) · 3yr pct',
      value: `${Number(cftc.fm_pctile).toFixed(0)}th pct`,
      sub: cftc.fm_net != null ? `net ${Number(cftc.fm_net).toLocaleString()}` : undefined,
      color: Number(cftc.fm_pctile) < 30 ? 'var(--red)' : 'var(--teal)',
    })
  }
  if (cftc.rm_pctile != null) {
    items.push({
      label: 'REAL MONEY (Asset Mgrs) · 3yr pct',
      value: `${Number(cftc.rm_pctile).toFixed(0)}th pct`,
      sub: cftc.rm_net != null ? `net ${Number(cftc.rm_net).toLocaleString()}` : undefined,
      color: 'var(--green)',
    })
  }
  if (cftc.status != null) {
    items.push({
      label: 'CFTC Layer Status',
      value: String(cftc.status).replace(/_/g, ' '),
      color: String(cftc.status).includes('PENDING') ? 'var(--amber)' : 'var(--green)',
      highlight: true,
    })
  }
  return items
}

function compositeFromApi(c: LayersApi['composite']): SentimentResponse['composite'] {
  const level = c?.ssi_level ?? 0
  const score = (level >= 0 ? '+' : '') + Number(level).toFixed(1)
  const pct = c?.ssi_percentile_5y
  const l2 = c?.layer2_status ?? '—'
  const mult = c?.ssi_multiplier != null ? ` · ${c.ssi_multiplier}× size` : ''
  const label =
    pct != null
      ? `SSI ${pct.toFixed(0)}th pctile 5y · L2 ${l2}${mult}`
      : `layer2 ${l2}${mult}`
  return { score, label }
}

export function mapSentimentLayers(api: LayersApi): SentimentResponse {
  const layer1 = api.layer_inputs?.layer1 ?? {}
  const layer2 = api.layer2_votes ?? api.layer_inputs?.layer2_votes ?? []
  const layer3 = api.layer_inputs?.layer3_cftc as Record<string, unknown> | undefined

  const weeklyItems = Object.entries(layer1).map(([k, v]) => formatLayer1Item(k, Number(v)))
  const dailyItems = layer2.map(formatLayer2Item)
  const positioningItems = formatLayer3Items(layer3)

  const weeklyScore =
    weeklyItems.length > 0
      ? Math.round((weeklyItems.filter((i) => i.color === 'var(--green)').length / weeklyItems.length) * 10) / 10
      : 0
  const dailyScore =
    layer2.length > 0
      ? Math.round((layer2.filter((v) => v.vote).length / layer2.length) * 10) / 10
      : 0
  const positioningScore =
    positioningItems.length > 0
      ? Math.round((api.composite?.ssi_level ?? 0) * 10) / 10
      : 0

  const meta = baseMeta()
  if (api.signal_report_date) {
    meta.data_updated_at = {
      date: api.signal_report_date,
      time: '00:00:00',
      datetime: `${api.signal_report_date}T00:00:00Z`,
      timezone: 'UTC',
    }
  }

  const signals = api.signal_rows?.length ? recordsToSignals(api.signal_rows) : []

  return {
    meta,
    composite: compositeFromApi(api.composite),
    signals,
    layers: {
      weekly: {
        score: weeklyScore,
        label: `${weeklyItems.length} weekly inputs · API`,
        items: weeklyItems,
      },
      daily: {
        score: dailyScore,
        label: `${layer2.filter((v) => v.vote).length}/${layer2.length} layer-2 votes confirming`,
        items: dailyItems,
      },
      positioning: {
        score: positioningScore,
        label: String(api.composite?.layer2_status ?? 'positioning · API'),
        items: positioningItems,
      },
    },
  }
}
