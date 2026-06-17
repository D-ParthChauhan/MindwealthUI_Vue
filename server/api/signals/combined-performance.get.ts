import { loadCombinedPerformanceReport } from '../../utils/mindwealth-data'
import { getMockCombinedPerformanceReport } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadCombinedPerformanceReport()) ?? getMockCombinedPerformanceReport()
})
