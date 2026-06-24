import { searchPortfolioTickers } from '../../../utils/mindwealth-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q ?? '').trim()
  if (!q) {
    throw createError({ statusCode: 400, message: 'Query parameter q is required' })
  }
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20) || 20))
  const results = await searchPortfolioTickers(q, limit)
  if (results == null) {
    throw createError({ statusCode: 502, message: 'Portfolio ticker search failed' })
  }
  return results
})
