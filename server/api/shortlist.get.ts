import { loadShortlist } from '../utils/mindwealth-data'
import { getMockShortlist } from '../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadShortlist()) ?? getMockShortlist()
})
