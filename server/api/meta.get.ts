import { loadMeta } from '../utils/mindwealth-data'
import { getMockMeta } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableMeta } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadMeta(), getMockMeta, getUnavailableMeta)
})
