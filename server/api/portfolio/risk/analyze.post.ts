import type { PortfolioAnalyzeRequest } from '~/types/api'
import { analyzePortfolioHoldings } from '../../../utils/mindwealth-data'

export default defineEventHandler(async (event) => {
  const body = await readBody<PortfolioAnalyzeRequest>(event)
  if (!body?.holdings?.length) {
    throw createError({ statusCode: 400, message: 'holdings array is required' })
  }
  const result = await analyzePortfolioHoldings(body)
  if (!result) {
    throw createError({ statusCode: 502, message: 'Portfolio holdings analysis failed' })
  }
  return result
})
