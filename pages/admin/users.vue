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
                <select 
                  v-model="user.role" 
                  class="select h-8 py-0 pl-2 pr-8 text-sm w-36"
                  @change="updateRole(user.id, user.role)"
                  :disabled="updating === user.id"
                >
                  <option v-for="(label, value) in ROLE_LABELS" :key="value" :value="value">
                    {{ label }}
                  </option>
                </select>
              </td>
              <td>
                <UiBadge :color="user.is_active ? 'green' : 'gray'" dot>
                  {{ user.is_active ? $t('users.status.active', 'Active') : $t('users.status.inactive', 'Inactive') }}
                </UiBadge>
              </td>
              <td class="text-sm text-content-secondary">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="text-end space-x-2">
                <UiButton 
                  variant="ghost" 
                  size="sm"
                  :class="user.is_active ? 'text-danger hover:bg-danger-50 hover:text-danger-700' : 'text-success hover:bg-success-50 hover:text-success-700'"
                  @click="toggleStatus(user.id, !user.is_active)"
                  :disabled="updating === user.id"
                >
                  {{ user.is_active ? $t('users.actions.deactivate', 'Deactivate') : $t('users.actions.activate', 'Activate') }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ROLE_LABELS } from '~/utils/constants'
import { formatDate } from '~/utils/formatters'
import type { Profile, UserRole } from '~/types'

definePageMeta({
  middleware: ['auth', 'role']
})

const supabase = useSupabaseClient()
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
