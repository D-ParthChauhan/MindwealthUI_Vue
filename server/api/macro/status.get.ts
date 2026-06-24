import { loadMacroStatus } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableMacroStatus } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroStatus(),
    getUnavailableMacroStatus,
    getUnavailableMacroStatus,
  )
})
