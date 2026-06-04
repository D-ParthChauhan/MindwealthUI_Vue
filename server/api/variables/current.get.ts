import { fetchFromBackend } from '../../utils/backend'
import { getMockRunicVariables } from '../../utils/runic-mock-data'

export default defineEventHandler(async () => {
  return (await fetchFromBackend('/api/variables/current')) ?? getMockRunicVariables()
})
