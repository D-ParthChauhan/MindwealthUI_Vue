export function useAppMeta() {
  const { fetchMeta } = useApi()
  const { data, pending, error, refresh } = fetchMeta()

  const lastUpdated = computed(() => {
    const dt = data.value?.data_updated_at?.datetime
    if (!dt) return null
    try {
      return new Date(dt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dt
    }
  })

  const marketLabel = computed(() => data.value?.market_label ?? 'US Market')

  return { data, pending, error, refresh, lastUpdated, marketLabel }
}
