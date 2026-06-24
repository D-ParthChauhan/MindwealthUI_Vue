import type { RunicMacroTab } from '~/constants/runic-macro-data'
import { comboLetterFromNavId } from '~/utils/runic-nav'

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
    const letter = comboLetterFromNavId(id)
    if (!letter) return
    if (prev === id) return
    jumpToCombo(letter)
  })

  return { activeTab, highlightCombo, switchTab, jumpToCombo }
}
