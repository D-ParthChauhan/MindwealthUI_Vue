import { loadCombinedPerformanceReport } from '../../utils/mindwealth-data'
import { getMockCombinedPerformanceReport } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableCombinedPerformanceReport } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadCombinedPerformanceReport(),
    getMockCombinedPerformanceReport,
    getUnavailableCombinedPerformanceReport,
  )
})
