import { loadNewSignals } from '../../utils/mindwealth-data'
import { getMockSignalsNew } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableSignalsNew } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadNewSignals(), getMockSignalsNew, getUnavailableSignalsNew)
})
