import { loadRunicVariables } from '../../utils/mindwealth-data'
import { getMockRunicVariables } from '../../utils/runic-mock-data'

export default defineEventHandler(async () => {
  return (await loadRunicVariables()) ?? getMockRunicVariables()
})
