import { UNAVAILABLE_COMPUTE, UNAVAILABLE_FETCH } from '~/constants/unavailable'
import type { PortfolioResponse } from '~/types/api'
import { isApiUnavailable } from '~/utils/api-display'

export function pfUsd(
  data: PortfolioResponse | null | undefined,
  value: number | null | undefined,
): string {
  if (isApiUnavailable(data)) return UNAVAILABLE_FETCH
  if (value == null || !Number.isFinite(value)) return UNAVAILABLE_COMPUTE
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function pfPct(
  data: PortfolioResponse | null | undefined,
  value: number | null | undefined,
): string {
  if (isApiUnavailable(data)) return UNAVAILABLE_FETCH
  if (value == null || !Number.isFinite(value)) return UNAVAILABLE_COMPUTE
  return `${value}%`
}

export function pfNum(
  data: PortfolioResponse | null | undefined,
  value: number | null | undefined,
  digits = 2,
): string {
  if (isApiUnavailable(data)) return UNAVAILABLE_FETCH
  if (value == null || !Number.isFinite(value)) return UNAVAILABLE_COMPUTE
  return value.toFixed(digits)
}

export function pfText(
  data: PortfolioResponse | null | undefined,
  value: string | null | undefined,
): string {
  if (isApiUnavailable(data)) return UNAVAILABLE_FETCH
  if (value == null || value === '') return UNAVAILABLE_COMPUTE
  return value
}

export function bqClass(score: number | null): string {
  if (score == null) return 'pf-bq-na'
  if (score >= 8) return 'pf-bq-hi'
  if (score >= 5) return 'pf-bq-mid'
  if (score >= 2) return 'pf-bq-lo'
  return 'pf-bq-block'
}

export function pnlClass(value: number | null): string {
  if (value == null) return ''
  if (value > 0) return 'g'
  if (value < 0) return 'r'
  return ''
}

export function flagClass(id: string): string {
  switch (id) {
    case 'MULTI-SIG': return 'f-ms'
    case 'FD+': return 'f-fdp'
    case 'FD−': return 'f-fdn'
    case 'YIELD TRAP': return 'f-yt'
    case 'DRAWDOWN': return 'f-dd'
    default: return 'f-ms'
  }
}
