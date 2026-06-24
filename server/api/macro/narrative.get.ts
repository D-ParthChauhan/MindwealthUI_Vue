import { loadMacroNarrative } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableMacroNarrative } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroNarrative(),
    getUnavailableMacroNarrative,
    getUnavailableMacroNarrative,
  )
})
