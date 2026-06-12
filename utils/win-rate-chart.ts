import type { ApiMeta, DashboardResponse, PerformanceRow } from '~/types/api'

const INTERVAL_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const

export type WinRateChartData = NonNullable<DashboardResponse['win_rate_chart']>

const FALLBACK_PALETTE = ['#27ae60', '#c0392b', '#C9A84C', '#3498db', '#16a085'] as const

export function resolveSeriesStyle(
  name: string,
  index: number,
): { color: string; stroke_width: number; opacity: number } {
  const n = name.toLowerCase()
  if (n.includes('long')) {
    return { color: FALLBACK_PALETTE[0], stroke_width: 2, opacity: 1 }
  }
  if (n.includes('short')) {
    return { color: FALLBACK_PALETTE[1], stroke_width: 1.5, opacity: 0.75 }
  }
  if (n.includes('backtest')) {
    return { color: FALLBACK_PALETTE[2], stroke_width: 1.5, opacity: 1 }
  }
  return {
    color: FALLBACK_PALETTE[index % FALLBACK_PALETTE.length],
    stroke_width: 1.5,
    opacity: 1,
  }
}

export function getChartXLabels(chart: WinRateChartData): string[] {
  const xValues = [...new Set(chart.series.flatMap((s) => s.points.map((p) => p.x)))]
  if (chart.properties.x_axis === 'Interval') {
    return [...xValues].sort((a, b) => intervalSortIndex(a) - intervalSortIndex(b))
  }
  return xValues
}

function isLong(signalType: string): boolean {
  return signalType.toLowerCase().startsWith('l')
}

function intervalSortIndex(x: string): number {
  const idx = INTERVAL_ORDER.indexOf(x as (typeof INTERVAL_ORDER)[number])
  return idx === -1 ? INTERVAL_ORDER.length : idx
}

function sortByX(points: Array<{ x: string; y: number }>, xAxis: 'interval' | 'function') {
  if (xAxis !== 'interval') return points
  return [...points].sort((a, b) => intervalSortIndex(a.x) - intervalSortIndex(b.x))
}

function averageByX(points: Array<{ x: string; y: number }>): Array<{ x: string; y: number }> {
  const buckets = new Map<string, number[]>()
  for (const point of points) {
    const vals = buckets.get(point.x) ?? []
    vals.push(point.y)
    buckets.set(point.x, vals)
  }
  return [...buckets.entries()].map(([x, vals]) => ({
    x,
    y: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
  }))
}

function detectXAxis(rows: PerformanceRow[]): 'interval' | 'function' {
  const functions = new Set(rows.map((r) => r.function.trim()))
  if (functions.size <= 1 && rows.some((r) => r.interval)) return 'interval'
  return 'function'
}

function xLabel(row: PerformanceRow, xAxis: 'interval' | 'function'): string {
  return xAxis === 'interval' ? row.interval : row.function
}

function backtestPoints(
  rows: PerformanceRow[],
  xAxis: 'interval' | 'function',
): Array<{ x: string; y: number }> {
  const buckets = new Map<string, number[]>()
  for (const row of rows) {
    const x = xLabel(row, xAxis)
    if (!x) continue
    const vals = buckets.get(x) ?? []
    vals.push(row.avg_backtested_win_rate)
    buckets.set(x, vals)
  }
  const points = [...buckets.entries()].map(([x, vals]) => ({
    x,
    y: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
  }))
  return sortByX(points, xAxis)
}

function livePoints(
  rows: PerformanceRow[],
  xAxis: 'interval' | 'function',
  long: boolean,
): Array<{ x: string; y: number }> {
  const filtered = rows.filter((r) => (long ? isLong(r.signal_type) : !isLong(r.signal_type)))
  const points = averageByX(
    filtered.map((r) => ({
      x: xLabel(r, xAxis),
      y: r.win_percentage,
    })),
  )
  return sortByX(points, xAxis)
}

