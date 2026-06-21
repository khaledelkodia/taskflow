<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('tasks.title') }}</h1>
        <p class="page-subtitle">{{ $t('tasks.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UiButton
          v-if="hasPermission(authStore.role, 'create_tasks')"
          variant="primary"
          @click="openCreateModal"
        >
          {{ $t('tasks.createTask') }}
        </UiButton>
      </div>
    </div>

    <!-- Filters -->
    <UiCard class="mb-6">
      <div class="p-4 flex flex-wrap gap-4 items-end">
        <div class="w-full md:w-48">
          <label class="label text-xs">{{ $t('tasks.filters.search') }}</label>
          <input
            v-model="filters.search"
            type="text"
            class="input text-sm"
            :placeholder="$t('tasks.filters.searchPlaceholder')"
            @input="debouncedFetch"
          />
        </div>
        
        <div class="w-full md:w-40">
          <label class="label text-xs">{{ $t('tasks.filters.status') }}</label>
          <select v-model="filters.status" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allStatuses') }}</option>
            <option v-for="opt in TASK_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="w-full md:w-40">
          <label class="label text-xs">{{ $t('tasks.filters.priority') }}</label>
          <select v-model="filters.priority" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allPriorities') }}</option>
            <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        
        <div class="w-full md:w-40">
          <label class="label text-xs">{{ $t('tasks.filters.type') }}</label>
          <select v-model="filters.type" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allTypes') }}</option>
            <option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        
        <UiButton variant="ghost" size="md" @click="resetFilters" class="h-10 mt-auto">
          {{ $t('tasks.filters.clearFilters') }}
        </UiButton>
      </div>
    </UiCard>

    <!-- Task List -->
    <UiCard class="overflow-hidden">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th class="w-24">{{ $t('tasks.table.id') }}</th>
              <th>{{ $t('tasks.table.title') }}</th>
              <th>{{ $t('tasks.table.project') }}</th>
              <th>{{ $t('tasks.table.status') }}</th>
              <th>{{ $t('tasks.table.priority') }}</th>
              <th>{{ $t('tasks.table.assignee') }}</th>
              <th>{{ $t('taskForm.dueDate') }}</th>
              <th v-if="hasPermission(authStore.role, 'update_status')" class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasksStore.loading">
              <td colspan="8" class="text-center py-12">
                <div class="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </td>
            </tr>
            <tr v-else-if="!tasksStore.tasks.length">
              <td colspan="8">
                <div class="empty-state">
                  <p class="text-content-primary font-medium">{{ $t('tasks.empty.title') }}</p>
                  <p class="text-sm text-content-muted mt-1">{{ $t('tasks.empty.subtitle') }}</p>
                </div>
              </td>
            </tr>
            <tr
              v-else
              v-for="task in tasksStore.tasks"
              :key="task.id"
              class="cursor-pointer"
              @click="navigateTo(`/tasks/${task.id}`)"
            >
              <td class="font-medium text-content-secondary">
                {{ formatTaskNumber(task.task_number) }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span class="text-lg" :title="TASK_TYPE_LABELS[task.type]">{{ TASK_TYPE_ICONS[task.type] }}</span>
                  <span class="font-medium text-content-primary truncate max-w-[200px] lg:max-w-xs">
                    {{ task.title }}
                  </span>
                </div>
              </td>
              <td>
                <div class="text-sm">
                  <p class="text-content-primary truncate max-w-[150px]">{{ task.project?.name ?? '—' }}</p>
                  <p class="text-xs text-content-muted truncate max-w-[150px]">{{ task.client?.company_name }}</p>
                </div>
              </td>
              <td>
                <UiBadge :color="TASK_STATUS_COLORS[task.status].replace('badge-', '') as any" dot :dotColor="TASK_STATUS_DOT[task.status]">
                  {{ TASK_STATUS_LABELS[task.status] }}
                </UiBadge>
              </td>
              <td>
                <UiBadge :color="PRIORITY_COLORS[task.priority].replace('badge-', '') as any">
                  {{ PRIORITY_LABELS[task.priority] }}
                </UiBadge>
              </td>
              <td>
                <div class="flex items-center gap-2" v-if="task.assignee">
                  <UiAvatar :name="task.assignee.full_name" size="sm" />
                  <span class="text-sm text-content-secondary truncate max-w-[100px]">{{ task.assignee.full_name }}</span>
                </div>
                <span v-else class="text-sm text-content-muted">—</span>
              </td>
              <td class="text-sm text-content-secondary">
                <span :class="{'text-danger font-medium': isOverdue(task.due_date, task.status)}">{{ task.due_date ? formatDate(task.due_date) : '—' }}</span>
              </td>
              <td v-if="hasPermission(authStore.role, 'update_status')" class="text-end">
                <div class="flex items-center justify-end gap-2">
                  <UiButton variant="ghost" size="sm" @click.stop="openEditModal(task)" title="Edit">
                    <Edit class="w-4 h-4 text-content-secondary" />
                  </UiButton>
                  <UiButton v-if="hasPermission(authStore.role, 'delete_tasks')" variant="ghost" size="sm" @click.stop="deleteTask(task.id)" title="Delete">
                    <Trash2 class="w-4 h-4 text-danger" />
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="tasksStore.total > perPage" class="px-6 py-4 border-t border-app-border flex items-center justify-between">
        <p class="text-sm text-content-muted">
          {{ $t('tasks.pagination', { start: page * perPage + 1, end: Math.min((page + 1) * perPage, tasksStore.total), total: tasksStore.total }) }}
        </p>
        <div class="flex items-center gap-2">
          <UiButton variant="secondary" size="sm" :disabled="page === 0" @click="page--; fetchData()">
            {{ $t('tasks.previous') }}
          </UiButton>
          <UiButton variant="secondary" size="sm" :disabled="(page + 1) * perPage >= tasksStore.total" @click="page++; fetchData()">
            {{ $t('tasks.next') }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <TaskFormModal
      v-model="isModalOpen"
      :task="selectedTaskForEdit"
      @saved="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Edit, Trash2 } from 'lucide-vue-next'
import {
  TASK_STATUS_OPTIONS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS_DOT,
  PRIORITY_OPTIONS, PRIORITY_LABELS, PRIORITY_COLORS,
  TASK_TYPE_OPTIONS, TASK_TYPE_LABELS, TASK_TYPE_ICONS
} from '~/utils/constants'
import { formatTaskNumber, formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import TaskFormModal from '~/components/tasks/TaskFormModal.vue'
import type { TaskFilters } from '~/types'

definePageMeta({
  middleware: ['auth', 'role']
})

const authStore = useAuthStore()
const tasksStore = useTasksStore()

const page = ref(0)
const perPage = 25
const isModalOpen = ref(false)
const selectedTaskForEdit = ref(null)

function openCreateModal() {
  selectedTaskForEdit.value = null
  isModalOpen.value = true
}

function openEditModal(task: any) {
  selectedTaskForEdit.value = task
  isModalOpen.value = true
}

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr || ['completed', 'cancelled', 'rejected'].includes(status)) return false
  return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
}

async function deleteTask(id: string) {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      await tasksStore.deleteTask(id)
      fetchData()
    } catch(err) {
      alert('Failed to delete task')
    }
  }
}

const filters = ref<TaskFilters>({
  search: '',
  status: '',
  priority: '',
  type: ''
})

async function fetchData() {
  await tasksStore.fetchTasks(filters.value, page.value, perPage)
}

const debouncedFetch = useDebounceFn(() => {
  page.value = 0
  fetchData()
}, 300)

function resetFilters() {
  filters.value = { search: '', status: '', priority: '', type: '' }
  page.value = 0
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>
