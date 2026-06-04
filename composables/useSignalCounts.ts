export function useSignalCounts() {
  const { fetchSignalCounts } = useApi()
  const { data, pending, error, refresh } = fetchSignalCounts()

  const counts = computed(() => data.value ?? null)

  return { counts, pending, error, refresh }
}
