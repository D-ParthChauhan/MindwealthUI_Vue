export function functionKey(name: string): string {
  return name.toUpperCase().replace(/\s+/g, '')
}

export function matchesFunctionName(a: string, b: string): boolean {
  const left = functionKey(a)
  const right = functionKey(b)
  if (!left || !right) return false
  if (left === right) return true
  return left.includes(right) || right.includes(left)
}

export function findByFunctionName<T extends { function?: string; name?: string }>(
  items: T[],
  label: string,
  field: 'function' | 'name' = 'function',
): T | undefined {
  return items.find((item) => {
    const value = field === 'name' ? item.name : item.function
    return value ? matchesFunctionName(label, value) : false
  })
}
