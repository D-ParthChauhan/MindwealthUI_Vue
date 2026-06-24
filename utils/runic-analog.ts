import type { RunicAnalogResponse, RunicAnalogRow } from '~/types/api'

function isSummaryRow(row: RunicAnalogRow): boolean {
  return row.date === 'Median'
}

export function rowHasResolvedReturns(row: RunicAnalogRow): boolean {
  return row.returns.some((r) => r.cls !== 'tbd' && r.val !== 'TBD')
}

export function panelHasResolvedReturns(panel: RunicAnalogResponse): boolean {
  return panel.rows.some((row) => !isSummaryRow(row) && rowHasResolvedReturns(row))
}

export function hasDisplayableAnalogData(
  panels: Array<RunicAnalogResponse | null | undefined>,
): boolean {
  return panels.some((panel) => panel != null && panelHasResolvedReturns(panel))
}
