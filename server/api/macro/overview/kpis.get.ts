import { loadMacroOverviewKpis } from '../../../utils/mindwealth-data'
import { resolveApiData } from '../../../utils/data-resolution'
import { getUnavailableMacroOverviewKpis } from '../../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroOverviewKpis(),
    getUnavailableMacroOverviewKpis,
    getUnavailableMacroOverviewKpis,
  )
})
