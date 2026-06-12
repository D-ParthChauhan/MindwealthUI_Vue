import { loadBreadth } from '../utils/mindwealth-data'
import { getMockBreadth } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadBreadth()) ?? getMockBreadth()
})
