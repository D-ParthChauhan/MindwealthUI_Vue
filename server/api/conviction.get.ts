import { loadConviction } from '../utils/mindwealth-data'
import { getMockConviction } from '../utils/conviction-mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableConviction } from '../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadConviction(), getMockConviction, getUnavailableConviction)
})
