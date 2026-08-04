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
      <div
        v-for="project in projectsStore.projects"
        :key="project.id"
        class="project-card group"
        :class="{ 'project-card--completed': project.status === 'completed' }"
        @click="navigateTo(`/projects/${project.id}`)"
      >
        <!-- Decorative top-corner sheen -->
        <span class="project-card__glow" aria-hidden="true" />

        <div class="p-5 flex-1 relative">
          <div class="flex items-start justify-between gap-4 mb-3">
            <h3 class="text-lg font-semibold text-white leading-tight line-clamp-2">
              {{ project.name }}
            </h3>
            <span class="status-pill">
              <span class="status-pill__dot" :style="{ background: PROJECT_STATUS_DOT[project.status] }" />
              {{ $t('projectStatus.' + project.status) }}
            </span>
          </div>

          <p v-if="project.description" class="project-card__desc text-sm line-clamp-3 mb-4">
            {{ project.description }}
          </p>
        </div>

        <div class="project-card__footer px-5 py-4 flex items-center justify-between">
          <div class="text-sm min-w-0">
            <span class="project-card__label text-xs block mb-0.5">{{ $t('projects.client') }}</span>
            <span class="font-semibold text-white truncate max-w-[150px] inline-block">
              {{ project.client?.company_name }}
            </span>
          </div>
          <div class="text-sm text-end shrink-0">
            <span class="project-card__label text-xs block mb-0.5">{{ $t('projects.created') }}</span>
            <span class="text-white/90 font-medium">
              {{ formatDate(project.created_at) }}
            </span>
          </div>
        </div>
      </div>
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
import { formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import ProjectFormModal from '~/components/projects/ProjectFormModal.vue'
import type { ProjectStatus } from '~/types'

// Status dot colors, tuned for contrast on the blue card
const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  active: '#34D399',
  on_hold: '#FBBF24',
  completed: '#7DD3FC',
  cancelled: '#FCA5A5'
}

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

<style scoped>
.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: 1rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: linear-gradient(150deg, #1D4ED8 0%, #2563EB 42%, #4F46E5 100%);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.06),
    0 14px 32px -12px rgba(37, 99, 235, 0.55);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.28s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.08),
    0 24px 46px -12px rgba(37, 99, 235, 0.68);
}

/* Soft light sheen in the top corner for a premium feel */
.project-card__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(90% 62% at 100% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0) 55%);
}

.project-card__footer {
  position: relative;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(2, 6, 23, 0.12);
}

/* Muted text tints (blue by default, green on completed cards) */
.project-card__desc { color: rgba(219, 234, 254, 0.8); }
.project-card__label { color: rgba(191, 219, 254, 0.75); }

/* Completed → premium green gradient */
.project-card--completed {
  background: linear-gradient(150deg, #047857 0%, #059669 42%, #10B981 100%);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.06),
    0 14px 32px -12px rgba(16, 185, 129, 0.55);
}
.project-card--completed:hover {
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.08),
    0 24px 46px -12px rgba(16, 185, 129, 0.68);
}
.project-card--completed .project-card__desc { color: rgba(209, 250, 229, 0.85); }
.project-card--completed .project-card__label { color: rgba(167, 243, 208, 0.8); }

.status-pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.status-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  display: inline-block;
  flex-shrink: 0;
}
</style>
