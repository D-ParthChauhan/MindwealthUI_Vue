import { fetchFromBackend } from '../utils/backend'
import { getMockShortlist } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/shortlist')) ?? getMockShortlist()
})
