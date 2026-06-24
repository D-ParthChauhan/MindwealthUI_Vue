import { loadGateA2b } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableGateA2b } from '../../utils/unavailable-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reportDate = query.report_date ? String(query.report_date) : undefined
  return resolveApiData(
    await loadGateA2b(reportDate),
    getUnavailableGateA2b,
    getUnavailableGateA2b,
  )
})
