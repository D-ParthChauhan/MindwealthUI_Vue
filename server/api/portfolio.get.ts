import { fetchFromBackend } from '../utils/backend'
import { getMockPortfolio } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/portfolio')) ?? getMockPortfolio()
})
