import { loadMacroRegime } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableMacroRegime } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroRegime(),
    getUnavailableMacroRegime,
    getUnavailableMacroRegime,
  )
})
