/** Turn middle-dot separated inline data into stacked lines (HTML). */
export function stackDotsHtml(text: string): string {
  return text.replace(/ · /g, '<br>')
}

/** Plain-text variant for white-space: pre-line blocks. */
export function stackDotsPlain(text: string): string {
  return text.replace(/ · /g, '\n')
}
