import { loadRunicAnalog } from '../../utils/mindwealth-data'
import { getUnavailableRunicAnalog } from '../../utils/unavailable-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const combo = String(query.combo ?? 'C').toUpperCase()

  const fromBackend = await loadRunicAnalog(combo)
  if (fromBackend?.rows?.length) {
    return { ...fromBackend, data_source: 'live' as const }
  }

  return { ...getUnavailableRunicAnalog(combo), data_source: 'unavailable' as const }
})
