<template>
  <UiDropdown align="left" width="auto">
    <template #trigger>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer hover:bg-gray-50 transition-colors"
           :class="colorClass">
        <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
        <span class="text-sm font-medium">{{ currentLabel }}</span>
        <svg class="w-4 h-4 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </template>

    <div class="py-1 min-w-[160px]">
      <div v-if="!allowedTransitions.length" class="px-4 py-2 text-sm text-gray-500">
        No transitions allowed
      </div>
      <button
        v-else
        v-for="status in allowedTransitions"
        :key="status"
        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        @click="updateStatus(status)"
        :disabled="updating"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="TASK_STATUS_DOT[status as keyof typeof TASK_STATUS_DOT]" />
        {{ TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] }}
      </button>
    </div>
  </UiDropdown>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS_DOT, STATUS_TRANSITIONS } from '~/utils/constants'
import type { TaskStatus } from '~/types'
import { hasPermission } from '~/utils/permissions'

const props = defineProps<{
  taskId: string
  currentStatus: TaskStatus
}>()

const emit = defineEmits<{
  updated: [newStatus: TaskStatus]
}>()

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const updating = ref(false)

const currentLabel = computed(() => TASK_STATUS_LABELS[props.currentStatus])
const colorClass = computed(() => {
  const badgeClass = TASK_STATUS_COLORS[props.currentStatus]
  return badgeClass === 'badge-gray' ? 'bg-gray-50 border-gray-200 text-gray-700' :
         badgeClass === 'badge-blue' ? 'bg-blue-50 border-blue-200 text-blue-700' :
         badgeClass === 'badge-green' ? 'bg-green-50 border-green-200 text-green-700' :
         badgeClass === 'badge-yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
         badgeClass === 'badge-red' ? 'bg-red-50 border-red-200 text-red-700' :
         badgeClass === 'badge-purple' ? 'bg-purple-50 border-purple-200 text-purple-700' :
         badgeClass === 'badge-indigo' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
         badgeClass === 'badge-orange' ? 'bg-orange-50 border-orange-200 text-orange-700' : ''
})
const dotClass = computed(() => TASK_STATUS_DOT[props.currentStatus])

const allowedTransitions = computed(() => {
  if (!hasPermission(authStore.role, 'update_status')) return []
  
  // Testers can only approve/reject from testing
  if (authStore.role === 'tester') {
    if (props.currentStatus === 'testing') return ['waiting_client_feedback', 'in_progress']
    return []
  }

  // Developer can't approve/reject new tasks or move to done if it needs testing
  if (authStore.role === 'developer') {
    if (props.currentStatus === 'new') return []
    if (props.currentStatus === 'assigned') return ['in_progress']
    if (props.currentStatus === 'in_progress') return ['development_completed']
    if (props.currentStatus === 'testing') return []
    if (props.currentStatus === 'waiting_client_feedback') return []
  }

  // PM and Admin can do anything allowed by the state machine
  return STATUS_TRANSITIONS[props.currentStatus] || []
})

async function updateStatus(newStatus: TaskStatus) {
  if (updating.value) return
  updating.value = true
  try {
    await tasksStore.updateTask(props.taskId, { status: newStatus })
    
    // Notification logic
    let msg = `Task status updated to ${TASK_STATUS_LABELS[newStatus]}`
    await tasksStore.createNotification(props.taskId, 'status_changed', msg)

    emit('updated', newStatus)
  } catch (err) {
    console.error('Failed to update status', err)
  } finally {
    updating.value = false
  }
}
</script>
