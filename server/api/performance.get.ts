import { fetchFromBackend } from '../utils/backend'
import { getMockPerformance } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/performance')) ?? getMockPerformance()
})
