import { loadDashboard } from '../utils/mindwealth-data'
import { getMockDashboard } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableDashboard } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadDashboard(), getMockDashboard, getUnavailableDashboard)
})
