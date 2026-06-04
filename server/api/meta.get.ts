import { fetchFromBackend } from '../utils/backend'
import { getMockMeta } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/meta')) ?? getMockMeta()
})
