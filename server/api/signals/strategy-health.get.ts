import { loadStrategyHealth } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableStrategyHealth } from '../../utils/unavailable-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reportDate = query.report_date ? String(query.report_date) : undefined
  return resolveApiData(
    await loadStrategyHealth(reportDate),
    getUnavailableStrategyHealth,
    getUnavailableStrategyHealth,
  )
})
