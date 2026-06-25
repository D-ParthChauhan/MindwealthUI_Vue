function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function normalizeUnicodeSpaces(text: string) {
  return text.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ').replace(/\t/g, '  ')
}

function stripLeadingSpaces(text: string) {
  return text.replace(/^ +/, '')
}

function lineIndent(line: string) {
  const match = line.match(/^( *)/)
  return match?.[1].length ?? 0
}

/** Remove common block indent from log-style messages while keeping relative nesting. */
function dedentBlock(markdown: string) {
  const normalized = normalizeUnicodeSpaces(markdown)
  const lines = normalized.split('\n')
  const nonEmpty = lines.filter((line) => line.trim().length > 0)
  if (!nonEmpty.length) return normalized

  const minIndent = Math.min(...nonEmpty.map(lineIndent))
  if (minIndent < 2) return normalized

  return lines
    .map((line) => {
      if (!line.trim()) return ''
      const drop = Math.min(minIndent, lineIndent(line))
      return line.slice(drop)
    })
    .join('\n')
}

function inlineMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

type ListKind = 'ul' | 'ol'

function listOpenTag(kind: ListKind) {
  return kind === 'ul' ? '<ul class="ach-ul">' : '<ol class="ach-ol">'
}

function listCloseTag(kind: ListKind) {
  return kind === 'ul' ? '</ul>' : '</ol>'
}

export function analystMarkdownToHtml(markdown: string) {
  const lines = escapeHtml(dedentBlock(markdown)).split('\n')
  const parts: string[] = []
  const listStack: Array<{ kind: ListKind; indent: number }> = []
  let openLi = false

  const closeOpenLi = () => {
    if (openLi) {
      parts.push('</li>')
      openLi = false
    }
  }

  const closeListsAbove = (indent: number) => {
    while (listStack.length && listStack[listStack.length - 1].indent > indent) {
      closeOpenLi()
      parts.push(listCloseTag(listStack.pop()!.kind))
    }
  }

  const closeAllLists = () => {
    closeListsAbove(-1)
    closeOpenLi()
    while (listStack.length) {
      parts.push(listCloseTag(listStack.pop()!.kind))
    }
  }

  const ensureList = (kind: ListKind, indent: number) => {
    closeListsAbove(indent)

    const top = listStack[listStack.length - 1]
    if (top && top.indent === indent && top.kind !== kind) {
      closeOpenLi()
      parts.push(listCloseTag(listStack.pop()!.kind))
    }

    const current = listStack[listStack.length - 1]
    if (!current || current.indent < indent) {
      listStack.push({ kind, indent })
      parts.push(listOpenTag(kind))
    }
  }

  const addListItem = (kind: ListKind, indent: number, content: string) => {
    const top = listStack[listStack.length - 1]
    const nestingDeeper = Boolean(top && indent > top.indent)

    if (!nestingDeeper) {
      closeOpenLi()
    }

    ensureList(kind, indent)
    parts.push(`<li>${inlineMarkdown(content)}`)
    openLi = true
  }

  for (const raw of lines) {
    const line = normalizeUnicodeSpaces(raw).trimEnd()
    const trimmed = stripLeadingSpaces(line.trim())

    if (!trimmed) {
      closeAllLists()
      continue
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      closeAllLists()
      const level = trimmed.match(/^#+/)?.[0].length ?? 2
      const text = trimmed.replace(/^#{1,3}\s+/, '')
      const cls = level <= 2 ? 'ach-h2' : 'ach-h3'
      parts.push(`<div class="${cls}">${inlineMarkdown(text)}</div>`)
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeAllLists()
      parts.push('<hr class="ach-hr" />')
      continue
    }

    const indentLevel = Math.floor(lineIndent(line) / 2)

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/)
    if (bulletMatch) {
      addListItem('ul', indentLevel, bulletMatch[1])
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/)
    if (orderedMatch) {
      addListItem('ol', indentLevel, orderedMatch[1])
      continue
    }

    closeAllLists()
    parts.push(`<p class="ach-p">${inlineMarkdown(trimmed)}</p>`)
  }

  closeAllLists()
  return parts.join('')
}
