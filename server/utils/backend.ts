export async function fetchFromBackend<T>(
  path: string,
  options?: Parameters<typeof $fetch>[1],
): Promise<T | null> {
  const config = useRuntimeConfig()
  const base = config.apiBaseUrl as string
  if (!base) return null

  try {
    const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
    return await $fetch<T>(url, options)
  } catch (err) {
    console.warn(`[api] Backend unavailable for ${path}:`, err)
    return null
  }
}