function computeScale(
  series: WinRateChartData['series'],
): WinRateChartData['scale'] {
  const values = series.flatMap((s) => s.points.map((p) => p.y)).filter(Number.isFinite)
  if (!values.length) {
    return { y_min: 0, y_max: 100, y_ticks: [0, 50, 100] }
  }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const yMin = Math.max(0, Math.floor(rawMin / 5) * 5 - 5)
  const yMax = Math.min(100, Math.ceil(rawMax / 5) * 5 + 5)
  const span = yMax - yMin
  const step = span <= 20 ? 5 : span <= 50 ? 10 : 20
  const ticks: number[] = []
  for (let t = yMin; t <= yMax; t += step) ticks.push(t)
  if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax)
  return { y_min: yMin, y_max: yMax, y_ticks: ticks }
}

export function buildWinRateChart(
  rows: PerformanceRow[],
  meta?: ApiMeta,
): WinRateChartData | undefined {
  if (!rows.length) return undefined

  const xAxis = detectXAxis(rows)
  const metric = rows[0]?.function?.trim() || 'Performance'
  const series: WinRateChartData['series'] = []

  const longPoints = livePoints(rows, xAxis, true)
  if (longPoints.length) {
    const style = resolveSeriesStyle('Long WR', series.length)
    series.push({ name: 'Long WR', points: longPoints, ...style })
  }

  const shortPoints = livePoints(rows, xAxis, false)
  if (shortPoints.length) {
    const style = resolveSeriesStyle('Short WR', series.length)
    series.push({ name: 'Short WR', points: shortPoints, ...style })
  }

  const backtestPointsList = backtestPoints(rows, xAxis)
  if (backtestPointsList.length) {
    const style = resolveSeriesStyle('Backtested WR', series.length)
    series.push({ name: 'Backtested WR', points: backtestPointsList, ...style })
  }

  if (!series.length) return undefined

  const scale = computeScale(series)
  const sourceFile =
    meta?.source_files?.combined_performance_report
    ?? meta?.source_files?.['Combined Performance Report']

  const xAxisLabel = xAxis === 'interval' ? 'Interval' : 'Function'
  const scope =
    xAxis === 'interval'
      ? `All strategies combined · ${metric} forward-testing report`
      : `Per-function forward testing · ${metric}`

  return {
    properties: {
      x_axis: xAxisLabel,
      y_axis: 'Win rate (%)',
      metric,
      row_count: rows.length,
      source_file: sourceFile,
      scope,
      reading_hint:
        'Green = long forward WR · Red = short forward WR · Gold = backtest baseline. A gap >10pp below gold triggers overwatch.',
    },
    scale,
    series,
  }
}

export function formatWinRateChartCaption(chart: WinRateChartData): string {
  const { properties, scale, series } = chart
  const seriesNames = series.map((s) => s.name).join(' · ')
  const xValues = [
    ...new Set(series.flatMap((s) => s.points.map((p) => p.x))),
  ]
  const orderedX =
    properties.x_axis === 'Interval'
      ? [...xValues].sort((a, b) => intervalSortIndex(a) - intervalSortIndex(b))
      : xValues
  const parts = [
    `Y: ${properties.y_axis}`,
    `X: ${properties.x_axis}`,
    `Scale: ${scale.y_min}–${scale.y_max}%`,
    `Metric: ${properties.metric}`,
    `Series: ${seriesNames}`,
  ]
  if (orderedX.length) parts.push(`Points: ${orderedX.join(' · ')}`)
  if (properties.source_file) {
    const shortSource = properties.source_file.split('/').pop() ?? properties.source_file
    parts.push(`Source: ${shortSource}`)
  }
  return parts.join(' · ')
}

export function chartHasForwardSoftening(chart: WinRateChartData): boolean {
  const long = chart.series.find((s) => s.name === 'Long WR')
  const backtest = chart.series.find((s) => s.name === 'Backtested WR')
  if (!long || !backtest) return chart.series.some((s) => s.name === 'Short WR')
  const backtestByX = new Map(backtest.points.map((p) => [p.x, p.y]))
  return long.points.some((p) => {
    const bt = backtestByX.get(p.x)
    return bt != null && p.y < bt - 10
  })
}
