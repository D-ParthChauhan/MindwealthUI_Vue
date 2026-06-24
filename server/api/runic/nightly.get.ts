import { loadRunicNightly } from '../../utils/mindwealth-data'
import { getMockRunicNightly } from '../../utils/runic-mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableRunicNightly } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadRunicNightly(), getMockRunicNightly, getUnavailableRunicNightly)
})
