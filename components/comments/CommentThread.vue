<template>
  <div class="space-y-4">
    <!-- Tabs -->
    <div class="flex items-center gap-4 border-b border-app-border mb-4">
      <button
        class="pb-3 text-sm font-medium transition-colors relative"
        :class="activeTab === 'public' ? 'text-primary' : 'text-content-secondary hover:text-content-primary'"
        @click="activeTab = 'public'"
      >
        Public Comments
        <span class="ml-1.5 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
          {{ tasksStore.publicComments.length }}
        </span>
        <div v-if="activeTab === 'public'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
      </button>

      <button
        v-if="hasInternalAccess"
        class="pb-3 text-sm font-medium transition-colors relative"
        :class="activeTab === 'internal' ? 'text-primary' : 'text-content-secondary hover:text-content-primary'"
        @click="activeTab = 'internal'"
      >
        Internal Notes
        <span class="ml-1.5 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
          {{ tasksStore.internalComments.length }}
        </span>
        <div v-if="activeTab === 'internal'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
      </button>
    </div>

    <!-- Comment List -->
    <div class="space-y-6">
      <div v-if="!currentComments.length" class="text-center py-8 text-content-muted text-sm">
        No comments yet. Be the first to start the discussion!
      </div>

      <div
        v-else
        v-for="comment in currentComments"
        :key="comment.id"
        class="flex gap-4"
      >
        <UiAvatar :name="comment.author_name" size="md" class="shrink-0 mt-1" />
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between gap-2 mb-1">
            <div class="flex items-baseline gap-2">
              <span class="font-medium text-content-primary">{{ comment.author_name }}</span>
              <span class="text-xs" :class="comment.is_client ? 'text-primary font-medium' : 'text-content-muted'">
                {{ comment.is_client ? $t('comments.clientLabel', 'Client') : (ROLE_LABELS[comment.author_role as any] || comment.author_role) }}
              </span>
            </div>
            <span class="text-xs text-content-muted" :title="formatDateTime(comment.created_at)">
              {{ formatRelative(comment.created_at) }}
            </span>
          </div>
          
          <div
            :class="[
              'p-3.5 rounded-xl text-sm text-content-primary whitespace-pre-wrap break-words border',
              comment.is_internal ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-200'
            ]"
          >
            {{ comment.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Comment -->
    <div v-if="canAddComment" class="mt-8 flex gap-4 pt-4 border-t border-app-border">
      <UiAvatar :name="authStore.profile?.full_name ?? 'User'" size="md" class="shrink-0" />
      <div class="flex-1 min-w-0">
        <textarea
          v-model="newComment"
          class="textarea w-full min-h-[100px]"
          :placeholder="activeTab === 'internal' ? 'Add an internal note (only visible to team)...' : 'Add a public comment (visible to client)...'"
          @keydown.enter.ctrl.prevent="submitComment"
          @keydown.enter.meta.prevent="submitComment"
        />
        <div class="mt-3 flex items-center justify-between">
          <p class="text-xs text-content-muted">
            <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-sans">Ctrl</kbd> + 
            <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-sans">Enter</kbd> to submit
          </p>
          <UiButton
            variant="primary"
            :loading="submitting"
            :disabled="!newComment.trim()"
            @click="submitComment"
          >
            Comment
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ROLE_LABELS } from '~/utils/constants'
import { formatRelative, formatDateTime } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'

const props = defineProps<{ taskId: string }>()

const authStore = useAuthStore()
const tasksStore = useTasksStore()

const activeTab = ref<'public' | 'internal'>('public')
const newComment = ref('')
const submitting = ref(false)

const hasInternalAccess = computed(() => hasPermission(authStore.role, 'view_internal_notes'))
const canAddPublic = computed(() => hasPermission(authStore.role, 'add_public_notes'))
const canAddInternal = computed(() => hasPermission(authStore.role, 'add_internal_notes'))

const canAddComment = computed(() => 
  activeTab.value === 'internal' ? canAddInternal.value : canAddPublic.value
)

const currentComments = computed(() => 
  activeTab.value === 'internal' ? tasksStore.internalComments : tasksStore.publicComments
)

async function submitComment() {
  if (!newComment.value.trim() || submitting.value) return
  submitting.value = true
  try {
    await tasksStore.addComment({
      task_id: props.taskId,
      content: newComment.value.trim(),
      is_internal: activeTab.value === 'internal'
    })
    newComment.value = ''
  } catch (err) {
    console.error('Failed to post comment', err)
  } finally {
    submitting.value = false
  }
}
</script>
