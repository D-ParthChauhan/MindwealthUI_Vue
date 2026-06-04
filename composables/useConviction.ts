import type { ConvictionResponse } from '~/types/conviction'

export function useConviction() {
  return useFetch<ConvictionResponse>('/api/conviction', { key: 'api-conviction' })
}
