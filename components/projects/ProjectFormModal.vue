<template>
  <UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="isEdit ? $t('projects.editProject') : $t('projects.createProject')" max-width="md">
    <form @submit.prevent="handleSubmit" class="space-y-5">
      
      <!-- Project Name -->
      <div class="form-group">
        <label class="label">{{ $t('projects.projectName') }} <span class="text-danger">*</span></label>
        <input v-model="form.name" type="text" class="input" required :placeholder="$t('projects.projectNamePlaceholder')" />
      </div>

      <!-- Client -->
      <div class="form-group">
        <label class="label">{{ $t('projects.client') }} <span class="text-danger">*</span></label>
        <select v-model="form.client_id" class="select" required :disabled="isEdit">
          <option value="" disabled>{{ $t('taskForm.selectClient') }}</option>
          <option v-for="c in clientsStore.clientOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>

      <!-- Status -->
      <div class="form-group">
        <label class="label">{{ $t('projects.status') }} <span class="text-danger">*</span></label>
        <select v-model="form.status" class="select" required>
          <option value="active">{{ $t('projects.statusActive') }}</option>
          <option value="on_hold">{{ $t('projects.statusOnHold') }}</option>
          <option value="completed">{{ $t('projects.statusCompleted') }}</option>
          <option value="cancelled">{{ $t('projects.statusCancelled') }}</option>
        </select>
      </div>

      <!-- Sales owner -->
      <div class="form-group">
        <label class="label">{{ $t('projects.salesOwner', 'Sales (responsible)') }}</label>
        <select v-model="form.sales_id" class="select">
          <option :value="null">{{ $t('projects.noSalesOwner', 'No sales assigned') }}</option>
          <option v-for="s in projectsStore.salesUsers" :key="s.id" :value="s.id">{{ s.full_name }}</option>
        </select>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="label">{{ $t('projects.description') }}</label>
        <textarea v-model="form.description" class="textarea h-24" :placeholder="$t('projects.descriptionPlaceholder')"></textarea>
      </div>

      <template v-if="error">
        <div class="p-3 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
          {{ error }}
        </div>
      </template>

      <!-- Footer -->
      <div class="flex justify-end gap-3 pt-2">
        <UiButton type="button" variant="secondary" @click="emit('update:modelValue', false)">{{ $t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" :loading="saving">
          {{ isEdit ? $t('common.save') : $t('projects.createProject') }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Project, CreateProjectPayload } from '~/types'

const props = defineProps<{
  modelValue: boolean
  project?: Project | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'saved': [project: Project]
}>()

const isEdit = computed(() => !!props.project)

const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()

const saving = ref(false)
const error = ref('')

const form = ref<Partial<CreateProjectPayload>>({
  name: '',
  client_id: '',
  description: '',
  status: 'active',
  sales_id: null
})

watch(() => props.modelValue, async (val) => {
  if (val) {
    error.value = ''
    if (isEdit.value && props.project) {
      form.value = {
        name: props.project.name,
        client_id: props.project.client_id,
        description: props.project.description || '',
        status: props.project.status,
        sales_id: props.project.sales_id ?? null
      }
    } else {
      form.value = {
        name: '',
        client_id: '',
        description: '',
        status: 'active',
        sales_id: null
      }
    }

    if (!clientsStore.clients.length) await clientsStore.fetchClients()
    if (!projectsStore.salesUsers.length) await projectsStore.fetchSalesUsers()
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const payload = {
      ...form.value,
    } as CreateProjectPayload

    let savedProject: Project
    if (isEdit.value && props.project) {
      savedProject = await projectsStore.updateProject(props.project.id, payload)
    } else {
      savedProject = await projectsStore.createProject(payload)
    }
    
    emit('saved', savedProject)
    emit('update:modelValue', false)
  } catch (err: any) {
    error.value = err.message || 'Failed to save project'
  } finally {
    saving.value = false
  }
}
</script>
