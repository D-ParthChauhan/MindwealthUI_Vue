import { loadRunicCancelTracker } from '../../utils/mindwealth-data'
import { getMockRunicCancelTracker } from '../../utils/runic-mock-data'

export default defineEventHandler(async () => {
  return (await loadRunicCancelTracker()) ?? getMockRunicCancelTracker()
})
