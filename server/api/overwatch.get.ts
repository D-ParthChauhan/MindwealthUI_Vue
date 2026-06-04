import { fetchFromBackend } from '../utils/backend'
import { getMockOverwatch } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/overwatch')) ?? getMockOverwatch()
})
