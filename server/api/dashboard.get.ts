import { loadDashboard } from '../utils/mindwealth-data'
import { getMockDashboard } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadDashboard()) ?? getMockDashboard()
})
