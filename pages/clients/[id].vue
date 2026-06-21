<template>
  <div class="space-y-6" v-if="clientsStore.current">
    
    <!-- Header / Breadcrumb -->
    <div class="page-header">
      <div>
        <div class="flex items-center gap-2 text-sm text-content-muted mb-2">
          <NuxtLink to="/clients" class="hover:text-primary transition-colors">{{ $t('clients.title') }}</NuxtLink>
          <ChevronRight class="w-4 h-4" />
          <span class="text-content-primary">{{ clientsStore.current.company_name }}</span>
        </div>
        <h1 class="page-title flex items-center gap-3">
          {{ clientsStore.current.company_name }}
          <UiBadge :color="CLIENT_STATUS_COLORS[clientsStore.current.status].replace('badge-', '') as any">
            {{ CLIENT_STATUS_LABELS[clientsStore.current.status] }}
          </UiBadge>
        </h1>
        <p class="page-subtitle mt-1 flex items-center gap-4">
          <span class="flex items-center gap-1.5"><User class="w-4 h-4" /> {{ clientsStore.current.contact_person }}</span>
          <a v-if="clientsStore.current.email" :href="`mailto:${clientsStore.current.email}`" class="flex items-center gap-1.5 text-primary hover:underline">
            <Mail class="w-4 h-4" /> {{ clientsStore.current.email }}
          </a>
          <a v-if="clientsStore.current.phone" :href="`tel:${clientsStore.current.phone}`" class="flex items-center gap-1.5 text-content-secondary hover:text-content-primary">
            <Phone class="w-4 h-4" /> {{ clientsStore.current.phone }}
          </a>
        </p>
      </div>
      <div class="flex flex-col items-end gap-3">
        <div class="flex items-center gap-2">
          <UiButton
            variant="secondary"
            size="sm"
            @click="copyPortalLink"
            iconPosition="left"
            title="Copy Portal Link for Client"
          >
            <template #icon><Link class="w-4 h-4" /></template>
            {{ copied ? $t('common.copied') : $t('clients.copyLink') }}
          </UiButton>
          <UiButton
            v-if="hasPermission(authStore.role, 'create_tasks')"
            variant="primary"
            @click="isCreateTaskModalOpen = true"
            iconPosition="left"
          >
            <template #icon><Plus class="w-4 h-4" /></template>
            {{ $t('tasks.createTask') }}
          </UiButton>
          <UiButton
            v-if="hasPermission(authStore.role, 'manage_clients')"
            variant="secondary"
            @click="isEditClientModalOpen = true"
            iconPosition="left"
          >
            <template #icon><Edit class="w-4 h-4" /></template>
            {{ $t('common.edit') }}
          </UiButton>
          <UiButton
            v-if="hasPermission(authStore.role, 'manage_clients')"
            variant="danger"
            @click="deleteClient"
            iconPosition="left"
          >
            <template #icon><Trash2 class="w-4 h-4" /></template>
            {{ $t('common.delete') }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Progress & Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Progress Card -->
      <UiCard class="md:col-span-2">
        <div class="p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-content-secondary">Task Progress</h3>
            <span class="text-2xl font-bold text-primary">{{ progressPercentage }}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <div class="bg-primary h-3 rounded-full transition-all duration-500 ease-out" :style="{ width: `${progressPercentage}%` }"></div>
          </div>
          <p class="text-xs text-content-muted">{{ completedTasksCount }} completed out of {{ totalTasksCount }} total tasks</p>
        </div>
      </UiCard>

      <UiCard>
        <div class="p-6 text-center">
          <div class="w-10 h-10 mx-auto bg-warning-50 text-warning-600 rounded-full flex items-center justify-center mb-2">
            <Clock class="w-5 h-5" />
          </div>
          <p class="text-sm font-medium text-content-secondary">In Progress</p>
          <p class="text-2xl font-bold mt-1">{{ inProgressTasksCount }}</p>
        </div>
      </UiCard>

      <UiCard>
        <div class="p-6 text-center">
          <div class="w-10 h-10 mx-auto bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-2">
            <Inbox class="w-5 h-5" />
          </div>
          <p class="text-sm font-medium text-content-secondary">New Tasks</p>
          <p class="text-2xl font-bold mt-1">{{ newTasksCount }}</p>
        </div>
      </UiCard>
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
      :preSelectedClientId="clientsStore.current?.id"
      @saved="fetchTasks"
    />

    <ClientFormModal
      v-model="isEditClientModalOpen"
      :client="clientsStore.current"
      @saved="fetchClientDetails"
    />
  </div>
  <div v-else-if="clientsStore.loading" class="flex items-center justify-center h-64">
    <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ChevronRight, Mail, Phone, User, Plus, Clock, Inbox, Link, Edit, Trash2 } from 'lucide-vue-next'
import {
  CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS,
  TASK_STATUS_OPTIONS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS_DOT,
  PRIORITY_LABELS, PRIORITY_COLORS,
  TASK_TYPE_LABELS, TASK_TYPE_ICONS
} from '~/utils/constants'
import { formatTaskNumber, formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import { useI18n } from 'vue-i18n'
import TaskFormModal from '~/components/tasks/TaskFormModal.vue'
import ClientFormModal from '~/components/clients/ClientFormModal.vue'
import type { TaskFilters } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const clientId = route.params.id as string

const authStore = useAuthStore()
const clientsStore = useClientsStore()
const tasksStore = useTasksStore()
const { t } = useI18n()

const isCreateTaskModalOpen = ref(false)
const isEditClientModalOpen = ref(false)
const copied = ref(false)

function copyPortalLink() {
  if (!clientsStore.current?.portal_token) return
  const url = `${window.location.origin}/portal/${clientsStore.current.portal_token}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const filters = ref<TaskFilters>({
  client_id: clientId,
  search: '',
  status: ''
})

async function fetchTasks() {
  await tasksStore.fetchTasks(filters.value, 0, 1000)
}

const debouncedFetch = useDebounceFn(() => {
  fetchTasks()
}, 300)

function resetFilters() {
  filters.value = { client_id: clientId, search: '', status: '' }
  fetchTasks()
}

async function fetchClientDetails() {
  await clientsStore.fetchClient(clientId)
}

async function deleteClient() {
  if (confirm(t('common.delete') + '?')) {
    try {
      await clientsStore.deleteClient(clientId)
      navigateTo('/clients')
    } catch (err) {
      alert(t('clientForm.saveFailed'))
    }
  }
}

onMounted(async () => {
  await fetchClientDetails()
  await fetchTasks()
})

// Progress Stats
const totalTasksCount = computed(() => tasksStore.tasks.length)
const completedTasksCount = computed(() => tasksStore.tasks.filter(t => t.status === 'completed' || t.status === 'rejected' || t.status === 'cancelled').length)
const inProgressTasksCount = computed(() => tasksStore.tasks.filter(t => ['in_progress', 'development_completed', 'testing', 'waiting_client_feedback'].includes(t.status)).length)
const newTasksCount = computed(() => tasksStore.tasks.filter(t => ['new', 'under_review', 'approved', 'assigned'].includes(t.status)).length)

const progressPercentage = computed(() => {
  if (totalTasksCount.value === 0) return 0
  return Math.round((completedTasksCount.value / totalTasksCount.value) * 100)
})

</script>
