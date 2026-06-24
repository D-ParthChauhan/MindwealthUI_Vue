import { loadMacroPersistence } from '../../utils/mindwealth-data'
import { resolveApiData } from '../../utils/data-resolution'
import { getUnavailableMacroPersistence } from '../../utils/unavailable-data'

export default defineEventHandler(async () => {
  return resolveApiData(
    await loadMacroPersistence(),
    getUnavailableMacroPersistence,
    getUnavailableMacroPersistence,
  )
})
