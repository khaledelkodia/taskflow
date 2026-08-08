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
        <p class="text-sm text-content-primary leading-relaxed">
          <span class="font-semibold">{{ event.changed_by_name }}</span>
          {{ describe(event).verb }}
          <span
            v-if="describe(event).value"
            class="inline-block px-2 py-0.5 mx-0.5 bg-primary-50 text-primary-700 rounded font-medium align-middle"
          >
            {{ describe(event).value }}
          </span>
        </p>

        <p class="mt-1.5 flex items-center gap-1.5 text-xs text-content-muted">
          <Clock class="w-3.5 h-3.5 shrink-0" />
          <span>{{ formatDateTime(event.changed_at) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Clock } from 'lucide-vue-next'
import { formatDateTime } from '~/utils/formatters'
import type { TaskHistory } from '~/types'

const props = defineProps<{ taskId: string }>()
const tasksStore = useTasksStore()
const { t } = useI18n()

onMounted(() => tasksStore.fetchMemberNames())

function assigneeName(id: string | null | undefined): string {
  if (!id) return t('taskHistory.none')
  return tasksStore.memberNames[id] ?? t('taskHistory.newAssignee')
}

// Turn a raw history row into a readable "verb + value" sentence.
function describe(event: TaskHistory): { verb: string; value?: string } {
  const f = event.field_changed
  const ov = event.old_value
  const nv = event.new_value

  switch (f) {
    case 'status':
      // First status (null → new) is really the task being created.
      if (!ov && nv === 'new') return { verb: t('taskHistory.actions.created') }
      return { verb: t('taskHistory.actions.statusTo'), value: nv ? t(`taskStatus.${nv}`) : t('taskHistory.none') }

    case 'assigned_to':
      if (!nv) return { verb: t('taskHistory.actions.unassigned') }
      return {
        verb: ov ? t('taskHistory.actions.reassignedTo') : t('taskHistory.actions.assignedTo'),
        value: assigneeName(nv)
      }

    case 'priority':
      return { verb: t('taskHistory.actions.priorityTo'), value: nv ? t(`priority.${nv}`) : t('taskHistory.none') }

    case 'estimated_hours':
      return { verb: t('taskHistory.actions.estimateTo'), value: nv ? `${nv}h` : t('taskHistory.none') }

    case 'actual_hours':
      return { verb: t('taskHistory.actions.hoursTo'), value: nv ? `${nv}h` : t('taskHistory.none') }

    default:
      return { verb: t('taskHistory.changed'), value: nv ?? undefined }
  }
}
</script>

<style scoped>
/* Hide the connector line under the last event */
.timeline-item:last-child .timeline-line {
  display: none;
}
</style>
