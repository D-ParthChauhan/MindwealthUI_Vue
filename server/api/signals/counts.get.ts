import { loadSignalCounts } from '../../utils/mindwealth-data'
import { getMockSignalCounts } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableSignalCounts } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadSignalCounts(), getMockSignalCounts, getUnavailableSignalCounts)
})
