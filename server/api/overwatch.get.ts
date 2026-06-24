import { loadOverwatch, loadRunicNightly } from '../utils/mindwealth-data'
import { getMockOverwatch } from '../utils/mock-data'
import { resolveApiData } from '../utils/data-resolution'
import { getUnavailableOverwatch } from '../utils/unavailable-data'
import { buildOverwatchPanelPayload, runicPanelAlertFromNightly } from '../utils/overwatch-panel'

export default defineEventHandler(async () => {
  const raw = resolveApiData(await loadOverwatch(), getMockOverwatch, getUnavailableOverwatch)
  const nightly = await loadRunicNightly()
  const runicAlert =
    nightly?.dominant_signal && nightly.dominant_signal !== '—'
      ? runicPanelAlertFromNightly(nightly)
      : null
  const panel = buildOverwatchPanelPayload(raw, {
    runicAlert,
    includeMockRunic: false,
    unavailable: raw.data_source === 'unavailable',
  })
  return { ...raw, ...panel }
})
