<template>
  <div class="space-y-6">
    <div v-if="tasksStore.loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <div v-else-if="!task" class="empty-state bg-white border border-app-border rounded-xl">
      <p class="text-content-primary font-medium">{{ $t('taskDetails.notFound.title') }}</p>
      <p class="text-sm text-content-muted mt-1">{{ $t('taskDetails.notFound.subtitle') }}</p>
      <NuxtLink to="/tasks" class="mt-4">
        <UiButton variant="secondary">{{ $t('taskDetails.notFound.backBtn') }}</UiButton>
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="text-sm font-semibold text-content-secondary uppercase tracking-wider">
              {{ formatTaskNumber(task.task_number) }}
            </span>
            <UiBadge :color="PRIORITY_COLORS[task.priority].replace('badge-', '') as any">
              {{ PRIORITY_LABELS[task.priority] }}
            </UiBadge>
            <UiBadge :color="TASK_TYPE_COLORS[task.type].replace('badge-', '') as any">
              <span class="mr-1">{{ TASK_TYPE_ICONS[task.type] }}</span>
              {{ TASK_TYPE_LABELS[task.type] }}
            </UiBadge>
          </div>
          <h1 class="text-2xl font-bold text-content-primary leading-tight">
            {{ task.title }}
          </h1>
          <p class="text-sm text-content-muted mt-2">
            {{ $t('taskDetails.createdBy') }} <span class="font-medium text-content-secondary">{{ task.creator?.full_name }}</span> 
            {{ $t('taskDetails.on') }} {{ formatDateTime(task.created_at) }}
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <StatusDropdown 
            :task-id="task.id" 
            :current-status="task.status" 
            @updated="task.status = $event"
          />
          <UiButton
            v-if="hasPermission(authStore.role, 'create_tasks')"
            variant="secondary"
            size="sm"
            @click="isEditModalOpen = true"
            iconPosition="left"
          >
            <template #icon><Edit class="w-4 h-4" /></template>
            {{ $t('common.edit') }}
          </UiButton>
          <UiButton
            v-if="hasPermission(authStore.role, 'delete_tasks')"
            variant="danger"
            size="sm"
            @click="handleDelete"
            iconPosition="left"
          >
            <template #icon><Trash2 class="w-4 h-4" /></template>
            {{ $t('common.delete') }}
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Description -->
          <UiCard>
            <div class="p-6">
              <h3 class="text-sm font-semibold text-content-primary mb-3">{{ $t('taskDetails.description') }}</h3>
              <div class="prose prose-sm max-w-none text-content-secondary whitespace-pre-wrap">
                {{ task.description || $t('taskDetails.noDescription') }}
              </div>
            </div>
          </UiCard>

          <!-- Attachments -->
          <UiCard>
            <div class="p-6">
              <TaskAttachments :task-id="task.id" />
            </div>
          </UiCard>

          <!-- Comments -->
          <UiCard>
            <div class="p-6">
              <CommentThread :task-id="task.id" />
            </div>
          </UiCard>

        </div>

        <!-- Sidebar Details -->
        <div class="space-y-6">
          <UiCard :title="$t('taskDetails.details')">
            <div class="space-y-4">
              <!-- Assignee -->
              <div>
                <label class="block text-xs font-medium text-content-muted mb-1.5">{{ $t('taskDetails.assignee') }}</label>
                <div class="flex items-center gap-2" v-if="task.assignee">
                  <UiAvatar :name="task.assignee.full_name" size="sm" :avatar-url="task.assignee.avatar_url" />
                  <span class="text-sm text-content-primary font-medium">{{ task.assignee.full_name }}</span>
                </div>
                <div v-else class="text-sm text-content-secondary italic">{{ $t('taskDetails.unassigned') }}</div>
              </div>

              <!-- Project & Client -->
              <div>
                <label class="block text-xs font-medium text-content-muted mb-1.5">{{ $t('taskDetails.project') }}</label>
                <NuxtLink v-if="task.project" :to="`/projects/${task.project.id}`" class="text-sm font-medium text-primary hover:underline">
                  {{ task.project.name }}
                </NuxtLink>
                <span v-else class="text-sm text-content-secondary">—</span>
              </div>
              
              <div>
                <label class="block text-xs font-medium text-content-muted mb-1.5">{{ $t('taskDetails.client') }}</label>
                <NuxtLink v-if="task.client" :to="`/clients/${task.client.id}`" class="text-sm font-medium text-content-primary hover:text-primary transition-colors">
                  {{ task.client.company_name }}
                </NuxtLink>
              </div>

              <hr class="border-app-border my-2" />

              <!-- Estimates & Dates -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-content-muted mb-1">{{ $t('taskDetails.estimate') }}</label>
                  <span class="text-sm text-content-primary">{{ formatHours(task.estimated_hours) }}</span>
                </div>
                <div>
                  <label class="block text-xs font-medium text-content-muted mb-1">{{ $t('taskDetails.logged') }}</label>
                  <span class="text-sm text-content-primary">{{ formatHours(task.actual_hours) }}</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-content-muted mb-1">{{ $t('taskDetails.dueDate') }}</label>
                <span class="text-sm" :class="isOverdue(task.due_date) && !['completed','cancelled'].includes(task.status) ? 'text-danger font-medium' : 'text-content-primary'">
                  {{ formatDate(task.due_date) }}
                </span>
              </div>
            </div>
          </UiCard>

          <UiCard :title="$t('taskDetails.timeline')">
            <TaskHistory :task-id="task.id" />
          </UiCard>
        </div>
      </div>
    </template>

    <TaskFormModal
      v-model="isEditModalOpen"
      :task="task"
      @saved="handleTaskSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Edit, Trash2 } from 'lucide-vue-next'
import { PRIORITY_LABELS, PRIORITY_COLORS, TASK_TYPE_LABELS, TASK_TYPE_ICONS, TASK_TYPE_COLORS } from '~/utils/constants'
import { formatTaskNumber, formatDateTime, formatDate, formatHours, isOverdue } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import { useI18n } from 'vue-i18n'
import StatusDropdown from '~/components/tasks/StatusDropdown.vue'
import TaskAttachments from '~/components/tasks/TaskAttachments.vue'
import CommentThread from '~/components/comments/CommentThread.vue'
import TaskHistory from '~/components/tasks/TaskHistory.vue'
import TaskFormModal from '~/components/tasks/TaskFormModal.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  breadcrumb: 'Task Details'
})

const route = useRoute()
const tasksStore = useTasksStore()
const authStore = useAuthStore()
const { t } = useI18n()
const taskId = route.params.id as string

const task = computed(() => tasksStore.current)
const isEditModalOpen = ref(false)

async function handleTaskSaved() {
  await tasksStore.fetchTask(taskId)
}

async function handleDelete() {
  if (confirm(t('common.delete') + '?')) {
    try {
      await tasksStore.deleteTask(taskId)
      navigateTo('/tasks')
    } catch (err) {
      alert('Failed to delete task')
    }
  }
}

onMounted(async () => {
  if (taskId) {
    await Promise.all([
      tasksStore.fetchTask(taskId),
      tasksStore.fetchComments(taskId, true),
      tasksStore.fetchHistory(taskId),
      tasksStore.fetchAttachments(taskId)
    ])
  }
})
</script>
