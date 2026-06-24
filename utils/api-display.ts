import { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH } from '~/constants/unavailable'
import type { ApiDataSource } from '~/types/api'

export type WithDataSource = { data_source?: ApiDataSource }

export function isApiUnavailable(data: WithDataSource | null | undefined): boolean {
  return data?.data_source === 'unavailable'
}

export function isApiMock(data: WithDataSource | null | undefined): boolean {
  return data?.data_source === 'mock'
}

export function apiDisplay(
  data: WithDataSource | null | undefined,
  value: string | number | null | undefined,
  kind: 'fetch' | 'compute' = 'fetch',
): string {
  if (isApiUnavailable(data)) {
    return kind === 'compute' ? UNAVAILABLE_COMPUTE : UNAVAILABLE_FETCH
  }
  if (value == null || value === '') return '—'
  return String(value)
}

export function apiPercent(
  data: WithDataSource | null | undefined,
  value: number | null | undefined,
  kind: 'fetch' | 'compute' = 'fetch',
): string {
  if (isApiUnavailable(data)) {
    return kind === 'compute' ? UNAVAILABLE_COMPUTE : UNAVAILABLE_FETCH
  }
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value}%`
}
