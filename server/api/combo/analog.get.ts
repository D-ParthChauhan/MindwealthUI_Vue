import { fetchFromBackend } from '../../utils/backend'
import { getMockRunicAnalog } from '../../utils/runic-mock-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const combo = String(query.combo ?? 'C').toUpperCase()
  const fromBackend = await fetchFromBackend(`/api/combo/analog?combo=${combo}`)
  if (fromBackend) return fromBackend
  const mock = getMockRunicAnalog(combo)
  if (!mock) {
    throw createError({ statusCode: 404, statusMessage: `No analog data for combo ${combo}` })
  }
  return mock
})
