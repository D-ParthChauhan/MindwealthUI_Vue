function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function analystMarkdownToHtml(markdown: string) {
  const lines = escapeHtml(markdown).split('\n')
  const parts: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      parts.push('</ul>')
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      continue
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      closeList()
      const level = trimmed.match(/^#+/)?.[0].length ?? 2
      const text = trimmed.replace(/^#{1,3}\s+/, '')
      const cls = level <= 2 ? 'ach-h2' : 'ach-h3'
      parts.push(`<div class="${cls}">${inlineMarkdown(text)}</div>`)
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList()
      parts.push('<hr class="ach-hr" />')
      continue
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      if (!inList) {
        parts.push('<ul class="ach-ul">')
        inList = true
      }
      parts.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*•]\s+/, ''))}</li>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        parts.push('<ol class="ach-ol">')
        inList = true
      }
      parts.push(`<li>${inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</li>`)
      continue
    }

    closeList()
    parts.push(`<p class="ach-p">${inlineMarkdown(trimmed)}</p>`)
  }

  closeList()
  return parts.join('')
}
