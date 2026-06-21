<template>
  <span :class="['badge', colorClass]" v-bind="$attrs">
    <span v-if="dot" :class="['status-dot', dotColor]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  color?: 'blue'|'green'|'yellow'|'red'|'gray'|'purple'|'orange'|'indigo'
  dot?: boolean
  dotColor?: string
  class?: string
}>()
const colorClass = computed(() => `badge-${props.color ?? 'gray'}`)
</script>
