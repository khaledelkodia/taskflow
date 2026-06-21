<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('projects.title') }}</h1>
        <p class="page-subtitle">{{ $t('projects.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UiButton
          v-if="hasPermission(authStore.role, 'create_projects')"
          variant="primary"
          @click="isCreateModalOpen = true"
        >
          {{ $t('projects.createProject') }}
        </UiButton>
      </div>
    </div>

    <!-- Filters -->
    <UiCard class="mb-6">
      <div class="p-4 flex gap-4">
        <div class="w-full md:max-w-xs">
          <label class="label text-xs">{{ $t('projects.filterByClient') }}</label>
          <select v-model="selectedClient" class="select text-sm" @change="fetchData">
            <option value="">{{ $t('projects.allClients') }}</option>
            <option v-for="client in clientsStore.clientOptions" :key="client.value" :value="client.value">
              {{ client.label }}
            </option>
          </select>
        </div>
      </div>
    </UiCard>

    <!-- Projects Grid -->
    <div v-if="projectsStore.loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
    
    <div v-else-if="!projectsStore.projects.length" class="empty-state bg-white border border-app-border rounded-xl">
      <p class="text-content-primary font-medium">{{ $t('projects.empty.title') }}</p>
      <p class="text-sm text-content-muted mt-1">{{ $t('projects.empty.subtitle') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiCard
        v-for="project in projectsStore.projects"
        :key="project.id"
        hoverable
        class="flex flex-col cursor-pointer"
        @click="navigateTo(`/projects/${project.id}`)"
      >
        <div class="p-5 flex-1">
          <div class="flex items-start justify-between gap-4 mb-3">
            <h3 class="text-lg font-semibold text-content-primary leading-tight line-clamp-2">
              {{ project.name }}
            </h3>
            <UiBadge :color="PROJECT_STATUS_COLORS[project.status].replace('badge-', '') as any" class="shrink-0">
              {{ PROJECT_STATUS_LABELS[project.status] }}
            </UiBadge>
          </div>
          
          <p v-if="project.description" class="text-sm text-content-secondary line-clamp-3 mb-4">
            {{ project.description }}
          </p>
        </div>
        
        <div class="px-5 py-4 border-t border-app-border bg-app-bg flex items-center justify-between rounded-b-md">
          <div class="text-sm">
            <span class="text-content-muted text-xs block mb-0.5">{{ $t('projects.client') }}</span>
            <span class="font-medium text-content-primary truncate max-w-[150px] inline-block">
              {{ project.client?.company_name }}
            </span>
          </div>
          <div class="text-sm text-end">
            <span class="text-content-muted text-xs block mb-0.5">{{ $t('projects.created') }}</span>
            <span class="text-content-secondary">
              {{ formatDate(project.created_at) }}
            </span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Project Modal -->
    <ProjectFormModal
      v-model="isCreateModalOpen"
      @saved="handleProjectSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '~/utils/constants'
import { formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import ProjectFormModal from '~/components/projects/ProjectFormModal.vue'

definePageMeta({
  middleware: ['auth', 'role']
})

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()

const selectedClient = ref('')
const isCreateModalOpen = ref(false)

async function fetchData() {
  await projectsStore.fetchProjects(selectedClient.value)
}

function handleProjectSaved() {
  isCreateModalOpen.value = false
  fetchData()
}

onMounted(async () => {
  // Need clients for filter dropdown
  if (!clientsStore.clients.length) {
    await clientsStore.fetchClients()
  }
  await fetchData()
})
</script>
