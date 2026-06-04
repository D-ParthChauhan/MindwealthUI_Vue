import { fetchFromBackend } from '../utils/backend'
import { getMockBreadth } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/breadth')) ?? getMockBreadth()
})
