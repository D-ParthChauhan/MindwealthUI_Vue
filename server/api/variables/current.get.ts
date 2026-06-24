import { loadRunicVariables } from '../../utils/mindwealth-data'
import { getMockRunicVariables } from '../../utils/runic-mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableRunicVariables } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(await loadRunicVariables(), getMockRunicVariables, getUnavailableRunicVariables)
})
