import { loadHorizontalNewHigh } from '../../utils/mindwealth-data'
import { getMockHorizontalNewHigh } from '../../utils/mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableHorizontalNewHigh } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadHorizontalNewHigh(), getMockHorizontalNewHigh, getUnavailableHorizontalNewHigh)
})
