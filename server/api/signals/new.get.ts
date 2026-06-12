import { loadNewSignals } from '../../utils/mindwealth-data'
import { getMockSignalsNew } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadNewSignals()) ?? getMockSignalsNew()
})
