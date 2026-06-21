<template>
  <UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="isEdit ? $t('common.edit') : $t('clients.addClient')" max-width="md">
    <form @submit.prevent="handleSubmit" class="space-y-5">
      
      <!-- Company Name -->
      <div class="form-group">
        <label class="label">{{ $t('clients.table.companyName') }} <span class="text-danger">*</span></label>
        <input v-model="form.company_name" type="text" class="input" required :placeholder="$t('clients.table.companyName')" />
      </div>

      <!-- Contact Person -->
      <div class="form-group">
        <label class="label">{{ $t('clients.table.contactPerson') }} <span class="text-danger">*</span></label>
        <input v-model="form.contact_person" type="text" class="input" required :placeholder="$t('clients.table.contactPerson')" />
      </div>

      <div class="grid grid-cols-1 gap-4">
        <!-- Email -->
        <div class="form-group">
          <label class="label">{{ $t('clientForm.email') }}</label>
          <input v-model="form.email" type="email" class="input" :placeholder="$t('clientForm.emailPlaceholder')" />
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label class="label">{{ $t('clientForm.phone') }}</label>
          <input v-model="form.phone" type="tel" class="input" :placeholder="$t('clientForm.phonePlaceholder')" />
        </div>

        <!-- Portal Link -->
        <div class="form-group">
          <label class="label">{{ $t('clientForm.portalLink') }}</label>
          <input v-model="form.portal_token" type="text" class="input" :placeholder="$t('clientForm.portalLinkPlaceholder')" />
          <p class="text-xs text-content-muted mt-1" v-if="form.portal_token">taskflow.com/portal/{{ formatSlug(form.portal_token) }}</p>
        </div>
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
          {{ isEdit ? $t('common.save') : $t('clients.addClient') }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Client, CreateClientPayload } from '~/types'

const props = defineProps<{
  modelValue: boolean
  client?: Client | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'saved': [client: Client]
}>()

const isEdit = computed(() => !!props.client)

const clientsStore = useClientsStore()
const saving = ref(false)
const error = ref('')

const form = ref<Partial<CreateClientPayload>>({
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  status: 'active',
  notes: '',
  portal_token: ''
})

function formatSlug(text: string) {
  if (!text) return ''
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

function generateRandomSlug() {
  return Math.random().toString(36).substring(2, 10)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    error.value = ''
    if (isEdit.value && props.client) {
      form.value = {
        company_name: props.client.company_name,
        contact_person: props.client.contact_person,
        email: props.client.email || '',
        phone: props.client.phone || '',
        status: props.client.status,
        notes: props.client.notes || '',
        portal_token: props.client.portal_token || ''
      }
    } else {
      form.value = {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        status: 'active',
        notes: '',
        portal_token: ''
      }
    }
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    let finalToken = form.value.portal_token ? formatSlug(form.value.portal_token) : formatSlug(form.value.company_name || '')
    if (!finalToken) finalToken = generateRandomSlug()

    const payload = {
      ...form.value,
      portal_token: finalToken
    } as CreateClientPayload

    let savedClient: Client
    if (isEdit.value && props.client) {
      savedClient = await clientsStore.updateClient(props.client.id, payload)
    } else {
      savedClient = await clientsStore.createClient(payload)
    }
    
    emit('saved', savedClient)
    emit('update:modelValue', false)
  } catch (err: any) {
    error.value = err.message || 'Failed to save client'
  } finally {
    saving.value = false
  }
}
</script>
