export type TabId =
  | 'dashboard'
  | 'signals'
  | 'macro'
  | 'sentiment'
  | 'conviction'
  | 'portfolio'
  | 'overwatch'

export interface MainTab {
  id: TabId
  label: string
  path: string
  shortcut: string
  shortcutDisplay: string
}

export const MAIN_TABS: MainTab[] = [
  { id: 'dashboard', label: 'DASHBOARD', path: '/dashboard', shortcut: 'd', shortcutDisplay: 'Alt+D' },
  { id: 'signals', label: 'SIGNALS', path: '/signals', shortcut: 's', shortcutDisplay: 'Alt+S' },
  { id: 'macro', label: 'MACRO · RUNIC', path: '/macro', shortcut: 'm', shortcutDisplay: 'Alt+M' },
  { id: 'sentiment', label: 'SUPER SENTIMENT', path: '/sentiment', shortcut: 'S', shortcutDisplay: 'Alt+Shift+S' },
  { id: 'conviction', label: 'CONVICTION', path: '/conviction', shortcut: 'c', shortcutDisplay: 'Alt+C' },
  { id: 'portfolio', label: 'PORTFOLIO', path: '/portfolio', shortcut: 'p', shortcutDisplay: 'Alt+P' },
  { id: 'overwatch', label: 'OVERWATCH', path: '/overwatch', shortcut: 'o', shortcutDisplay: 'Alt+O' },
]

export function tabIdFromPath(path: string): TabId | null {
  const tab = MAIN_TABS.find((t) => path.startsWith(t.path))
  return tab?.id ?? null
}
