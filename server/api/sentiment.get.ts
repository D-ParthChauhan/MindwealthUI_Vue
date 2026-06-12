import { loadSentiment } from '../utils/mindwealth-data'
import { getMockSentiment } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadSentiment()) ?? getMockSentiment()
})
