import { fetchFromBackend } from '../../utils/backend'
import { getMockRunicCancelTracker } from '../../utils/runic-mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/combo/cancel_tracker')) ?? getMockRunicCancelTracker()
})
