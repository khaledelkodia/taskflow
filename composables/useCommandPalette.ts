import { ref } from 'vue'

// Shared open-state for the global ⌘K command palette.
const isOpen = ref(false)

export function useCommandPalette() {
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false },
    toggle: () => { isOpen.value = !isOpen.value }
  }
}
