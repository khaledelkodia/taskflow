<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('users.title', 'User Management') }}</h1>
        <p class="page-subtitle">{{ $t('users.subtitle', 'Manage system users, roles, and access.') }}</p>
      </div>
      <UiButton variant="primary" @click="showCreate = true">
        {{ $t('users.newUser', 'New User') }}
      </UiButton>
    </div>

    <UiCard>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('users.table.user', 'User') }}</th>
              <th>{{ $t('users.table.email', 'Email') }}</th>
              <th>{{ $t('users.table.role', 'Role') }}</th>
              <th>{{ $t('users.table.status', 'Status') }}</th>
              <th>{{ $t('users.table.joined', 'Joined') }}</th>
              <th class="text-end">{{ $t('users.table.actions', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-12">
                <div class="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </td>
            </tr>
            <tr
              v-else
              v-for="user in users"
              :key="user.id"
            >
              <td>
                <div class="flex items-center gap-3">
                  <UiAvatar :name="user.full_name" :avatar-url="user.avatar_url" size="sm" />
                  <span class="font-medium text-content-primary">{{ user.full_name }}</span>
                </div>
              </td>
              <td class="text-content-secondary">{{ user.email }}</td>
              <td>
                <UiDropdown align="right" width="md" :ref="(el: any) => setDropRef(user.id, el)">
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-between gap-2 h-9 w-44 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-content-primary hover:border-primary-300 hover:bg-primary-50/40 transition disabled:opacity-50"
                      :disabled="updating === user.id"
                    >
                      <span class="flex items-center gap-2 truncate">
                        <span class="w-2 h-2 rounded-full shrink-0" :class="roleDot(user.role)" />
                        {{ ROLE_LABELS[user.role] }}
                      </span>
                      <svg class="w-4 h-4 text-content-muted shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8l4 4 4-4" /></svg>
                    </button>
                  </template>

                  <button
                    v-for="(label, value) in ROLE_LABELS"
                    :key="value"
                    type="button"
                    @click="selectRole(user, value as UserRole)"
                    class="w-full text-start px-3 py-2 text-sm flex items-center gap-2.5 transition-colors"
                    :class="user.role === value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-content-secondary hover:bg-gray-50 hover:text-content-primary'"
                  >
                    <span class="w-2 h-2 rounded-full shrink-0" :class="roleDot(value as UserRole)" />
                    <span class="truncate">{{ label }}</span>
                    <svg v-if="user.role === value" class="ms-auto w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  </button>
                </UiDropdown>
              </td>
              <td>
                <UiBadge :color="user.is_active ? 'green' : 'gray'" dot>
                  {{ user.is_active ? $t('users.status.active', 'Active') : $t('users.status.inactive', 'Inactive') }}
                </UiBadge>
              </td>
              <td class="text-sm text-content-secondary">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="text-end space-x-1">
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="text-content-secondary hover:bg-gray-100"
                  @click="openEdit(user)"
                  :disabled="updating === user.id"
                >
                  {{ $t('common.edit', 'Edit') }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="text-primary hover:bg-primary-50"
                  @click="openReset(user)"
                  :disabled="updating === user.id"
                >
                  {{ $t('users.actions.resetPassword', 'Reset password') }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :class="user.is_active ? 'text-danger hover:bg-danger-50 hover:text-danger-700' : 'text-success hover:bg-success-50 hover:text-success-700'"
                  @click="toggleStatus(user.id, !user.is_active)"
                  :disabled="updating === user.id"
                >
                  {{ user.is_active ? $t('users.actions.deactivate', 'Deactivate') : $t('users.actions.activate', 'Activate') }}
                </UiButton>
                <UiButton
                  v-if="user.id !== currentUserId"
                  variant="ghost"
                  size="sm"
                  class="text-danger hover:bg-danger-50 hover:text-danger-700"
                  @click="openDelete(user)"
                  :disabled="updating === user.id"
                >
                  {{ $t('common.delete', 'Delete') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Create User Modal -->
    <UiModal v-model="showCreate" :title="$t('users.newUser', 'New User')" max-width="md">
      <form @submit.prevent="createUser" class="space-y-5">
        <div class="form-group">
          <label class="label">{{ $t('users.form.fullName', 'Full name') }} <span class="text-danger">*</span></label>
          <input v-model="newUser.full_name" type="text" class="input" required />
        </div>
        <div class="form-group">
          <label class="label">{{ $t('users.form.email', 'Email') }} <span class="text-danger">*</span></label>
          <input v-model="newUser.email" type="email" class="input" required autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="label">{{ $t('users.form.password', 'Password') }} <span class="text-danger">*</span></label>
          <input v-model="newUser.password" type="password" class="input" required minlength="8" autocomplete="new-password" />
          <p class="text-xs text-content-muted mt-1">{{ $t('users.form.passwordHint', 'At least 8 characters.') }}</p>
        </div>
        <div class="form-group">
          <label class="label">{{ $t('users.form.role', 'Role') }} <span class="text-danger">*</span></label>
          <select v-model="newUser.role" class="select" required>
            <option v-for="(label, value) in ROLE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>

        <div v-if="createError" class="p-3 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
          {{ createError }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UiButton type="button" variant="secondary" @click="showCreate = false">{{ $t('common.cancel', 'Cancel') }}</UiButton>
          <UiButton type="submit" variant="primary" :loading="creating">{{ $t('users.newUser', 'New User') }}</UiButton>
        </div>
      </form>
    </UiModal>

    <!-- Reset Password Modal -->
    <UiModal v-model="showReset" :title="$t('users.actions.resetPassword', 'Reset password')" max-width="sm">
      <form @submit.prevent="resetPassword" class="space-y-5">
        <p class="text-sm text-content-secondary">
          {{ $t('users.resetFor', 'New password for') }} <span class="font-semibold text-content-primary">{{ resetTarget?.full_name }}</span>
        </p>
        <div class="form-group">
          <label class="label">{{ $t('users.form.password', 'Password') }} <span class="text-danger">*</span></label>
          <input v-model="resetPasswordValue" type="password" class="input" required minlength="8" autocomplete="new-password" />
          <p class="text-xs text-content-muted mt-1">{{ $t('users.form.passwordHint', 'At least 8 characters.') }}</p>
        </div>

        <div v-if="resetError" class="p-3 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
          {{ resetError }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UiButton type="button" variant="secondary" @click="showReset = false">{{ $t('common.cancel', 'Cancel') }}</UiButton>
          <UiButton type="submit" variant="primary" :loading="resetting">{{ $t('users.actions.resetPassword', 'Reset password') }}</UiButton>
        </div>
      </form>
    </UiModal>

    <!-- Edit User Modal -->
    <UiModal v-model="showEdit" :title="$t('users.editUser', 'Edit User')" max-width="md">
      <form @submit.prevent="saveEdit" class="space-y-5">
        <div class="form-group">
          <label class="label">{{ $t('users.form.fullName', 'Full name') }} <span class="text-danger">*</span></label>
          <input v-model="editUser.full_name" type="text" class="input" required />
        </div>
        <div class="form-group">
          <label class="label">{{ $t('users.form.email', 'Email') }} <span class="text-danger">*</span></label>
          <input v-model="editUser.email" type="email" class="input" required autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="label">{{ $t('users.form.role', 'Role') }} <span class="text-danger">*</span></label>
          <select v-model="editUser.role" class="select" required :disabled="editTarget?.id === currentUserId">
            <option v-for="(label, value) in ROLE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
          <p v-if="editTarget?.id === currentUserId" class="text-xs text-content-muted mt-1">
            {{ $t('users.form.ownRoleLocked', 'You cannot change your own role.') }}
          </p>
        </div>

        <div v-if="editError" class="p-3 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
          {{ editError }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UiButton type="button" variant="secondary" @click="showEdit = false">{{ $t('common.cancel', 'Cancel') }}</UiButton>
          <UiButton type="submit" variant="primary" :loading="editing">{{ $t('common.save', 'Save') }}</UiButton>
        </div>
      </form>
    </UiModal>

    <!-- Delete User Modal -->
    <UiModal v-model="showDelete" :title="$t('users.deleteUser', 'Delete User')" max-width="sm">
      <div class="space-y-5">
        <p class="text-sm text-content-secondary">
          {{ $t('users.deleteConfirm', 'Are you sure you want to permanently delete') }}
          <span class="font-semibold text-content-primary">{{ deleteTarget?.full_name }}</span>?
          {{ $t('users.deleteWarning', 'This action cannot be undone.') }}
        </p>

        <div v-if="deleteError" class="p-3 bg-danger-50 border border-danger/20 rounded-lg text-sm text-danger-600">
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UiButton type="button" variant="secondary" @click="showDelete = false">{{ $t('common.cancel', 'Cancel') }}</UiButton>
          <UiButton type="button" variant="danger" :loading="deleting" @click="confirmDelete">{{ $t('common.delete', 'Delete') }}</UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ROLE_LABELS } from '~/utils/constants'
import { formatDate } from '~/utils/formatters'
import type { Profile, UserRole } from '~/types'

definePageMeta({
  middleware: ['auth', 'role']
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.profile?.id ?? null)
const loading = ref(true)
const updating = ref<string | null>(null)
const users = ref<Profile[]>([])

// ─── Create user ─────────────────────────────────────────
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newUser = ref<{ full_name: string; email: string; password: string; role: UserRole }>({
  full_name: '',
  email: '',
  password: '',
  role: 'developer'
})

watch(showCreate, (open) => {
  if (open) {
    createError.value = ''
    newUser.value = { full_name: '', email: '', password: '', role: 'developer' }
  }
})

async function createUser() {
  if (creating.value) return
  creating.value = true
  createError.value = ''
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: newUser.value })
    showCreate.value = false
    await fetchUsers()
  } catch (err: any) {
    createError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Failed to create user'
  } finally {
    creating.value = false
  }
}

// ─── Reset password ──────────────────────────────────────
const showReset = ref(false)
const resetting = ref(false)
const resetError = ref('')
const resetTarget = ref<Profile | null>(null)
const resetPasswordValue = ref('')

function openReset(user: Profile) {
  resetTarget.value = user
  resetPasswordValue.value = ''
  resetError.value = ''
  showReset.value = true
}

async function resetPassword() {
  if (resetting.value || !resetTarget.value) return
  resetting.value = true
  resetError.value = ''
  try {
    await $fetch('/api/admin/password', {
      method: 'POST',
      body: { userId: resetTarget.value.id, password: resetPasswordValue.value }
    })
    showReset.value = false
  } catch (err: any) {
    resetError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Failed to reset password'
  } finally {
    resetting.value = false
  }
}

// ─── Edit user ───────────────────────────────────────────
const showEdit = ref(false)
const editing = ref(false)
const editError = ref('')
const editTarget = ref<Profile | null>(null)
const editUser = ref<{ full_name: string; email: string; role: UserRole }>({
  full_name: '',
  email: '',
  role: 'developer'
})

function openEdit(user: Profile) {
  editTarget.value = user
  editUser.value = { full_name: user.full_name, email: user.email, role: user.role }
  editError.value = ''
  showEdit.value = true
}

async function saveEdit() {
  if (editing.value || !editTarget.value) return
  editing.value = true
  editError.value = ''
  try {
    await $fetch('/api/admin/users', {
      method: 'PATCH',
      body: {
        userId: editTarget.value.id,
        full_name: editUser.value.full_name,
        email: editUser.value.email,
        role: editUser.value.role
      }
    })
    showEdit.value = false
    await fetchUsers()
  } catch (err: any) {
    editError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Failed to update user'
  } finally {
    editing.value = false
  }
}

// ─── Delete user ─────────────────────────────────────────
const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const deleteTarget = ref<Profile | null>(null)

function openDelete(user: Profile) {
  deleteTarget.value = user
  deleteError.value = ''
  showDelete.value = true
}

async function confirmDelete() {
  if (deleting.value || !deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch('/api/admin/users', {
      method: 'DELETE',
      body: { userId: deleteTarget.value.id }
    })
    showDelete.value = false
    await fetchUsers()
  } catch (err: any) {
    deleteError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Failed to delete user'
  } finally {
    deleting.value = false
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) users.value = data as Profile[]
  } finally {
    loading.value = false
  }
}

// ─── Role dropdown ───────────────────────────────────────
const dropRefs: Record<string, any> = {}
function setDropRef(id: string, el: any) {
  if (el) dropRefs[id] = el
}

const ROLE_DOT: Record<UserRole, string> = {
  super_admin: 'bg-violet-500',
  project_manager: 'bg-blue-500',
  sales: 'bg-amber-500',
  developer: 'bg-emerald-500',
  tester: 'bg-pink-500'
}
function roleDot(role: UserRole) {
  return ROLE_DOT[role] ?? 'bg-gray-400'
}

async function selectRole(user: Profile, newRole: UserRole) {
  dropRefs[user.id]?.close()
  if (user.role === newRole) return
  user.role = newRole
  await updateRole(user.id, newRole)
}

async function updateRole(id: string, newRole: UserRole) {
  updating.value = id
  try {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
  } catch (err) {
    console.error('Failed to update role', err)
  } finally {
    updating.value = null
  }
}

async function toggleStatus(id: string, isActive: boolean) {
  updating.value = id
  try {
    await supabase.from('profiles').update({ is_active: isActive }).eq('id', id)
    const user = users.value.find(u => u.id === id)
    if (user) user.is_active = isActive
  } catch (err) {
    console.error('Failed to update status', err)
  } finally {
    updating.value = null
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
