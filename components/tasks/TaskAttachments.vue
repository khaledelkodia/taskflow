<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-app-border pb-3">
      <h3 class="text-sm font-medium text-content-primary">Attachments ({{ tasksStore.attachments.length }})</h3>
      
      <!-- Upload Button -->
      <div v-if="canUpload" class="relative">
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          @change="handleFileUpload" 
          multiple
        />
        <UiButton 
          variant="secondary" 
          size="sm" 
          :loading="uploading"
          @click="$refs.fileInput.click()"
        >
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          </template>
          Upload File
        </UiButton>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="p-3 bg-danger-50 border border-danger/20 rounded-md text-sm text-danger-600">
      {{ error }}
    </div>

    <!-- Attachments List -->
    <div v-if="!tasksStore.attachments.length" class="text-center py-6 text-content-muted text-sm border border-dashed border-gray-300 rounded-lg bg-gray-50">
      No attachments yet.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div 
        v-for="file in tasksStore.attachments" 
        :key="file.id"
        class="flex items-start gap-3 p-3 rounded-lg border border-app-border bg-white hover:border-gray-300 transition-colors group relative"
      >
        <!-- Icon based on type -->
        <div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
          <svg v-if="file.file_type?.startsWith('image/')" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <svg v-else-if="file.file_type === 'application/pdf'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        
        <div class="flex-1 min-w-0">
          <a :href="file.file_url" target="_blank" class="text-sm font-medium text-content-primary hover:text-primary truncate block" :title="file.file_name">
            {{ file.file_name }}
          </a>
          <div class="flex items-center gap-2 mt-0.5 text-xs text-content-muted">
            <span>{{ formatFileSize(file.file_size) }}</span>
            <span>•</span>
            <span class="truncate">{{ file.uploader?.full_name }}</span>
            <span>•</span>
            <span>{{ formatRelative(file.created_at) }}</span>
          </div>
        </div>

        <!-- Delete button -->
        <button 
          v-if="canDelete(file.uploaded_by)"
          class="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-danger hover:bg-danger-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete attachment"
          @click="deleteFile(file.id, file.file_url)"
          :disabled="deleting === file.id"
        >
          <svg v-if="deleting === file.id" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatFileSize, formatRelative } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'

const props = defineProps<{ taskId: string }>()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const deleting = ref<string | null>(null)

const canUpload = computed(() => hasPermission(authStore.role, 'upload_attachments'))

function canDelete(uploaderId: string) {
  return authStore.user?.id === uploaderId || authStore.role === 'super_admin'
}

async function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  
  uploading.value = true
  error.value = ''
  
  try {
    for (const file of Array.from(target.files)) {
      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        error.value = `File ${file.name} exceeds 10MB limit.`
        continue
      }
      await tasksStore.uploadAttachment(props.taskId, file)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to upload file(s)'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function deleteFile(id: string, url: string) {
  if (!confirm('Are you sure you want to delete this attachment?')) return
  
  deleting.value = id
  try {
    await tasksStore.deleteAttachment(id, url)
  } catch (err: any) {
    error.value = err.message || 'Failed to delete file'
  } finally {
    deleting.value = null
  }
}
</script>
