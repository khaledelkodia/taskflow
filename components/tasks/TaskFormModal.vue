<template>
  <UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="isEdit ? $t('taskForm.editTitle') : $t('taskForm.createTitle')" max-width="xl">
    <form @submit.prevent="handleSubmit" class="space-y-5">
      
      <!-- Title -->
      <div class="form-group">
        <label class="label">{{ $t('taskForm.taskTitle') }} <span class="text-danger">*</span></label>
        <input v-model="form.title" type="text" class="input" required :placeholder="$t('taskForm.taskTitlePlaceholder')" />
      </div>

      <!-- Client (only when not pre-selected) -->
      <div class="form-group" v-if="!preSelectedClientId">
        <label class="label">{{ $t('taskForm.client') }} <span class="text-danger">*</span></label>
        <select v-model="form.client_id" class="select" required :disabled="isEdit">
          <option value="" disabled>{{ $t('taskForm.selectClient') }}</option>
          <option v-for="c in clientsStore.clientOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>

      <!-- Project filtered by selected client (hidden when opened from within a project) -->
      <div class="form-group" v-if="!preSelectedProjectId">
        <label class="label">{{ $t('taskForm.project') }}</label>
        <select v-model="form.project_id" class="select" :disabled="!form.client_id || projectsStore.loading">
          <option value="">{{ $t('taskForm.noProject') }}</option>
          <option v-for="p in projectsStore.projectOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Type -->
        <div class="form-group">
          <label class="label">{{ $t('taskForm.type') }} <span class="text-danger">*</span></label>
          <select v-model="form.type" class="select" required>
            <option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- Priority -->
        <div class="form-group">
          <label class="label">{{ $t('taskForm.priority') }} <span class="text-danger">*</span></label>
          <select v-model="form.priority" class="select" required>
            <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">{{ $t('priority.' + opt.value) }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Assignee -->
        <div class="form-group">
          <label class="label flex items-center gap-2">
            {{ $t('taskForm.assignee') }}
            <span class="text-xs font-normal text-content-muted">{{ $t('taskForm.optional', '(optional)') }}</span>
          </label>
          <select v-model="form.assigned_to" class="select">
            <option value="">{{ $t('taskForm.unassigned') }}</option>
            <option v-for="m in tasksStore.members" :key="m.id" :value="m.id">{{ m.full_name }}</option>
          </select>
        </div>

        <!-- Estimated hours -->
        <div class="form-group">
          <label class="label flex items-center gap-2">
            {{ $t('taskForm.estimatedHours') }}
            <span class="text-xs font-normal text-content-muted">{{ $t('taskForm.optional', '(optional)') }}</span>
          </label>
          <input v-model="estimatedHours" type="number" min="0" step="0.5" class="input" :placeholder="$t('taskForm.estimatedHoursPlaceholder')" />
        </div>
      </div>

      <!-- Due Date (optional) -->
      <div class="form-group">
        <label class="label flex items-center gap-2">
          {{ $t('taskForm.dueDate') }}
          <span class="text-xs font-normal text-content-muted">{{ $t('taskForm.optional', '(optional)') }}</span>
        </label>
        <input v-model="form.due_date" type="date" class="input" />
        <p class="text-xs text-content-muted mt-1">{{ $t('taskForm.dueDateHint', 'Leave empty if there is no fixed date yet (e.g. waiting on the client).') }}</p>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="label">{{ $t('taskForm.description') }}</label>
        <textarea v-model="form.description" class="textarea h-28" :placeholder="$t('taskForm.descriptionPlaceholder')"></textarea>
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
          {{ isEdit ? $t('taskForm.saveChanges') : $t('tasks.createTask') }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TASK_TYPE_OPTIONS, PRIORITY_OPTIONS } from '~/utils/constants'
import type { Task, CreateTaskPayload } from '~/types'

const props = defineProps<{
  modelValue: boolean
  task?: Task | null
  preSelectedClientId?: string
  preSelectedProjectId?: string
}>()

