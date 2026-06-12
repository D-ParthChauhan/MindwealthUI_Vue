import { loadRunicAnalog } from '../../utils/mindwealth-data'
import { getMockRunicAnalog } from '../../utils/runic-mock-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const combo = String(query.combo ?? 'C').toUpperCase()

  const fromBackend = await loadRunicAnalog(combo)
  if (fromBackend?.rows?.length) return fromBackend

  const mock = getMockRunicAnalog(combo)
  if (!mock) {
    throw createError({ statusCode: 404, statusMessage: `No analog data for combo ${combo}` })
  }
  return mock
})
