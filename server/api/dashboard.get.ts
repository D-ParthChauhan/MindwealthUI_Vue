import { fetchFromBackend } from '../utils/backend'
import { getMockDashboard } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/dashboard')) ?? getMockDashboard()
})
