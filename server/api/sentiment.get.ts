import { loadSentiment } from '../utils/mindwealth-data'
import { getMockSentiment } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableSentiment } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadSentiment(), getMockSentiment, getUnavailableSentiment)
})
