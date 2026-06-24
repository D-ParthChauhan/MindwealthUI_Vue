import { loadRunicCancelTracker } from '../../utils/mindwealth-data'
import { getMockRunicCancelTracker } from '../../utils/runic-mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableRunicCancelTracker } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadRunicCancelTracker(), getMockRunicCancelTracker, getUnavailableRunicCancelTracker)
})
