const API_PREFIX = '/api/v1'

type OverlayFileResult = {
  source_file?: string
  row_count?: number
  summary?: Record<string, unknown>
  records: Record<string, unknown>[]
}

const overlayCache = new Map<string, { expires: number; data: OverlayFileResult }>()
const OVERLAY_CACHE_MS = 45_000

function runtime() {
  const config = useRuntimeConfig()
  return {
    base: (config.apiBaseUrl as string || '').replace(/\/$/, ''),
    apiKey: (config.apiKey as string) || '',
  }
}

export function isBackendConfigured(): boolean {
  return Boolean(runtime().base)
}

export function apiHeaders(): Record<string, string> {
  const { apiKey } = runtime()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey) headers['X-API-Key'] = apiKey
  return headers
}

export async function mindwealthFetch<T>(
  path: string,
  options?: Parameters<typeof $fetch>[1],
): Promise<T | null> {
  const { base } = runtime()
  if (!base) return null

  const normalized = path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
  const url = `${base}${normalized}`

  try {
    return (await $fetch(url, {
      ...options,
      headers: { ...apiHeaders(), ...(options?.headers as Record<string, string> | undefined) },
    })) as T
  } catch (err) {
    console.warn(`[mindwealth] ${options?.method ?? 'GET'} ${normalized}:`, err)
    return null
  }
}

export async function fetchHealth() {
  return mindwealthFetch<{ status: string; version?: string }>('/health')
}

export async function fetchOverlayFile(
  reportName: string,
  reportDate?: string,
): Promise<OverlayFileResult | null> {
  const cacheKey = `${reportDate ?? 'latest'}:${reportName}`
  const hit = overlayCache.get(cacheKey)
  if (hit && hit.expires > Date.now()) return hit.data

  const body: Record<string, string> = { report_name: reportName }
  if (reportDate) body.report_date = reportDate

  const data = await mindwealthFetch<OverlayFileResult>('/conviction/signals/overlay-file', {
    method: 'POST',
    body,
  })
  if (data?.records) {
    overlayCache.set(cacheKey, { expires: Date.now() + OVERLAY_CACHE_MS, data })
  }
  return data
}

export async function fetchLatestOverlayDate(): Promise<string | null> {
  const dates = await mindwealthFetch<string[]>('/conviction/overlays/dates')
  if (!dates?.length) return null
  return dates[dates.length - 1] ?? null
}

export { API_PREFIX }
