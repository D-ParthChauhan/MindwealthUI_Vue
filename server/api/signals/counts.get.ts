import { loadSignalCounts } from '../../utils/mindwealth-data'
import { getMockSignalCounts } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadSignalCounts()) ?? getMockSignalCounts()
})
