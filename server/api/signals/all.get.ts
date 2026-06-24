import { loadAllSignals } from '../../utils/mindwealth-data'
import { getMockAllSignals } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableAllSignals } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadAllSignals(), getMockAllSignals, getUnavailableAllSignals)
})
