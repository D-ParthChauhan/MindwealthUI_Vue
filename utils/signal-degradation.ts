import type { CheckDegradationResponse, DegradationCombo, Signal } from '~/types/api'
import { normalizeFunctionName, normalizeIntervalName } from '~/utils/signal-filters'
import { surfaceRecordKey } from '~/utils/signal-surface'

function comboToKey(combo: DegradationCombo): string {
  return surfaceRecordKey(combo.asset, combo.function, combo.interval, combo.direction)
}

function signalComboKey(signal: Signal): string {
  return surfaceRecordKey(signal.symbol, signal.function, signal.interval, signal.signal_type)
}

/** Keys for signals flagged degraded by POST /signals/check-degradation. */
export function buildDegradedSignalKeys(
  data: CheckDegradationResponse | null | undefined,
): Set<string> {
  const keys = new Set<string>()
  if (!data) return keys

  for (const alert of data.alerts ?? []) {
    if (alert.combo) keys.add(comboToKey(alert.combo))
  }

  for (const alert of data.portfolio_alerts ?? []) {
    if (alert.trigger_type !== 'live_mtm_breach') continue
    if (String(alert.status ?? '').toLowerCase() !== 'open') continue
    keys.add(
      surfaceRecordKey(alert.symbol, alert.function, alert.interval, alert.direction),
    )
  }

  return keys
}

export function mergeSignalsWithDegradationCheck(
  signals: Signal[],
  data: CheckDegradationResponse | null | undefined,
): Signal[] {
  const degraded = buildDegradedSignalKeys(data)
  if (!degraded.size) return signals

  return signals.map((signal) => {
    if (!degraded.has(signalComboKey(signal))) return signal
    if (signal.status === 'degraded') return signal
    return {
      ...signal,
      status: 'degraded' as const,
      raw_fields: {
        ...(signal.raw_fields ?? {}),
        fwd_degraded: true,
        degradation_source: 'check-degradation',
      },
    }
  })
}

export function findDegradationAlertForSignal(
  signal: Signal,
  data: CheckDegradationResponse | null | undefined,
) {
  if (!data) return null
  const key = signalComboKey(signal)
  const fwd = (data.alerts ?? []).find((a) => a.combo && comboToKey(a.combo) === key)
  if (fwd) return fwd
  return (data.portfolio_alerts ?? []).find(
    (a) =>
      a.trigger_type === 'live_mtm_breach' &&
      surfaceRecordKey(a.symbol, a.function, a.interval, a.direction) === key,
  )
}

export function normalizeComboLabel(combo: DegradationCombo): string {
  return `${combo.asset} · ${normalizeFunctionName(combo.function)} · ${normalizeIntervalName(combo.interval)} · ${combo.direction}`
}
