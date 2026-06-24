import { loadMacroDataFreshness } from '../../../utils/mindwealth-data'
import { resolveApiData } from '../../../utils/data-resolution'
import { getUnavailableMacroDataFreshness } from '../../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroDataFreshness(),
    getUnavailableMacroDataFreshness,
    getUnavailableMacroDataFreshness,
  )
})
