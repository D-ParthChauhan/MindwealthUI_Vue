import { isBackendConfigured, mindwealthFetch } from './mindwealth-client'

/** Legacy proxy — prefer mindwealth-data loaders for typed responses. */
export async function fetchFromBackend<T>(
  path: string,
  options?: Parameters<typeof $fetch>[1],
): Promise<T | null> {
  if (!isBackendConfigured()) return null
  return mindwealthFetch<T>(path, options)
}
