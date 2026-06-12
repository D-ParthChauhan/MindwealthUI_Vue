import { loadPortfolio } from '../utils/mindwealth-data'
import { getMockPortfolio } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadPortfolio()) ?? getMockPortfolio()
})
