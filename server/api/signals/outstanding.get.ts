import { fetchFromBackend } from '../../utils/backend'
import { getMockSignalsOutstanding } from '../../utils/mock-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = `/api/signals/outstanding${Object.keys(query).length ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : ''}`
  return (await fetchFromBackend(path)) ?? getMockSignalsOutstanding()
})
