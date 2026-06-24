import type { MacroCombosResponse, MacroNamedCombo, RunicActiveCombo, RunicComboStatusRow, RunicNightlyResponse } from '~/types/api'

export function comboStatusBadgeClass(status: string): string {
  const s = status.toUpperCase()
  if (s === 'ACTIVE') return 'b-act'
  if (s === 'CONFIRMED') return 'b-conf'
  if (s === 'WATCH') return 'b-watch'
  if (s === 'CANCELLED' || s === 'RESOLVED' || s === 'INACTIVE') return 'b-off'
  return 'b-ok'
}

export function comboCardClass(status: string): string | undefined {
  const s = status.toUpperCase()
  if (s === 'ACTIVE') return 'active-c'
  if (s === 'WATCH') return 'watch-c'
  if (s === 'CONFIRMED') return 'conf-c'
  return undefined
}

export function comboLetterClass(status: string): string | undefined {
  return comboCardClass(status)
}

export function comboNameColor(direction?: string): string | undefined {
  if (!direction) return undefined
  const d = direction.toUpperCase()
  if (d.includes('BEARISH')) return 'var(--red)'
  if (d.includes('BULLISH')) return 'var(--green)'
  return 'var(--amber)'
}

export function comboNavDot(status: string, direction?: string): string {
  const s = status.toUpperCase()
  if (s === 'CANCELLED' || s === 'RESOLVED' || s === 'INACTIVE') return 'off'
  if (s === 'CONFIRMED') return 'gold'
  if (s === 'WATCH') return 'amber'
  const d = (direction ?? '').toUpperCase()
  if (d.includes('BEARISH')) return 'r'
  if (d.includes('BULLISH')) return 'g'
  return 'amber'
}

export function formatHitRate(rate?: number): string | undefined {
  if (rate == null || !Number.isFinite(rate)) return undefined
  return `${(rate * 100).toFixed(1)}%`
}

export function formatReturnPct(rate?: number): string | undefined {
  if (rate == null || !Number.isFinite(rate)) return undefined
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export interface MergedComboCard {
  letter: string
  row: RunicComboStatusRow
  active?: RunicActiveCombo
  watch?: RunicNightlyResponse['watch_combos'][number]
  description?: string
  variables?: string[]
}

export function comboToStatusRow(c: MacroNamedCombo): RunicComboStatusRow {
  const row = c.combo_status_row
  const duration =
    c.duration_weeks != null
      ? `wk ${c.duration_weeks}${c.duration_bucket ? ` ${c.duration_bucket}` : ''}`
      : row?.duration
  return {
    combo: c.combo,
    name: c.name,
    status: c.status,
    direction: c.direction,
    duration,
    hit_rate_3m: row?.hit_rate_3m ?? formatHitRate(c.hit_rate_primary),
    avg_return_3m: row?.avg_return_3m ?? formatReturnPct(c.avg_return_primary),
  }
}

export function macroComboToActive(c: MacroNamedCombo): RunicActiveCombo | undefined {
  if (!c.is_active && c.status.toUpperCase() !== 'CONFIRMED') return undefined
  return {
    combo: c.combo,
    wk: c.duration_weeks ?? undefined,
    duration_weeks: c.duration_weeks ?? undefined,
    bucket: c.duration_bucket ?? undefined,
    status: c.status,
    episode_start: c.episode_start ?? undefined,
    confirmed_legs: c.confirmed_legs ?? undefined,
    hit_rate_primary: c.hit_rate_primary ?? undefined,
    avg_return_primary: c.avg_return_primary ?? undefined,
  }
}

export function mergeMacroComboCards(data: MacroCombosResponse): MergedComboCard[] {
  return data.combos.map((c) => ({
    letter: c.combo,
    row: comboToStatusRow(c),
    active: macroComboToActive(c),
    description: c.description,
    variables: c.variables,
    watch: c.is_watch
      ? {
          combo: c.combo,
          legs_confirmed: c.confirmed_legs?.length ?? 0,
          pending: c.variables.filter((v) => !c.confirmed_legs?.includes(v)).join(', ') || '—',
        }
      : undefined,
  }))
}

export function mergeComboCards(nightly: RunicNightlyResponse): MergedComboCard[] {
  const rows = nightly.combo_status_rows ?? []
  return rows.map((row) => ({
    letter: row.combo,
    row,
    active: nightly.active_combos.find((c) => c.combo === row.combo),
    watch: nightly.watch_combos.find((w) => w.combo === row.combo),
  }))
}

export function resolvedComboRowsFromMacro(data: MacroCombosResponse): RunicComboStatusRow[] {
  return data.combos
    .filter((c) => {
      const s = c.status.toUpperCase()
      return s === 'CANCELLED' || s === 'RESOLVED'
    })
    .map(comboToStatusRow)
    .slice(0, 2)
}

export function resolvedComboRows(nightly: RunicNightlyResponse): RunicComboStatusRow[] {
  return (nightly.combo_status_rows ?? [])
    .filter((r) => {
      const s = r.status.toUpperCase()
      return s === 'CANCELLED' || s === 'RESOLVED'
    })
    .slice(0, 2)
}
