import { loadPortfolio } from '../utils/mindwealth-data'
import { getMockPortfolio } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailablePortfolio } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadPortfolio(), getMockPortfolio, getUnavailablePortfolio)
})
