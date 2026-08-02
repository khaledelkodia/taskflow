<template>
  <Teleport to="body">
    <div class="fixed top-4 end-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-dropdown border bg-white"
          :class="borderClass(t.type)"
          role="alert"
        >
          <component :is="icon(t.type)" class="w-5 h-5 shrink-0 mt-0.5" :class="iconClass(t.type)" />
          <p class="text-sm text-content-primary leading-snug flex-1 min-w-0 break-words">{{ t.message }}</p>
          <button
            class="shrink-0 text-content-muted hover:text-content-primary transition-colors"
            :aria-label="$t('common.close', 'Close')"
            @click="dismiss(t.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import type { ToastType } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

function icon(type: ToastType) {
  return type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info
}
function iconClass(type: ToastType) {
  return type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-primary'
}
function borderClass(type: ToastType) {
  return type === 'success'
    ? 'border-success/30'
    : type === 'error'
    ? 'border-danger/30'
    : 'border-primary/30'
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.97); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
.toast-move { transition: transform 0.2s ease; }
</style>
