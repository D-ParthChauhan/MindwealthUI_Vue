import type { RunicMacroTab } from '~/constants/runic-macro-data'

const COMBO_NAV_MAP: Record<string, string> = {
  'combo-c': 'C',
  'combo-d': 'D',
  'combo-e': 'E',
  'combo-f': 'F',
  'combo-b': 'B',
  'combo-g': 'G',
}

export function useRunicMacroPage() {
  const activeTab = useState<RunicMacroTab>('runic-macro-tab', () => 'overview')
  const highlightCombo = useState<string | null>('runic-highlight-combo', () => null)

  function switchTab(id: RunicMacroTab) {
    activeTab.value = id
  }

  function jumpToCombo(letter: string) {
    activeTab.value = 'combos'
    highlightCombo.value = letter
    if (import.meta.client) {
      nextTick(() => {
        const el = document.getElementById(`cc-${letter}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          highlightCombo.value = null
        }, 2000)
      })
    }
  }

  const navActiveId = useState<string>('terminal-nav-id')

  watch(navActiveId, (id, prev) => {
    const letter = COMBO_NAV_MAP[id]
    if (!letter) return
    if (!prev || !COMBO_NAV_MAP[prev] || prev === id) return
    jumpToCombo(letter)
  })

  return { activeTab, highlightCombo, switchTab, jumpToCombo }
}
