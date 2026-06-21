<template>
  <div
    :class="[
      'avatar',
      sizeClass,
      colorClass
    ]"
    v-bind="$attrs"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      :alt="name"
      class="w-full h-full object-cover rounded-full"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { getAvatarColor } from '~/utils/constants'
import { getInitials } from '~/utils/formatters'

const props = defineProps<{
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const initials = computed(() => getInitials(props.name))
const colorClass = computed(() => getAvatarColor(props.name))
const sizeClass = computed(() => ({
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl'
}[props.size ?? 'md']))
</script>
