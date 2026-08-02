import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

// Module-level singleton state (shared across all callers).
// Only ever mutated on the client in response to user actions.
const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3500) {
    const id = ++seq
    toasts.value.push({ id, message, type })
    if (duration > 0 && import.meta.client) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: number) {
    const i = toasts.value.findIndex((t) => t.id === id)
    if (i !== -1) toasts.value.splice(i, 1)
  }

  return {
    toasts,
    show,
    success: (m: string, d?: number) => show(m, 'success', d),
    error: (m: string, d?: number) => show(m, 'error', d),
    info: (m: string, d?: number) => show(m, 'info', d),
    dismiss
  }
}
