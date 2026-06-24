import { loadShortlist } from '../utils/mindwealth-data'
import { getMockShortlist } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableShortlist } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadShortlist(), getMockShortlist, getUnavailableShortlist)
})
