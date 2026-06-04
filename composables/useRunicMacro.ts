import type {
  RunicAnalogResponse,
  RunicCancelTrackerResponse,
  RunicNightlyResponse,
  RunicVariablesResponse,
} from '~/types/api'

export function useRunicMacro() {
  const { data: nightly, pending: nightlyPending } = useFetch<RunicNightlyResponse>('/api/runic/nightly', {
    key: 'runic-nightly',
  })

  const { data: variables } = useFetch<RunicVariablesResponse>('/api/variables/current', {
    key: 'runic-variables',
  })

  const { data: analogC } = useFetch<RunicAnalogResponse>('/api/combo/analog', {
    key: 'runic-analog-c',
    query: { combo: 'C' },
  })

  const { data: analogF } = useFetch<RunicAnalogResponse>('/api/combo/analog', {
    key: 'runic-analog-f',
    query: { combo: 'F' },
  })

  const { data: cancelTracker } = useFetch<RunicCancelTrackerResponse>('/api/combo/cancel_tracker', {
    key: 'runic-cancel-tracker',
  })

  return {
    nightly,
    nightlyPending,
    variables,
    analogC,
    analogF,
    cancelTracker,
  }
}
