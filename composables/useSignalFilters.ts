import {
  SIGNAL_FUNCTION_FILTER_IDS,
  SIGNAL_VIEW_NAV_IDS,
  type SignalIntervalFilter,
} from '~/utils/signal-filters'

export function useSignalFilters() {
  const selectedFunctionIds = useState<string[]>('signal-function-filters', () => [])
  const intervalFilter = useState<SignalIntervalFilter>('signal-interval-filter', () => 'all')

  const selectedFunctionSet = computed(() => new Set(selectedFunctionIds.value))

  function toggleFunctionFilter(id: string) {
    if (!SIGNAL_FUNCTION_FILTER_IDS.has(id)) return
    const current = selectedFunctionIds.value
    if (current.includes(id)) {
      selectedFunctionIds.value = current.filter((x) => x !== id)
    } else {
      selectedFunctionIds.value = [...current, id]
    }
  }

  function isFunctionFilterActive(id: string) {
    return selectedFunctionIds.value.includes(id)
  }

  const multiActiveIds = computed(() => selectedFunctionIds.value)

  /** If legacy nav id was a function filter, restore a signal view id */
  function ensureSignalViewNav(navActiveId: Ref<string>) {
    if (SIGNAL_VIEW_NAV_IDS.has(navActiveId.value)) return
    if (SIGNAL_FUNCTION_FILTER_IDS.has(navActiveId.value)) {
      navActiveId.value = 'outstanding'
    }
  }

  return {
    selectedFunctionIds: selectedFunctionSet,
    intervalFilter,
    toggleFunctionFilter,
    isFunctionFilterActive,
    multiActiveIds,
    ensureSignalViewNav,
  }
}
