const MOBILE_QUERY = '(max-width: 768px) and (orientation: portrait)'

export function useIsMobile() {
  const isMobile = useState('is-mobile', () => false)

  function syncMobileClass(active: boolean) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('mobile-app', active)
  }

  if (import.meta.client) {
    onMounted(() => {
      const mq = window.matchMedia(MOBILE_QUERY)
      const update = () => {
        isMobile.value = mq.matches
        syncMobileClass(mq.matches)
      }
      update()
      mq.addEventListener('change', update)
      onUnmounted(() => mq.removeEventListener('change', update))
    })
  }

  return readonly(isMobile)
}
