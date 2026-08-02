import { reactive } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'confirmText' | 'cancelText' | 'title'>> {
  open: boolean
  title: string
  confirmText: string
  cancelText: string
  resolve: ((value: boolean) => void) | null
}

// Module-level singleton state, rendered once by <UiConfirm> in app.vue.
const state = reactive<ConfirmState>({
  open: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  variant: 'danger',
  resolve: null
})

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    state.open = true
    state.title = options.title ?? ''
    state.message = options.message
    state.confirmText = options.confirmText ?? ''
    state.cancelText = options.cancelText ?? ''
    state.variant = options.variant ?? 'danger'
    return new Promise<boolean>((resolve) => {
      state.resolve = resolve
    })
  }

  function respond(value: boolean) {
    state.open = false
    state.resolve?.(value)
    state.resolve = null
  }

  return { state, confirm, respond }
}
