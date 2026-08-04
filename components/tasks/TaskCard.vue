<template>
  <div
    class="card card-hover p-5 flex flex-col gap-4 group relative cursor-pointer"
    @click="$emit('open', task)"
  >
    <!-- Top row -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <TaskTypeIcon :type="task.type" :title="TASK_TYPE_LABELS[task.type]" class="w-4 h-4 text-content-muted shrink-0" />
        <span class="text-[11px] font-bold text-content-muted tracking-wider shrink-0">{{ formatTaskNumber(task.task_number) }}</span>
        <UiBadge :color="TASK_STATUS_COLORS[task.status].replace('badge-', '') as any" dot :dotColor="TASK_STATUS_DOT[task.status]">
          {{ $t('taskStatus.' + task.status) }}
        </UiBadge>
      </div>
      <!-- Hover actions -->
      <div
        v-if="canEdit"
        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <button class="p-1.5 rounded-lg hover:bg-gray-100 text-content-secondary" :title="$t('common.edit', 'Edit')" @click.stop="$emit('edit', task)">
          <Edit class="w-4 h-4" />
        </button>
        <button v-if="canDelete" class="p-1.5 rounded-lg hover:bg-danger-50 text-danger" :title="$t('common.delete', 'Delete')" @click.stop="$emit('delete', task)">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Title + project -->
    <div class="min-w-0">
      <h3 class="font-semibold text-content-primary leading-snug truncate-2 group-hover:text-primary transition-colors">{{ task.title }}</h3>
      <p class="text-xs text-content-muted mt-1.5 truncate">
        {{ task.project?.name ?? '—' }}<span v-if="task.client?.company_name"> · {{ task.client.company_name }}</span>
      </p>
    </div>

    <!-- Footer -->
    <div class="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
      <UiBadge :color="PRIORITY_COLORS[task.priority].replace('badge-', '') as any">
        {{ $t('priority.' + task.priority) }}
      </UiBadge>
      <div class="flex items-center gap-2.5">
        <span class="text-xs" :class="isOverdue(task.due_date, task.status) ? 'text-danger font-semibold' : 'text-content-muted'">
          {{ task.due_date ? formatDate(task.due_date) : '—' }}
        </span>
        <UiAvatar v-if="task.assignee" :name="task.assignee.full_name" size="sm" :title="task.assignee.full_name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Trash2 } from 'lucide-vue-next'
import TaskTypeIcon from '~/components/tasks/TaskTypeIcon.vue'
import {
  TASK_STATUS_COLORS, TASK_STATUS_DOT, PRIORITY_COLORS,
  TASK_TYPE_LABELS
} from '~/utils/constants'
import { formatTaskNumber, formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import type { Task } from '~/types'

defineProps<{ task: Task }>()
defineEmits<{ open: [task: Task]; edit: [task: Task]; delete: [task: Task] }>()

const authStore = useAuthStore()
const canEdit = computed(() => hasPermission(authStore.role, 'update_status'))
const canDelete = computed(() => hasPermission(authStore.role, 'delete_tasks'))

function isOverdue(dateStr: string | null | undefined, status: string) {
  if (!dateStr || ['completed', 'cancelled', 'rejected'].includes(status)) return false
  return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
}
</script>
