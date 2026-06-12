import { loadMeta } from '../utils/mindwealth-data'
import { getMockMeta } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadMeta()) ?? getMockMeta()
})
