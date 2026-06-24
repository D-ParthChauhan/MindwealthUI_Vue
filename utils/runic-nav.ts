import type { TerminalPageConfig } from '~/constants/terminal-configs'
import type { MacroCombosResponse, RunicComboStatusRow, RunicNightlyResponse } from '~/types/api'
import { comboNavDot, comboToStatusRow } from '~/utils/runic-combo-display'

function navItem(row: RunicComboStatusRow) {
  const sub =
    row.duration && row.duration !== '—'
      ? row.duration
      : [row.hit_rate_3m, row.avg_return_3m].filter(Boolean).join(' · ') || row.status
  return {
    id: `combo-${row.combo.toLowerCase()}`,
    label: `Combo ${row.combo} · ${row.name}`,
    sub,
    dot: comboNavDot(row.status, row.direction),
  }
}

export function buildMacroNavGroupsFromCombos(
  base: TerminalPageConfig['navGroups'],
  data: MacroCombosResponse,
): TerminalPageConfig['navGroups'] {
  const rows = data.combos.map(comboToStatusRow)
  const active = rows.filter((r) => {
    const s = r.status.toUpperCase()
    return s === 'ACTIVE' || s === 'CONFIRMED'
  })
  const watch = rows.filter((r) => r.status.toUpperCase() === 'WATCH')
  const resolved = rows
    .filter((r) => {
      const s = r.status.toUpperCase()
      return s === 'CANCELLED' || s === 'RESOLVED'
    })
    .slice(0, 2)

  const staticGroups = base.filter((g) => g.items.length === 0 && g.static)

  return [
    { label: 'Active Combos', items: active.map(navItem) },
    { label: 'Watch', items: watch.map(navItem) },
    { label: 'Recently Resolved', items: resolved.map(navItem) },
    ...staticGroups,
  ]
}

export function buildMacroNavGroups(
  base: TerminalPageConfig['navGroups'],
  nightly: RunicNightlyResponse,
): TerminalPageConfig['navGroups'] {
  const rows = nightly.combo_status_rows ?? []
  const active = rows.filter((r) => {
    const s = r.status.toUpperCase()
    return s === 'ACTIVE' || s === 'CONFIRMED'
  })
  const watch = rows.filter((r) => r.status.toUpperCase() === 'WATCH')
  const resolved = rows
    .filter((r) => {
      const s = r.status.toUpperCase()
      return s === 'CANCELLED' || s === 'RESOLVED'
    })
    .slice(0, 2)

  const staticGroups = base.filter((g) => g.items.length === 0 && g.static)

  return [
    {
      label: 'Active Combos',
      items: active.map(navItem),
    },
    {
      label: 'Watch',
      items: watch.map(navItem),
    },
    {
      label: 'Recently Resolved',
      items: resolved.map(navItem),
    },
    ...staticGroups,
  ]
}

export function defaultMacroNavIdFromCombos(data: MacroCombosResponse): string {
  const active = data.combos.find((c) => c.is_active)
  if (active) return `combo-${active.combo.toLowerCase()}`
  const watch = data.combos.find((c) => c.is_watch)
  if (watch) return `combo-${watch.combo.toLowerCase()}`
  return 'combo-f'
}

export function defaultMacroNavId(nightly: RunicNightlyResponse): string {
  const dominant = nightly.dominant_signal?.trim()
  if (dominant && dominant !== '—') {
    return `combo-${dominant.toLowerCase()}`
  }
  const first = nightly.combo_status_rows?.find((r) =>
    ['ACTIVE', 'CONFIRMED'].includes(r.status.toUpperCase()),
  )
  if (first) return `combo-${first.combo.toLowerCase()}`
  return 'combo-f'
}

export function comboLetterFromNavId(id: string): string | null {
  const m = /^combo-([a-g])$/i.exec(id)
  return m ? m[1].toUpperCase() : null
}
