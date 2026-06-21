<template>
  <div class="space-y-6" v-if="projectsStore.current">
    
    <!-- Header / Breadcrumb -->
    <div class="page-header flex-wrap">
      <div>
        <div class="flex items-center gap-2 text-sm text-content-muted mb-2">
          <NuxtLink to="/projects" class="hover:text-primary transition-colors">{{ $t('projects.title') }}</NuxtLink>
          <ChevronRight class="w-4 h-4" />
          <span class="text-content-primary">{{ projectsStore.current.name }}</span>
        </div>
        <h1 class="page-title flex items-center gap-3">
          {{ projectsStore.current.name }}
          <UiBadge :color="PROJECT_STATUS_COLORS[projectsStore.current.status].replace('badge-', '') as any">
            {{ PROJECT_STATUS_LABELS[projectsStore.current.status] }}
          </UiBadge>
        </h1>
        <p class="page-subtitle mt-1 flex items-center gap-2" v-if="projectsStore.current.client">
          <span class="text-content-muted">{{ $t('projects.client') }}:</span>
          <NuxtLink :to="`/clients/${projectsStore.current.client.id}`" class="text-primary hover:underline">
            {{ projectsStore.current.client.company_name }}
          </NuxtLink>
        </p>
        <p v-if="projectsStore.current.description" class="text-sm text-content-secondary mt-3 max-w-3xl">
          {{ projectsStore.current.description }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-3 mt-4 sm:mt-0">
        <div class="flex items-center gap-2">
          <UiButton
            v-if="hasPermission(authStore.role, 'create_tasks')"
            variant="primary"
            @click="isCreateTaskModalOpen = true"
            iconPosition="left"
          >
            <template #icon><Plus class="w-4 h-4" /></template>
            {{ $t('tasks.createTask') }}
          </UiButton>
          
          <!-- Edit & Delete -->
          <UiButton
            v-if="hasPermission(authStore.role, 'create_projects')"
            variant="secondary"
            @click="isEditProjectModalOpen = true"
            iconPosition="left"
          >
            <template #icon><Edit class="w-4 h-4" /></template>
            {{ $t('common.edit') }}
          </UiButton>
          <UiButton
            v-if="hasPermission(authStore.role, 'create_projects')"
            variant="danger"
            @click="deleteProject"
            iconPosition="left"
          >
            <template #icon><Trash2 class="w-4 h-4" /></template>
            {{ $t('common.delete') }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <UiCard>
      <div class="p-4 flex flex-wrap gap-4 items-end border-b border-app-border">
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
          <select v-model="filters.status" class="select text-sm" @change="fetchTasks">
            <option value="">{{ $t('tasks.filters.allStatuses') }}</option>
            <option v-for="opt in TASK_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <UiButton variant="ghost" size="md" @click="resetFilters" class="h-10 mt-auto">
          {{ $t('tasks.filters.clearFilters') }}
        </UiButton>
      </div>

      <!-- Tasks Table -->
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th class="w-24">{{ $t('tasks.table.id') }}</th>
              <th>{{ $t('tasks.table.title') }}</th>
              <th>{{ $t('tasks.table.status') }}</th>
              <th>{{ $t('tasks.table.priority') }}</th>
              <th>{{ $t('tasks.table.created') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasksStore.loading">
              <td colspan="5" class="text-center py-12">
                <div class="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </td>
            </tr>
            <tr v-else-if="!tasksStore.tasks.length">
              <td colspan="5">
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
                <UiBadge :color="TASK_STATUS_COLORS[task.status].replace('badge-', '') as any" dot :dotColor="TASK_STATUS_DOT[task.status]">
                  {{ TASK_STATUS_LABELS[task.status] }}
                </UiBadge>
              </td>
              <td>
                <UiBadge :color="PRIORITY_COLORS[task.priority].replace('badge-', '') as any">
                  {{ PRIORITY_LABELS[task.priority] }}
                </UiBadge>
              </td>
              <td class="text-sm text-content-secondary">
                {{ formatDate(task.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <TaskFormModal
      v-model="isCreateTaskModalOpen"
      :preSelectedClientId="projectsStore.current.client_id"
      @saved="fetchTasks"
    />

    <ProjectFormModal
      v-model="isEditProjectModalOpen"
      :project="projectsStore.current"
      @saved="fetchProjectDetails"
    />
  </div>
  <div v-else-if="projectsStore.loading" class="flex items-center justify-center h-64">
    <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ChevronRight, Plus, Edit, Trash2 } from 'lucide-vue-next'
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
  TASK_STATUS_OPTIONS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS_DOT,
  PRIORITY_LABELS, PRIORITY_COLORS,
  TASK_TYPE_LABELS, TASK_TYPE_ICONS
} from '~/utils/constants'
import { formatTaskNumber, formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import { useI18n } from 'vue-i18n'
import TaskFormModal from '~/components/tasks/TaskFormModal.vue'
import ProjectFormModal from '~/components/projects/ProjectFormModal.vue'
import type { TaskFilters } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const projectId = route.params.id as string
const { t } = useI18n()

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

const isCreateTaskModalOpen = ref(false)
const isEditProjectModalOpen = ref(false)

const filters = ref<TaskFilters>({
  project_id: projectId,
  search: '',
  status: ''
})

async function fetchProjectDetails() {
  await projectsStore.fetchProject(projectId)
}

async function fetchTasks() {
  await tasksStore.fetchTasks(filters.value, 0, 1000)
}

const debouncedFetch = useDebounceFn(() => {
  fetchTasks()
}, 300)

function resetFilters() {
  filters.value = { project_id: projectId, search: '', status: '' }
  fetchTasks()
}

async function deleteProject() {
  if (confirm(t('projects.confirmDelete'))) {
    try {
      await projectsStore.deleteProject(projectId)
      navigateTo('/projects')
    } catch (err) {
      alert(t('projects.deleteFailed'))
    }
  }
}

onMounted(async () => {
  await fetchProjectDetails()
  await fetchTasks()
})
</script>
