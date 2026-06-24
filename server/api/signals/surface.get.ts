import { loadSignalSurface, type SignalReportSlug } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableSignalSurface } from '../../utils/unavailable-data'

const REPORTS = new Set<SignalReportSlug>(['outstanding-signals', 'new-signals', 'all-signal'])

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const report = String(query.report ?? 'outstanding-signals') as SignalReportSlug
  const reportDate = query.report_date ? String(query.report_date) : undefined
  const slug = REPORTS.has(report) ? report : 'outstanding-signals'
  return resolveApiData(
    await loadSignalSurface(slug, reportDate),
    () => getUnavailableSignalSurface(slug),
    () => getUnavailableSignalSurface(slug),
  )
})
