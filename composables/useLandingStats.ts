import type { PerformanceResponse, RunicNightlyResponse } from '~/types/api'
import { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH } from '~/constants/unavailable'
import { isApiUnavailable } from '~/utils/api-display'

function formatAggregate(
  data: PerformanceResponse | null | undefined,
  pending: boolean,
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  if (pending) return '…'
  if (!data || isApiUnavailable(data)) return UNAVAILABLE_FETCH
  if (value == null || !Number.isFinite(value) || value === 0) return UNAVAILABLE_COMPUTE
  return format(value)
}

export function useLandingStats() {
  const { data: performance, pending } = useFetch<PerformanceResponse>('/api/performance', {
    key: 'landing-performance',
  })

  const avgWinRate = computed(() =>
    formatAggregate(
      performance.value,
      pending.value,
      performance.value?.aggregates?.avg_win_rate,
      (n) => `${n}%`,
    ),
  )

  const avgCagr = computed(() =>
    formatAggregate(
      performance.value,
      pending.value,
      performance.value?.aggregates?.avg_cagr,
      (n) => `${n}%`,
    ),
  )

  const sharpeRatio = computed(() =>
    formatAggregate(
      performance.value,
      pending.value,
      performance.value?.aggregates?.avg_sharpe,
      (n) => n.toFixed(2),
    ),
  )

  const functionCount = computed(() =>
    formatAggregate(
      performance.value,
      pending.value,
      performance.value?.aggregates?.function_count,
      (n) => String(n),
    ),
  )

  const { data: nightly, pending: nightlyPending } = useFetch<RunicNightlyResponse>(
    '/api/runic/nightly',
    { key: 'landing-runic-nightly' },
  )

  const macroComboCount = computed(() => {
    if (nightlyPending.value) return '…'
    if (!nightly.value || isApiUnavailable(nightly.value)) return UNAVAILABLE_FETCH
    const count = nightly.value.combo_status_rows?.length
    if (count == null || count === 0) return UNAVAILABLE_COMPUTE
    return String(count)
  })

  return {
    pending,
    avgWinRate,
    avgCagr,
    sharpeRatio,
    functionCount,
    macroComboCount,
  }
}
