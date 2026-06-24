import { loadMacroSsiSummary } from '../../../utils/mindwealth-data'
import { resolveApiData } from '../../../utils/data-resolution'
import { getUnavailableMacroSsiSummary } from '../../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroSsiSummary(),
    getUnavailableMacroSsiSummary,
    getUnavailableMacroSsiSummary,
  )
})
