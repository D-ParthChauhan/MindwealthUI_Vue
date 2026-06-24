import { loadSignalCheckDegradation } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableCheckDegradation } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadSignalCheckDegradation(),
    getUnavailableCheckDegradation,
    getUnavailableCheckDegradation,
  )
})
