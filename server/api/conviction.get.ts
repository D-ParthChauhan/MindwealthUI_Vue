import { fetchFromBackend } from '../utils/backend'
import { getMockConviction } from '../utils/conviction-mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/conviction')) ?? getMockConviction()
})
