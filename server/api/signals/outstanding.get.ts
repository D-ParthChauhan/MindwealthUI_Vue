import { loadOutstandingSignals } from '../../utils/mindwealth-data'
import { getMockSignalsOutstanding } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableSignalsOutstanding } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadOutstandingSignals(), getMockSignalsOutstanding, getUnavailableSignalsOutstanding)
})
