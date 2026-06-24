import { loadMacroCombos } from '../../utils/mindwealth-data'
import { getMockMacroCombos } from '../../utils/runic-mock-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableMacroCombos } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroCombos(),
    getMockMacroCombos,
    getUnavailableMacroCombos,
  )
})
