import { loadPortfolio } from '../utils/mindwealth-data'
import { getMockPortfolio } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailablePortfolio } from '../utils/unavailable-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const scenario = String(query.scenario ?? 'normal') as import('~/types/api').PortfolioScenario
  return resolveApiData(
    await loadPortfolio(scenario),
    getMockPortfolio,
    getUnavailablePortfolio,
  )
})
