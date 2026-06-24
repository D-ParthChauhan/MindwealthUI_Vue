import { loadMonitoredTrades } from '../utils/mindwealth-data'
import { getMockMonitoredTrades } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableMonitoredTrades } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadMonitoredTrades(), getMockMonitoredTrades, getUnavailableMonitoredTrades)
})
