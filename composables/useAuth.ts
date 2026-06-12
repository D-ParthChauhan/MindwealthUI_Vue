export function useAuth() {
  const config = useRuntimeConfig()
  const isAdmin = computed(() => config.public.adminMode === true)
  return { isAdmin }
}
