import type { TerminalPageConfig } from '~/constants/terminal-configs'

export function dashboardFunctionsGroup(
  groups: TerminalPageConfig['navGroups'],
): TerminalPageConfig['navGroups'][number] | undefined {
  return groups.find((g) => /functions/i.test(g.label))
}

export function dashboardFunctionNavIds(
  groups: TerminalPageConfig['navGroups'],
): Set<string> {
  return new Set(dashboardFunctionsGroup(groups)?.items.map((i) => i.id) ?? [])
}
