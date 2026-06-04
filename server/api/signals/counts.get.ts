import { fetchFromBackend } from '../../utils/backend'
import { getMockSignalCounts } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/signals/counts')) ?? getMockSignalCounts()
})
