import type { ApiDataSource } from '~/types/api'

export function isMockDataEnabled(): boolean {
  try {
    const config = useRuntimeConfig()
    if (config.useMockData === true) return true
  } catch {
    // outside Nuxt context
  }
  return process.env.NUXT_USE_MOCK_DATA === 'true'
}

type Sourced = { data_source?: ApiDataSource }

export function resolveApiData<T extends Sourced>(
  live: T | null | undefined,
  getMock: () => T,
  getUnavailable: () => T,
): T {
  if (live != null) {
    return { ...live, data_source: 'live' }
  }
  if (isMockDataEnabled()) {
    return { ...getMock(), data_source: 'mock' }
  }
  return { ...getUnavailable(), data_source: 'unavailable' }
}
