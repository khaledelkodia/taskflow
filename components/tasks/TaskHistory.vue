<template>
  <div v-if="!tasksStore.history.length" class="text-sm text-content-muted py-2">
    {{ $t('taskHistory.empty') }}
  </div>

  <div v-else class="space-y-1">
    <div
      v-for="event in tasksStore.history"
      :key="event.id"
      class="timeline-item flex gap-3"
    >
      <!-- Marker + connector -->
      <div class="flex flex-col items-center shrink-0">
        <span class="timeline-dot w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white mt-1.5" />
        <span class="timeline-line w-px flex-1 bg-gray-200 my-1" />
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1 pb-5">
        <p class="text-sm text-content-primary leading-snug">
          <span class="font-semibold">{{ event.changed_by_name }}</span>
          {{ $t('taskHistory.changed') }}
          <span class="font-medium">{{ formatField(event.field_changed) }}</span>
        </p>

        <div class="mt-1.5 flex items-center flex-wrap gap-2 text-sm">
          <span class="px-2 py-0.5 bg-gray-100 rounded text-gray-500 line-through">
            {{ formatValue(event.field_changed, event.old_value) }}
          </span>
          <ArrowRight class="timeline-arrow w-4 h-4 text-gray-400 shrink-0" />
          <span class="px-2 py-0.5 bg-primary-50 text-primary-700 rounded font-medium">
            {{ formatValue(event.field_changed, event.new_value) }}
          </span>
        </div>

        <p class="mt-2 flex items-center gap-1.5 text-xs text-content-muted">
          <Clock class="w-3.5 h-3.5 shrink-0" />
          <span>{{ formatDateTime(event.changed_at) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Clock, ArrowRight } from 'lucide-vue-next'
import { formatDateTime } from '~/utils/formatters'

const props = defineProps<{ taskId: string }>()
const tasksStore = useTasksStore()
const { t } = useI18n()

onMounted(() => tasksStore.fetchMemberNames())

function formatField(field: string): string {
  const known = ['status', 'priority', 'assigned_to', 'estimated_hours', 'actual_hours']
  return known.includes(field) ? t(`taskHistory.fields.${field}`) : field
}

function formatValue(field: string, value: string | null | undefined): string {
  if (!value) return t('taskHistory.none')
  if (field === 'status') return t(`taskStatus.${value}`)
  if (field === 'priority') return t(`priority.${value}`)
  if (field === 'estimated_hours' || field === 'actual_hours') return `${value}h`
  if (field === 'assigned_to') return tasksStore.memberNames[value] ?? t('taskHistory.newAssignee')
  return value
}
</script>

<style scoped>
/* Hide the connector line under the last event */
.timeline-item:last-child .timeline-line {
  display: none;
}
/* Arrow points old → new; flip it in RTL so it still reads correctly */
[dir="rtl"] .timeline-arrow {
  transform: scaleX(-1);
}
</style>
