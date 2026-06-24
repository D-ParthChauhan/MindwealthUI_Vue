import type {
  MacroDataFreshnessResponse,
  MacroVariableFreshness,
  RunicVariableRow,
  RunicVariablesResponse,
} from '~/types/api'

function freshnessByVariable(
  dashboard: MacroVariableFreshness[],
): Map<string, MacroVariableFreshness> {
  const map = new Map<string, MacroVariableFreshness>()
  for (const row of dashboard) {
    map.set(row.variable.toUpperCase(), row)
  }
  return map
}

export function enrichVariablesWithFreshness(
  variables: RunicVariablesResponse | null | undefined,
  freshness: MacroDataFreshnessResponse | null | undefined,
): RunicVariablesResponse | null | undefined {
  if (!variables?.variables?.length || !freshness?.variables_dashboard?.length) {
    return variables
  }

  const byVar = freshnessByVariable(freshness.variables_dashboard)
  const enriched: RunicVariableRow[] = variables.variables.map((row) => {
    const fresh = byVar.get(row.name.toUpperCase())
    if (!fresh) return row

    const noteParts: string[] = []
    if (fresh.source_note) noteParts.push(fresh.source_note)
    if (fresh.lag_days != null) noteParts.push(`Lag ${fresh.lag_days}d`)
    else if (fresh.source_date) noteParts.push(`As of ${fresh.source_date}`)
    if (fresh.expected_source_date) noteParts.push(`Expected ${fresh.expected_source_date}`)
    if (fresh.stale) noteParts.push('Stale')

    const mergedNote = noteParts.length ? noteParts.join(' · ') : row.note

    return {
      ...row,
      note: mergedNote,
      note_color: fresh.stale ? 'var(--amber)' : row.note_color,
      lag_days: fresh.lag_days,
      source_date: fresh.source_date,
      expected_source_date: fresh.expected_source_date,
      stale: fresh.stale,
      row_highlight: row.row_highlight || Boolean(fresh.stale),
    }
  })

  return { ...variables, variables: enriched }
}
