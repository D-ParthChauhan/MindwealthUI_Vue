import { loadPerformance } from '../utils/mindwealth-data'
import { getMockPerformance } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailablePerformance } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadPerformance(), getMockPerformance, getUnavailablePerformance)
})
