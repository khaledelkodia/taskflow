<template>
  <div :class="['card', { 'card-hover': hoverable }]" v-bind="$attrs">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="text-base font-semibold text-content-primary">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body" :class="bodyClass">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  hoverable?: boolean
  bodyClass?: string
}>()
</script>
