import { fetchFromBackend } from '../utils/backend'
import { getMockMonitoredTrades } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/monitored-trades')) ?? getMockMonitoredTrades()
})
