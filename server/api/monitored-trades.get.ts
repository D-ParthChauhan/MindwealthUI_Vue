import { loadMonitoredTrades } from '../utils/mindwealth-data'
import { getMockMonitoredTrades } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadMonitoredTrades()) ?? getMockMonitoredTrades()
})
