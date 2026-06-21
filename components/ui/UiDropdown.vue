<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <div @click="toggle" class="cursor-pointer inline-block">
      <slot name="trigger" />
    </div>

    <Transition name="slide-down">
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 mt-2 rounded-md bg-white shadow-dropdown ring-1 ring-black ring-opacity-5 focus:outline-none',
          align === 'right' ? 'right-0' : 'left-0',
          widthClass
        ]"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = withDefaults(defineProps<{
  align?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg' | 'auto'
}>(), {
  align: 'right',
  width: 'md'
})

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

onClickOutside(dropdownRef, () => {
  if (isOpen.value) close()
})

defineExpose({ close })

const widthClass = computed(() => {
  switch(props.width) {
    case 'sm': return 'w-32'
    case 'md': return 'w-48'
    case 'lg': return 'w-64'
    case 'auto': return 'w-auto whitespace-nowrap'
    default: return 'w-48'
  }
})
</script>

<style scoped>
.slide-down-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.slide-down-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
