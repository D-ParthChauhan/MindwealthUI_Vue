import { loadMacroSsiMultiplier } from '../../../utils/mindwealth-data'
import { resolveApiData } from '../../../utils/data-resolution'
import { getUnavailableMacroSsiMultiplier } from '../../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroSsiMultiplier(),
    getUnavailableMacroSsiMultiplier,
    getUnavailableMacroSsiMultiplier,
  )
})
