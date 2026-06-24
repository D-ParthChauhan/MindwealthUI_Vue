import type {
  ConvictionVerdict,
  FdDirection,
  FsClass,
} from '~/types/conviction'

export function convictionScoreClass(score: number | null): string {
  if (score === null) return 'na'
  if (score >= 5) return 'hi'
  if (score >= 2) return 'mid'
  return 'lo'
}

export function avgConvictionClass(avg: number): string {
  if (avg >= 5) return 'g'
  if (avg >= 2) return 'amber'
  return 'r'
}

export function verdictBadgeClass(verdict: ConvictionVerdict): string {
  switch (verdict) {
    case 'MAX CONVICTION': return 'cvb-max'
    case 'TACTICAL': return 'cvb-tac'
    case 'REDUCED': return 'cvb-red'
    case 'CANCEL': return 'cvb-cnc'
    case 'YIELD TRAP': return 'cvb-yld'
    default: return 'cvb-na'
  }
}

export function fsBadgeClass(fs: FsClass): string {
  switch (fs) {
    case 'strong': return 'cvfs-str'
    case 'moderate_high': return 'cvfs-mh'
    case 'moderate': return 'cvfs-mo'
    case 'moderate_low': return 'cvfs-ml'
    case 'weak': return 'cvfs-wk'
    default: return 'cvfs-mo'
  }
}

export function fdLabel(fd: FdDirection | null): string {
  if (fd === 'positive') return '▲ pos'
  if (fd === 'negative') return '▼ neg'
  if (fd === 'stable') return '→ sta'
  return '—'
}

export function fdClass(fd: FdDirection | null): string {
  if (fd === 'positive') return 'cvfd-pos'
  if (fd === 'negative') return 'cvfd-neg'
  if (fd === 'stable') return 'cvfd-sta'
  return ''
}

export function formatConviction(score: number | null): string {
  if (score === null) return 'N/A'
  return score > 0 ? `+${score}` : String(score)
}

export function fsCapNote(fs: FsClass): string {
  if (fs === 'strong' || fs === 'moderate_high' || fs === 'moderate') return 'none'
  if (fs === 'moderate_low') return 'conviction ≤ +4'
  return 'conviction ≤ +1'
}

export function fdSizeNote(fd: FdDirection): string {
  if (fd === 'positive') return '+10% within tier'
  if (fd === 'negative') return '−15% within tier'
  return 'no change'
}

export function parseTaxNoteParts(note: string): Array<{ label: string; total: boolean }> {
  if (!note.trim()) return []
  return note.split('·').map((part) => {
    const label = part.trim()
    return { label, total: /^total:/i.test(label) }
  })
}
