export type SignalDisplayMode = 'tables' | 'surface' | 'ranked-cards'

export const SIGNAL_DISPLAY_MODE_OPTIONS: Array<{ value: SignalDisplayMode; label: string }> = [
  { value: 'tables', label: 'Tables' },
  { value: 'surface', label: 'Surface' },
  { value: 'ranked-cards', label: 'Ranked Cards Only' },
]

export function useSignalDisplayMode() {
  const displayMode = useState<SignalDisplayMode>('signal-display-mode', () => 'tables')
  return { displayMode }
}