// Guards the client watcher from wiping a pre-selected project on open.
const initializing = ref(false)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'saved': [task: Task]
}>()

const isEdit = computed(() => !!props.task)

const tasksStore = useTasksStore()
const clientsStore = useClientsStore()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const { t } = useI18n()

const saving = ref(false)
const error = ref('')

// Estimated hours is kept as a string (from the number input) and converted on submit.
const estimatedHours = ref('')

const form = ref<Partial<CreateTaskPayload>>({
  title: '',
  description: '',
  client_id: '',
  project_id: '',
  type: 'feature',
  priority: 'medium',
  status: 'new',
  assigned_to: '',
  due_date: ''
})

watch(() => props.modelValue, async (val) => {
  if (val) {
    error.value = ''
    initializing.value = true
    if (isEdit.value && props.task) {
      form.value = {
        title: props.task.title,
        description: props.task.description || '',
        client_id: props.task.client_id,
        project_id: props.task.project_id || '',
        type: props.task.type,
        priority: props.task.priority,
        status: props.task.status,
        assigned_to: props.task.assigned_to || '',
        due_date: props.task.due_date || ''
      }
      estimatedHours.value = props.task.estimated_hours != null ? String(props.task.estimated_hours) : ''
    } else {
      form.value = {
        title: '',
        description: '',
        client_id: props.preSelectedClientId || '',
        project_id: props.preSelectedProjectId || '',
        type: 'feature',
        priority: 'medium',
        status: 'new',
        assigned_to: '',
        due_date: ''
      }
      estimatedHours.value = ''
    }

    await tasksStore.fetchMembers()
    if (!clientsStore.clients.length) await clientsStore.fetchClients()
    if (form.value.client_id) await projectsStore.fetchProjects(form.value.client_id)
    initializing.value = false
  }
})

watch(() => form.value.client_id, async (clientId, oldClientId) => {
  if (!props.modelValue) return
  // Skip while opening (prevents wiping a pre-selected project)
  if (initializing.value) return
  if (clientId !== oldClientId) form.value.project_id = ''
  if (clientId) {
    await projectsStore.fetchProjects(clientId)
  } else {
    projectsStore.projects = []
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const prevAssignee = props.task?.assigned_to ?? null
    const prevEstimate = props.task?.estimated_hours ?? null

    const payload = {
      ...form.value,
      project_id: form.value.project_id || null,
      due_date: form.value.due_date || null,
      assigned_to: form.value.assigned_to || null,
      estimated_hours: estimatedHours.value === '' ? null : Number(estimatedHours.value),
    } as CreateTaskPayload

    let savedTask: Task
    if (isEdit.value && props.task) {
      savedTask = await tasksStore.updateTask(props.task.id, payload as any)
    } else {
      savedTask = await tasksStore.createTask(payload)
    }

    const actorName = authStore.profile?.full_name ?? 'Unknown'
    const newAssignee = payload.assigned_to ?? null
    const newEstimate = payload.estimated_hours ?? null

    // Record & notify assignment changes
    if (newAssignee && newAssignee !== prevAssignee) {
      await tasksStore.addHistory(savedTask.id, 'assigned_to', prevAssignee, newAssignee, actorName)
      await tasksStore.createNotification(
        savedTask.id,
        'task_assigned',
        `${t('taskForm.assignedNotif', 'You were assigned to a task')}: ${savedTask.title}`
      )
    }

    // Record estimate changes on edit
    if (isEdit.value && Number(prevEstimate) !== Number(newEstimate)) {
      await tasksStore.addHistory(
        savedTask.id,
        'estimated_hours',
        prevEstimate != null ? String(prevEstimate) : null,
        newEstimate != null ? String(newEstimate) : null,
        actorName
      )
    }

    emit('saved', savedTask)
    emit('update:modelValue', false)
  } catch (err: any) {
    error.value = err.message || 'Failed to save task'
  } finally {
    saving.value = false
  }
}
</script>
