export const NAMED_COMBO_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

export type RunicMacroTab =
  | 'overview'
  | 'variables'
  | 'combos'
  | 'cancel'
  | 'analog'
  | 'brief'

export const RUNIC_MACRO_TABS: Array<{ id: RunicMacroTab; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'variables', label: '12 VARIABLES' },
  { id: 'combos', label: '7 NAMED COMBOS' },
  { id: 'cancel', label: 'COMBO TRACKER' },
  { id: 'analog', label: 'ANALOG TABLES' },
  { id: 'brief', label: 'NIGHTLY BRIEF' },
]
