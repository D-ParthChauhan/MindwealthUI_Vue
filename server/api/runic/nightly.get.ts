import { loadRunicNightly } from '../../utils/mindwealth-data'
import { getMockRunicNightly } from '../../utils/runic-mock-data'

export default defineEventHandler(async () => {
  return (await loadRunicNightly()) ?? getMockRunicNightly()
})
