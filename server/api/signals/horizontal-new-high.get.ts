import { loadHorizontalNewHigh } from '../../utils/mindwealth-data'
import { getMockHorizontalNewHigh } from '../../utils/mock-data'

export default defineEventHandler(async () => {
  return (await loadHorizontalNewHigh()) ?? getMockHorizontalNewHigh()
})
