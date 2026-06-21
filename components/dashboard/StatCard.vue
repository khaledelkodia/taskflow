<template>
  <UiCard class="overflow-hidden" hoverable>
    <div class="p-5 flex items-start gap-4">
      <div
        :class="[
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          colorClasses[color]
        ]"
      >
        <component :is="icon" class="w-6 h-6" />
      </div>
      
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-content-secondary truncate">{{ title }}</p>
        <div class="mt-1 flex items-baseline gap-2">
          <h4 class="text-2xl font-bold text-content-primary tabular-nums">
            <template v-if="loading">
              <div class="h-8 w-16 bg-gray-200 animate-pulse rounded-md" />
            </template>
            <template v-else>
              {{ value }}
            </template>
          </h4>
          <span v-if="trend && !loading" :class="[
            'text-sm font-medium',
            trend > 0 ? 'text-success-600' : 'text-danger-600'
          ]">
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </span>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  value: number | string
  icon: any
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'gray'
  trend?: number
  loading?: boolean
}>(), {
  color: 'primary'
})

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600'
}
</script>
