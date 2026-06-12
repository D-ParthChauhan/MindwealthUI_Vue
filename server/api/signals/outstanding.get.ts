import { loadOutstandingSignals } from '../../utils/mindwealth-data'
import { getMockSignalsOutstanding } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadOutstandingSignals()) ?? getMockSignalsOutstanding()
})
