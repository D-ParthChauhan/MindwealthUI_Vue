import { loadPortfolioRisk } from '../../utils/mindwealth-data'
import { parsePortfolioScenario } from '../../utils/portfolio-mappers'
import { getUnavailablePortfolioRisk } from '../../utils/unavailable-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const scenario = parsePortfolioScenario(query.scenario)
  const live = await loadPortfolioRisk(scenario)
  if (live) return live
  return getUnavailablePortfolioRisk()
})
