import type {
  BreadthRow,
  CombinedPerformanceReportRow,
  FunctionSidebarItem,
  PerformanceRow,
} from '~/types/api'
import { findByFunctionName, matchesFunctionName } from '~/utils/function-match'

export function useFunctionPopup() {
  const open = useState<boolean>('function-popup-open', () => false)
  const selectedLabel = useState<string | null>('function-popup-label', () => null)

  const { data: dashboard } = useFetch<import('~/types/api').DashboardResponse>('/api/dashboard', {
    key: 'api-dashboard',
  })
  const { data: performance, pending: performancePending } = useFetch<
    import('~/types/api').PerformanceResponse
  >('/api/performance', { key: 'api-performance' })
  const { data: combinedPerf, pending: combinedPending } = useFetch<
    import('~/types/api').CombinedPerformanceReportResponse
  >('/api/signals/combined-performance', { key: 'api-signals-combined-performance' })
  const { data: breadth } = useFetch<import('~/types/api').BreadthResponse>('/api/breadth', {
    key: 'api-breadth',
  })

  const sidebarItem = computed((): FunctionSidebarItem | null => {
    const label = selectedLabel.value
    if (!label) return null
    const items = dashboard.value?.functions_sidebar ?? []
    return findByFunctionName(items, label, 'name') ?? null
  })

  const performanceRows = computed((): PerformanceRow[] => {
    const label = selectedLabel.value
    if (!label) return []
    return (performance.value?.rows ?? []).filter((row) =>
      matchesFunctionName(label, row.function),
    )
  })

  const breadthRow = computed((): BreadthRow | null => {
    const label = selectedLabel.value
    if (!label) return null
    return findByFunctionName(breadth.value?.rows ?? [], label, 'function') ?? null
  })

  const combinedRows = computed((): CombinedPerformanceReportRow[] => {
    const label = selectedLabel.value
    if (!label) return []
    const rows = [
      ...(combinedPerf.value?.forward_testing ?? []),
      ...(combinedPerf.value?.latest_performance ?? []),
    ]
    return rows.filter((row) => matchesFunctionName(label, row.strategy))
  })

  const displayRows = computed((): Array<Record<string, unknown>> => {
    if (combinedRows.value.length > 0) {
      return combinedRows.value.map((row) => ({ ...row }))
    }
    return performanceRows.value.map((row) => ({ ...row }))
  })

  const dataPending = computed(() => performancePending.value || combinedPending.value)

  const displayName = computed(
    () => sidebarItem.value?.name ?? selectedLabel.value ?? 'Function',
  )

  function show(label: string) {
    selectedLabel.value = label
    open.value = true
  }

  function close() {
    open.value = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value) close()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return {
    open,
    selectedLabel,
    displayName,
    sidebarItem,
    displayRows,
    breadthRow,
    dataPending,
    dashboard,
    combinedPerf,
    show,
    close,
  }
}
