import { fetchFromBackend } from '../utils/backend'
import { getMockSentiment } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/sentiment')) ?? getMockSentiment()
})
