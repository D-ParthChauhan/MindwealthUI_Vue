export function useSideNav<T extends string>(initial: T) {
  const activeId = ref<T>(initial)

  function select(id: T) {
    activeId.value = id
  }

  function isActive(id: T) {
    return activeId.value === id
  }

  return { activeId, select, isActive }
}
