import { loadOverwatch, loadRunicNightly } from '../utils/mindwealth-data'
import { getMockOverwatch } from '../utils/mock-data'
import { buildOverwatchPanelPayload, runicPanelAlertFromNightly } from '../utils/overwatch-panel'

export default defineEventHandler(async () => {
  const raw = (await loadOverwatch()) ?? getMockOverwatch()
  const nightly = await loadRunicNightly()
  const runicAlert = nightly?.dominant_signal
    ? runicPanelAlertFromNightly(nightly)
    : null
  const panel = buildOverwatchPanelPayload(raw, { runicAlert })
  return { ...raw, ...panel }
})
