<template>
  <UiCard :title="$t('projectUpdates.title', 'Project Updates')">
    <div class="space-y-4">
      <!-- Composer -->
      <div class="flex flex-col gap-2">
        <textarea
          v-model="draft"
          rows="2"
          class="textarea"
          :placeholder="$t('projectUpdates.placeholder', 'Write a quick update…')"
          @keydown.ctrl.enter="post"
          @keydown.meta.enter="post"
        />
        <div class="flex items-center justify-between">
          <span class="text-xs text-content-muted">{{ $t('projectUpdates.hint', 'Ctrl + Enter to post') }}</span>
          <UiButton variant="primary" size="sm" :loading="posting" :disabled="!draft.trim()" @click="post">
            {{ $t('projectUpdates.post', 'Post update') }}
          </UiButton>
        </div>
      </div>

      <!-- List -->
      <div v-if="!store.updates.length" class="text-sm text-content-muted text-center py-6">
        {{ $t('projectUpdates.empty', 'No updates yet.') }}
      </div>
      <ul v-else class="space-y-4">
        <li v-for="u in store.updates" :key="u.id" class="flex gap-3 group">
          <UiAvatar :name="u.author_name" size="sm" class="shrink-0 mt-0.5" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-content-primary">{{ u.author_name }}</span>
              <span class="text-xs text-content-muted">{{ formatRelative(u.created_at) }}</span>
              <button
                v-if="canDelete(u)"
                type="button"
                class="ms-auto opacity-0 group-hover:opacity-100 text-content-muted hover:text-danger transition-opacity"
                :title="$t('common.delete')"
                @click="remove(u)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
            <p class="text-sm text-content-secondary whitespace-pre-wrap break-words mt-0.5" dir="auto">{{ u.content }}</p>
          </div>
        </li>
      </ul>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { formatRelative } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import type { ProjectUpdate } from '~/types'

const props = defineProps<{ projectId: string }>()

const store = useProjectsStore()
const authStore = useAuthStore()
const { t } = useI18n()
const { confirm } = useConfirm()
const toast = useToast()

const draft = ref('')
const posting = ref(false)

function canDelete(u: ProjectUpdate) {
  return u.author_id === authStore.user?.id || hasPermission(authStore.role, 'create_projects')
}

async function post() {
  const content = draft.value.trim()
  if (!content || posting.value) return
  posting.value = true
  try {
    await store.addUpdate(props.projectId, content)
    draft.value = ''
  } catch (e) {
    toast.error(t('projectUpdates.postFailed', 'Failed to post update'))
  } finally {
    posting.value = false
  }
}

async function remove(u: ProjectUpdate) {
  const ok = await confirm({
    message: t('projectUpdates.deleteConfirm', 'Delete this update?'),
    confirmText: t('common.delete'),
    variant: 'danger'
  })
  if (!ok) return
  try {
    await store.deleteUpdate(u.id)
  } catch (e) {
    toast.error(t('common.saveFailed', 'Failed to save'))
  }
}

onMounted(async () => {
  // Degrades gracefully if the project_updates table isn't created yet.
  try {
    await store.fetchUpdates(props.projectId)
  } catch {
    store.updates = []
  }
})
</script>
