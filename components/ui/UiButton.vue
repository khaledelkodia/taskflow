<template>
  <button
    :class="[
      'btn',
      variantClass,
      sizeClass,
      { 'w-full': block, 'opacity-75 cursor-not-allowed': loading || disabled }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <!-- Loading spinner -->
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <!-- Icon left -->
    <component v-else-if="icon && iconPosition === 'left'" :is="icon" class="w-4 h-4 mr-1.5" />

    <slot />

    <!-- Icon right -->
    <component v-if="icon && iconPosition === 'right' && !loading" :is="icon" class="w-4 h-4 ml-1.5" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: any
  iconPosition?: 'left' | 'right'
}>(), {
  variant: 'primary',
  size: 'md',
  iconPosition: 'left'
})

const variantClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success'
  }
  return map[props.variant] || 'btn-primary'
})

const sizeClass = computed(() => {
  const map: Record<string, string> = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  }
  return map[props.size] || 'btn-md'
})
</script>
