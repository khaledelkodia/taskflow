<template>
  <div class="relative inline-block text-left" ref="triggerRef">
    <div @click="toggle" class="cursor-pointer inline-block">
      <slot name="trigger" />
    </div>

    <Teleport to="body">
      <Transition name="slide-down">
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="menuStyle"
          :class="[
            'fixed z-[60] rounded-xl bg-white shadow-dropdown ring-1 ring-black/5 focus:outline-none max-h-[70vh] overflow-y-auto',
            widthClass
          ]"
        >
          <div class="py-1" role="menu" aria-orientation="vertical">
            <slot />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  align?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg' | 'auto'
}>(), {
  align: 'right',
  width: 'md'
})

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

function computePosition() {
  const el = triggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const style: Record<string, string> = { top: `${Math.round(r.bottom + 6)}px` }
  if (props.align === 'right') {
    style.right = `${Math.round(window.innerWidth - r.right)}px`
  } else {
    style.left = `${Math.round(r.left)}px`
  }
  menuStyle.value = style
}

function onDocMouseDown(e: MouseEvent) {
  const t = e.target as Node
  if (triggerRef.value?.contains(t)) return
  if (menuRef.value?.contains(t)) return
  close()
}

function open() {
  isOpen.value = true
  nextTick(computePosition)
  window.addEventListener('scroll', computePosition, true)
  window.addEventListener('resize', computePosition)
  document.addEventListener('mousedown', onDocMouseDown, true)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  window.removeEventListener('scroll', computePosition, true)
  window.removeEventListener('resize', computePosition)
  document.removeEventListener('mousedown', onDocMouseDown, true)
}

function toggle() {
  isOpen.value ? close() : open()
}

onBeforeUnmount(close)
defineExpose({ close })

const widthClass = computed(() => {
  switch (props.width) {
    case 'sm': return 'w-32'
    case 'md': return 'w-48'
    case 'lg': return 'w-64'
    case 'auto': return 'w-auto whitespace-nowrap min-w-[10rem]'
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
