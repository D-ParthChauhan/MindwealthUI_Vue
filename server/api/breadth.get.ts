import { loadBreadth } from '../utils/mindwealth-data'
import { getMockBreadth } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableBreadth } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadBreadth(), getMockBreadth, getUnavailableBreadth)
})
