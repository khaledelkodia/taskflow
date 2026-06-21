<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('dashboard.title') }}</h1>
        <p class="page-subtitle">{{ $t('dashboard.welcome', { name: authStore.profile?.full_name?.split(' ')[0] ?? 'User' }) }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UiButton variant="secondary" iconPosition="left" @click="refreshData" :loading="loading">
          <template #icon><RefreshCw class="w-4 h-4" /></template>
          {{ $t('dashboard.refresh') }}
        </UiButton>
        <NuxtLink to="/tasks">
          <UiButton variant="primary">{{ $t('dashboard.viewAllTasks') }}</UiButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="error" class="p-4 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
      {{ error }}
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        :title="$t('dashboard.stats.totalActiveTasks')"
        :value="stats.active_tasks"
        :icon="CheckSquare"
        color="primary"
        :loading="loading"
      />
      <StatCard
        :title="$t('dashboard.stats.overdueTasks')"
        :value="stats.overdue_tasks"
        :icon="AlertCircle"
        color="danger"
        :loading="loading"
      />
      <StatCard
        :title="$t('dashboard.stats.tasksInTesting')"
        :value="stats.tasks_in_testing"
        :icon="Activity"
        color="warning"
        :loading="loading"
      />
      <StatCard
        :title="$t('dashboard.stats.completedTasks')"
        :value="stats.completed_tasks"
        :icon="CheckCircle"
        color="success"
        :loading="loading"
      />
      <StatCard
        :title="$t('dashboard.stats.activeProjects')"
        :value="stats.active_projects"
        :icon="FolderOpen"
        color="purple"
        :loading="loading"
      />
      <StatCard
        :title="$t('dashboard.stats.totalClients')"
        :value="stats.total_clients"
        :icon="Building2"
        color="gray"
        :loading="loading"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TasksByStatusChart :data="statusBreakdown" :loading="loading" />
      <TasksByPriorityChart :data="priorityBreakdown" :loading="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckSquare, AlertCircle, Activity, CheckCircle, FolderOpen, Building2, RefreshCw
} from 'lucide-vue-next'
import StatCard from '~/components/dashboard/StatCard.vue'
import TasksByStatusChart from '~/components/dashboard/TasksByStatusChart.vue'
import TasksByPriorityChart from '~/components/dashboard/TasksByPriorityChart.vue'

const authStore = useAuthStore()
const tasksStore = useTasksStore()

const loading = ref(true)
const error = ref('')

const stats = ref({
  total_clients: 0,
  active_projects: 0,
  active_tasks: 0,
  overdue_tasks: 0,
  completed_tasks: 0,
  tasks_in_testing: 0
})

const statusBreakdown = ref<{status: string, count: number}[]>([])
const priorityBreakdown = ref<{priority: string, count: number}[]>([])

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [fetchedStats, fetchedStatus, fetchedPriority] = await Promise.all([
      tasksStore.fetchStats(),
      tasksStore.fetchStatusBreakdown(),
      tasksStore.fetchPriorityBreakdown()
    ])
    
    stats.value = fetchedStats
    statusBreakdown.value = fetchedStatus
    priorityBreakdown.value = fetchedPriority
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

function refreshData() {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
