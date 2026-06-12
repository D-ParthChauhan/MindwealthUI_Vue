import { loadConviction } from '../utils/mindwealth-data'
import { getMockConviction } from '../utils/conviction-mock-data'

export default defineEventHandler(async () => {
  return (await loadConviction()) ?? getMockConviction()
})
