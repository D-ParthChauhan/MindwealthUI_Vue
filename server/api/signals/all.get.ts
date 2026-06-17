import { loadAllSignals } from '../../utils/mindwealth-data'
import { getMockAllSignals } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadAllSignals()) ?? getMockAllSignals()
})
