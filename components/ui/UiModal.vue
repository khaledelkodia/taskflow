<template>
  <Teleport to="body">
    <Transition name="fade-fast">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" @click="closeOnOutside && emit('update:modelValue', false)" />

        <!-- Modal panel -->
        <Transition name="scale-in">
          <div
            v-if="modelValue"
            class="relative bg-white rounded-xl shadow-modal flex flex-col w-full max-h-full overflow-hidden transition-all"
            :class="maxWidthClass"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-app-border flex items-center justify-between shrink-0">
              <h3 class="text-lg font-semibold text-content-primary">
                {{ title }}
              </h3>
              <button
                class="text-content-muted hover:text-content-primary transition-colors p-1 -mr-1 rounded-md hover:bg-app-hover"
                @click="emit('update:modelValue', false)"
              >
                <span class="sr-only">Close</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-app-border bg-app-bg shrink-0 flex items-center justify-end gap-3 rounded-b-xl">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  closeOnOutside?: boolean
}>(), {
  maxWidth: 'md',
  closeOnOutside: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm': return 'max-w-sm'
    case 'md': return 'max-w-md'
    case 'lg': return 'max-w-lg'
    case 'xl': return 'max-w-xl'
    case '2xl': return 'max-w-2xl'
    default: return 'max-w-md'
  }
})

// Close on escape key
onMounted(() => {
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      emit('update:modelValue', false)
    }
  }
  document.addEventListener('keydown', onEscape)
  onUnmounted(() => document.removeEventListener('keydown', onEscape))
})
</script>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active { transition: opacity 0.2s ease; }
.fade-fast-enter-from,
.fade-fast-leave-to { opacity: 0; }

.scale-in-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.scale-in-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.scale-in-enter-from,
.scale-in-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
</style>
