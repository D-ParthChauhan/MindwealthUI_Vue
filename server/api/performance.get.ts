import { loadPerformance } from '../utils/mindwealth-data'
import { getMockPerformance } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadPerformance()) ?? getMockPerformance()
})
