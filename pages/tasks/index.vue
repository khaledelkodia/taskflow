<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('tasks.title') }}</h1>
        <p class="page-subtitle">{{ $t('tasks.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- View toggle (only for the flat, ungrouped view) -->
        <div v-if="groupBy === 'none'" class="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            class="p-2 rounded-lg transition-colors"
            :class="view === 'cards' ? 'bg-primary-50 text-primary' : 'text-content-muted hover:text-content-primary'"
            :aria-label="$t('tasks.viewCards')"
            @click="setView('cards')"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-2 rounded-lg transition-colors"
            :class="view === 'table' ? 'bg-primary-50 text-primary' : 'text-content-muted hover:text-content-primary'"
            :aria-label="$t('tasks.viewTable')"
            @click="setView('table')"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

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
        <div class="w-full sm:w-48">
          <label class="label text-xs">{{ $t('tasks.filters.search') }}</label>
          <input
            v-model="filters.search"
            type="text"
            class="input text-sm"
            :placeholder="$t('tasks.filters.searchPlaceholder')"
            @input="debouncedFetch"
          />
        </div>

        <div class="w-full sm:w-44">
          <label class="label text-xs">{{ $t('tasks.filters.status') }}</label>
          <select v-model="filters.status" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allStatuses') }}</option>
            <option v-for="opt in TASK_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ $t('taskStatus.' + opt.value) }}
            </option>
          </select>
        </div>

        <div class="w-full sm:w-40">
          <label class="label text-xs">{{ $t('tasks.filters.priority') }}</label>
          <select v-model="filters.priority" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allPriorities') }}</option>
            <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ $t('priority.' + opt.value) }}
            </option>
          </select>
        </div>

        <div class="w-full sm:w-40">
          <label class="label text-xs">{{ $t('tasks.filters.type') }}</label>
          <select v-model="filters.type" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('tasks.filters.allTypes') }}</option>
            <option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Sort -->
        <div class="w-full sm:w-44">
          <label class="label text-xs flex items-center gap-1"><ArrowUpDown class="w-3 h-3 shrink-0" /> {{ $t('tasks.sort.label') }}</label>
          <select v-model="sortBy" class="select text-sm">
            <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
              {{ $t('tasks.sort.' + opt.value) }}
            </option>
          </select>
        </div>

        <!-- Group by -->
        <div class="w-full sm:w-44">
          <label class="label text-xs flex items-center gap-1"><Rows3 class="w-3 h-3 shrink-0" /> {{ $t('tasks.group.label') }}</label>
          <select v-model="groupBy" class="select text-sm">
            <option v-for="opt in GROUP_OPTIONS" :key="opt" :value="opt">
              {{ $t('tasks.group.' + opt) }}
            </option>
          </select>
        </div>

        <UiButton variant="ghost" size="md" @click="resetFilters" class="h-10 mt-auto">
          {{ $t('tasks.filters.clearFilters') }}
        </UiButton>
      </div>

      <!-- Active "overdue" indicator -->
      <div v-if="filters.overdue" class="px-4 pb-4 -mt-1">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger-50 text-danger-600 text-xs font-medium">
          <AlertCircle class="w-3.5 h-3.5" />
          {{ $t('tasks.overdueOnly', 'Overdue only') }}
          <button class="hover:text-danger-700" @click="clearOverdue"><X class="w-3.5 h-3.5" /></button>
        </span>
      </div>
    </UiCard>

    <!-- Loading -->
    <div v-if="tasksStore.loading" class="flex justify-center py-16">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <!-- Empty -->
    <UiCard v-else-if="!tasksStore.tasks.length">
      <div class="empty-state">
        <p class="text-content-primary font-medium">{{ $t('tasks.empty.title') }}</p>
        <p class="text-sm text-content-muted mt-1">{{ $t('tasks.empty.subtitle') }}</p>
      </div>
    </UiCard>

    <!-- Grouped view -->
    <div v-else-if="groupBy !== 'none'" class="space-y-6">
      <section v-for="g in groupedTasks" :key="g.key" class="space-y-3">
        <button
          type="button"
          class="flex items-center gap-2 w-full text-start group"
          @click="toggleGroup(g.key)"
        >
          <ChevronDown class="w-4 h-4 text-content-muted transition-transform" :class="collapsed[g.key] ? '-rotate-90' : ''" />
          <span class="font-semibold text-content-primary">{{ g.label }}</span>
          <span class="text-xs font-medium text-content-muted bg-gray-100 rounded-full px-2 py-0.5">{{ g.count }}</span>
          <span class="flex-1 border-t border-gray-100 ms-2" />
        </button>
        <div v-show="!collapsed[g.key]" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <TaskCard
            v-for="task in g.tasks"
            :key="task.id"
            :task="task"
            @open="goTask"
            @edit="openEditModal"
            @delete="deleteTask"
          />
        </div>
      </section>
    </div>

    <!-- Flat cards view -->
    <div v-else-if="view === 'cards'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <TaskCard
        v-for="task in tasksStore.tasks"
        :key="task.id"
        :task="task"
        @open="goTask"
        @edit="openEditModal"
        @delete="deleteTask"
      />
    </div>

    <!-- Flat table view -->
    <UiCard v-else class="overflow-hidden">
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
            <tr
              v-for="task in tasksStore.tasks"
              :key="task.id"
              class="cursor-pointer"
              @click="goTask(task)"
            >
              <td class="font-medium text-content-secondary">
                {{ formatTaskNumber(task.task_number) }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <TaskTypeIcon :type="task.type" :title="TASK_TYPE_LABELS[task.type]" class="w-4 h-4 text-content-muted shrink-0" />
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
                  {{ $t('taskStatus.' + task.status) }}
                </UiBadge>
              </td>
              <td>
                <UiBadge :color="PRIORITY_COLORS[task.priority].replace('badge-', '') as any">
                  {{ $t('priority.' + task.priority) }}
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
                  <UiButton v-if="hasPermission(authStore.role, 'delete_tasks')" variant="ghost" size="sm" @click.stop="deleteTask(task)" title="Delete">
                    <Trash2 class="w-4 h-4 text-danger" />
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Pagination (flat view only) -->
    <div v-if="groupBy === 'none' && tasksStore.total > perPage && !tasksStore.loading" class="flex items-center justify-between px-1">
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

    <TaskFormModal
      v-model="isModalOpen"
      :task="selectedTaskForEdit"
      @saved="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Edit, Trash2, LayoutGrid, List, ChevronDown, ArrowUpDown, Rows3, AlertCircle, X } from 'lucide-vue-next'
import {
  TASK_STATUS_OPTIONS, TASK_STATUS_COLORS, TASK_STATUS_DOT,
  PRIORITY_OPTIONS, PRIORITY_COLORS,
  TASK_TYPE_OPTIONS, TASK_TYPE_LABELS
} from '~/utils/constants'
import { formatTaskNumber, formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import TaskCard from '~/components/tasks/TaskCard.vue'
import TaskTypeIcon from '~/components/tasks/TaskTypeIcon.vue'
import TaskFormModal from '~/components/tasks/TaskFormModal.vue'
import type { TaskFilters, TaskSortField } from '~/types'

definePageMeta({
  middleware: ['auth', 'role']
})

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const route = useRoute()
const { t } = useI18n()
const { confirm } = useConfirm()
const toast = useToast()

const page = ref(0)
const isModalOpen = ref(false)
const selectedTaskForEdit = ref(null)

// ─── Sort & Group ────────────────────────────────────────
const SORT_OPTIONS: { value: string; field: TaskSortField; dir: 'asc' | 'desc' }[] = [
  { value: 'newest',   field: 'created_at', dir: 'desc' },
  { value: 'oldest',   field: 'created_at', dir: 'asc' },
  { value: 'due',      field: 'due_date',   dir: 'asc' },
  { value: 'priority', field: 'priority',   dir: 'asc' },
  { value: 'title',    field: 'title',      dir: 'asc' }
]
const GROUP_OPTIONS = ['none', 'status', 'priority', 'project', 'client', 'assignee'] as const

const sortBy = ref('newest')
const groupBy = ref<(typeof GROUP_OPTIONS)[number]>('none')

// When grouping, we load a larger set so groups are complete (no pagination).
const perPage = computed(() => (groupBy.value === 'none' ? 25 : 500))

// View mode (cards | table), persisted
const view = ref<'cards' | 'table'>('cards')
function setView(v: 'cards' | 'table') {
  view.value = v
  if (import.meta.client) localStorage.setItem('tasksView', v)
}

// ─── Grouping ────────────────────────────────────────────
const STATUS_ORDER: Record<string, number> = Object.fromEntries(TASK_STATUS_OPTIONS.map((o, i) => [o.value, i]))
const PRIORITY_ORDER: Record<string, number> = Object.fromEntries(PRIORITY_OPTIONS.map((o, i) => [o.value, i]))

function groupMeta(task: any): { key: string; label: string; order: number } {
  switch (groupBy.value) {
    case 'status':
      return { key: task.status, label: t('taskStatus.' + task.status), order: STATUS_ORDER[task.status] ?? 99 }
    case 'priority':
      return { key: task.priority, label: t('priority.' + task.priority), order: PRIORITY_ORDER[task.priority] ?? 99 }
    case 'project':
      return task.project
        ? { key: 'p-' + task.project.id, label: task.project.name, order: 0 }
        : { key: '_none', label: t('taskForm.noProject'), order: 99 }
    case 'client':
      return task.client
        ? { key: 'c-' + task.client.id, label: task.client.company_name, order: 0 }
        : { key: '_none', label: '—', order: 99 }
    case 'assignee':
      return task.assignee
        ? { key: 'a-' + task.assignee.id, label: task.assignee.full_name, order: 0 }
        : { key: '_none', label: t('taskForm.unassigned'), order: 99 }
    default:
      return { key: '_all', label: '', order: 0 }
  }
}

const groupedTasks = computed(() => {
  if (groupBy.value === 'none') return []
  const map = new Map<string, { key: string; label: string; order: number; tasks: any[] }>()
  for (const task of tasksStore.tasks) {
    const meta = groupMeta(task)
    if (!map.has(meta.key)) map.set(meta.key, { ...meta, tasks: [] })
    map.get(meta.key)!.tasks.push(task)
  }
  return [...map.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((g) => ({ key: g.key, label: g.label, count: g.tasks.length, tasks: g.tasks }))
})

const collapsed = reactive<Record<string, boolean>>({})
function toggleGroup(key: string) {
  collapsed[key] = !collapsed[key]
}

// ─── Navigation & actions ────────────────────────────────
function goTask(task: any) {
  navigateTo(`/tasks/${task.id}`)
}

function openCreateModal() {
  selectedTaskForEdit.value = null
  isModalOpen.value = true
}

function openEditModal(task: any) {
  selectedTaskForEdit.value = task
  isModalOpen.value = true
}

function isOverdue(dateStr: string | null | undefined, status: string) {
  if (!dateStr || ['completed', 'cancelled', 'rejected'].includes(status)) return false
  return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
}

async function deleteTask(task: any) {
  const ok = await confirm({
    title: t('tasks.deleteTitle', 'Delete task'),
    message: t('tasks.confirmDelete', 'Are you sure you want to delete this task? This action cannot be undone.'),
    confirmText: t('common.delete'),
    variant: 'danger'
  })
  if (!ok) return
  try {
    await tasksStore.deleteTask(task.id)
    toast.success(t('tasks.deleted', 'Task deleted'))
    fetchData()
  } catch (err) {
    toast.error(t('tasks.deleteFailed', 'Failed to delete task'))
  }
}

// ─── Filters & fetching ──────────────────────────────────
const filters = ref<TaskFilters>({
  search: '',
  status: '',
  priority: '',
  type: '',
  overdue: false
})

function currentSort() {
  const opt = SORT_OPTIONS.find((o) => o.value === sortBy.value) ?? SORT_OPTIONS[0]
  return { field: opt.field, dir: opt.dir }
}

async function fetchData() {
  await tasksStore.fetchTasks(filters.value, page.value, perPage.value, currentSort())
}

const debouncedFetch = useDebounceFn(() => {
  page.value = 0
  fetchData()
}, 300)

function resetFilters() {
  filters.value = { search: '', status: '', priority: '', type: '', overdue: false }
  page.value = 0
  fetchData()
}

function clearOverdue() {
  filters.value.overdue = false
  page.value = 0
  fetchData()
}

const ready = ref(false)
watch([sortBy, groupBy], () => {
  if (!ready.value) return
  page.value = 0
  if (import.meta.client) {
    localStorage.setItem('tasksSort', sortBy.value)
    localStorage.setItem('tasksGroup', groupBy.value)
  }
  fetchData()
})

onMounted(() => {
  if (import.meta.client) {
    const savedView = localStorage.getItem('tasksView')
    if (savedView === 'table' || savedView === 'cards') view.value = savedView
    const savedSort = localStorage.getItem('tasksSort')
    if (savedSort && SORT_OPTIONS.some((o) => o.value === savedSort)) sortBy.value = savedSort
    const savedGroup = localStorage.getItem('tasksGroup')
    if (savedGroup && (GROUP_OPTIONS as readonly string[]).includes(savedGroup)) {
      groupBy.value = savedGroup as (typeof GROUP_OPTIONS)[number]
    }
  }

  // Deep-link filters from the dashboard (e.g. /tasks?status=testing or /tasks?overdue=1)
  const q = route.query
  if (typeof q.status === 'string') filters.value.status = q.status as any
  if (typeof q.priority === 'string') filters.value.priority = q.priority as any
  if (q.overdue) filters.value.overdue = true

  ready.value = true
  fetchData()
})
</script>
