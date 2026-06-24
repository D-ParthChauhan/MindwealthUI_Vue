import { loadRunicAnalog } from '../../utils/mindwealth-data'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const raw = String(query.combos ?? '')
  const combos = raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)

  const result: Record<string, Awaited<ReturnType<typeof loadRunicAnalog>> & { data_source: 'live' }> = {}

  for (const combo of combos) {
    const data = await loadRunicAnalog(combo)
    if (data?.rows?.length) {
      result[combo] = { ...data, data_source: 'live' as const }
    }
  }

  return result
})
