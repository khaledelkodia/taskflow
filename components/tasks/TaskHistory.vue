<template>
  <div class="relative pl-4 space-y-6">
    <!-- Vertical line -->
    <div class="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-200" />

    <div v-if="!tasksStore.history.length" class="text-sm text-content-muted relative z-10 pl-6">
      No history recorded yet.
    </div>

    <div
      v-else
      v-for="event in tasksStore.history"
      :key="event.id"
      class="relative z-10"
    >
      <div class="absolute left-[-20px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />
      <div class="pl-2">
        <p class="text-sm text-content-primary">
          <span class="font-medium">{{ event.changed_by_name }}</span>
          changed <span class="font-medium">{{ formatField(event.field_changed) }}</span>
        </p>
        <div class="mt-1 flex items-center gap-2 text-sm">
          <span class="px-2 py-0.5 bg-gray-100 rounded text-gray-600 line-through">
            {{ formatValue(event.field_changed, event.old_value) }}
          </span>
          <span class="text-gray-400">→</span>
          <span class="px-2 py-0.5 bg-primary-50 text-primary-700 rounded">
            {{ formatValue(event.field_changed, event.new_value) }}
          </span>
        </div>
        <p class="text-xs text-content-muted mt-1.5">
          {{ formatDateTime(event.changed_at) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '~/utils/constants'
import { formatDateTime } from '~/utils/formatters'

const props = defineProps<{ taskId: string }>()
const tasksStore = useTasksStore()

function formatField(field: string): string {
  const map: Record<string, string> = {
    'status': 'Status',
    'priority': 'Priority',
    'assigned_to': 'Assignee',
    'estimated_hours': 'Estimate'
  }
  return map[field] || field
}

function formatValue(field: string, value: string | null | undefined): string {
  if (!value) return 'None'
  if (field === 'status') return TASK_STATUS_LABELS[value as any] || value
  if (field === 'priority') return PRIORITY_LABELS[value as any] || value
  if (field === 'estimated_hours') return `${value}h`
  if (field === 'assigned_to') return 'New Assignee' // Would need profile lookup to show name ideally
  return value
}
</script>
