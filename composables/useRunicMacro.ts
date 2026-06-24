import type {
  MacroCombosResponse,
  MacroDataFreshnessResponse,
  MacroNarrativeResponse,
  MacroOverviewKpisResponse,
  MacroPersistenceResponse,
  MacroRegimeResponse,
  MacroSsiSummaryResponse,
  MacroStatusResponse,
  RunicAnalogResponse,
  RunicCancelTrackerResponse,
  RunicNightlyResponse,
  RunicVariablesResponse,
} from '~/types/api'
import { NAMED_COMBO_LETTERS } from '~/constants/runic-macro-data'
import { enrichVariablesWithFreshness } from '~/utils/macro-variables'

export function useRunicMacro() {
  const { data: nightly, pending: nightlyPending } = useFetch<RunicNightlyResponse>('/api/runic/nightly', {
    key: 'runic-nightly',
  })

  const { data: macroStatus } = useFetch<MacroStatusResponse>('/api/macro/status', {
    key: 'macro-status',
  })

  const { data: overviewKpis } = useFetch<MacroOverviewKpisResponse>('/api/macro/overview/kpis', {
    key: 'macro-overview-kpis',
  })

  const { data: regime } = useFetch<MacroRegimeResponse>('/api/macro/regime', {
    key: 'macro-regime',
  })

  const { data: combos } = useFetch<MacroCombosResponse>('/api/macro/combos', {
    key: 'macro-combos',
  })

  const { data: narrative } = useFetch<MacroNarrativeResponse>('/api/macro/narrative', {
    key: 'macro-narrative',
  })

  const { data: persistence } = useFetch<MacroPersistenceResponse>('/api/macro/persistence', {
    key: 'macro-persistence',
  })

  const { data: dataFreshness } = useFetch<MacroDataFreshnessResponse>('/api/macro/data/freshness', {
    key: 'macro-data-freshness',
  })

  const { data: ssiSummary } = useFetch<MacroSsiSummaryResponse>('/api/macro/ssi/summary', {
    key: 'macro-ssi-summary',
  })

  const { data: variablesRaw } = useFetch<RunicVariablesResponse>('/api/variables/current', {
    key: 'runic-variables',
  })

  const variables = computed(() =>
    enrichVariablesWithFreshness(variablesRaw.value, dataFreshness.value),
  )

  const { data: cancelTracker } = useFetch<RunicCancelTrackerResponse>('/api/combo/cancel_tracker', {
    key: 'runic-cancel-tracker',
  })

  const analogLetters = computed(() => [...NAMED_COMBO_LETTERS])

  const analogKey = computed(() => analogLetters.value.join(','))

  const { data: analogPanels, pending: analogPending } = useFetch<Record<string, RunicAnalogResponse>>(
    () => `/api/combo/analog-batch?combos=${encodeURIComponent(analogKey.value)}`,
    {
      key: 'runic-analog-batch',
      watch: [analogKey],
      immediate: true,
      default: () => ({}),
    },
  )

  return {
    nightly,
    nightlyPending,
    macroStatus,
    overviewKpis,
    regime,
    combos,
    narrative,
    persistence,
    dataFreshness,
    ssiSummary,
    variables,
    variablesRaw,
    analogLetters,
    analogPanels,
    analogPending,
    cancelTracker,
  }
}
