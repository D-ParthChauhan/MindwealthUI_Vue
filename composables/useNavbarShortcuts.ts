import { MAIN_TABS } from '~/constants/navigation'

function shouldIgnoreHotkeys(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

export function useNavbarShortcuts() {
  const route = useRoute()
  const isBound = useState('navbar-shortcuts-bound', () => false)

  onMounted(() => {
    if (isBound.value) return

    const isMac = navigator.platform.toLowerCase().includes('mac')

    const handler = (event: KeyboardEvent) => {
      if (shouldIgnoreHotkeys(event.target)) return

      const hasValidModifiers = isMac
        ? event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey
        : event.altKey && !event.ctrlKey && !event.metaKey
      if (!hasValidModifiers) return

      const key = event.key.toLowerCase()
      const tab = MAIN_TABS.find((item) => item.shortcut.toLowerCase() === key)
      if (!tab || tab.path === route.path) return
      event.preventDefault()
      navigateTo(tab.path)
    }

    window.addEventListener('keydown', handler)
    isBound.value = true

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handler)
      isBound.value = false
    })
  })
}
