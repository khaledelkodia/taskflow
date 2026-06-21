<template>
  <div class="space-y-6">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('clients.title') }}</h1>
        <p class="page-subtitle">{{ $t('clients.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UiButton
          v-if="hasPermission(authStore.role, 'manage_clients')"
          variant="primary"
          @click="openCreateModal"
        >
          {{ $t('clients.addClient') }}
        </UiButton>
      </div>
    </div>

    <!-- Search -->
    <UiCard class="mb-6">
      <div class="p-4 flex gap-4">
        <div class="w-full md:max-w-md">
          <input
            v-model="search"
            type="text"
            class="input"
            :placeholder="$t('clients.searchPlaceholder')"
            @input="debouncedFetch"
          />
        </div>
      </div>
    </UiCard>

    <!-- Client List -->
    <UiCard class="overflow-hidden">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('clients.table.companyName') }}</th>
              <th>{{ $t('clients.table.contactPerson') }}</th>
              <th>{{ $t('clients.table.contactInfo') }}</th>
              <th>{{ $t('clients.table.status') }}</th>
              <th>{{ $t('clients.table.created') }}</th>
              <th v-if="hasPermission(authStore.role, 'manage_clients')" class="text-end">{{ $t('clients.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clientsStore.loading">
              <td colspan="6" class="text-center py-12">
                <div class="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </td>
            </tr>
            <tr v-else-if="!clientsStore.clients.length">
              <td colspan="6">
                <div class="empty-state">
                  <p class="text-content-primary font-medium">{{ $t('clients.empty.title') }}</p>
                  <p class="text-sm text-content-muted mt-1">{{ $t('clients.empty.subtitle') }}</p>
                </div>
              </td>
            </tr>
            <tr
              v-else
              v-for="client in clientsStore.clients"
              :key="client.id"
              class="cursor-pointer"
              @click="navigateTo(`/clients/${client.id}`)"
            >
              <td>
                <div class="font-medium text-content-primary">{{ client.company_name }}</div>
                <div v-if="client.notes" class="text-xs text-content-muted truncate max-w-[200px] mt-0.5">{{ client.notes }}</div>
              </td>
              <td class="text-content-secondary">{{ client.contact_person }}</td>
              <td>
                <div class="text-sm">
                  <a v-if="client.email" :href="`mailto:${client.email}`" class="block text-primary hover:underline truncate max-w-[200px]">{{ client.email }}</a>
                  <a v-if="client.phone" :href="`tel:${client.phone}`" class="block text-content-secondary mt-0.5">{{ client.phone }}</a>
                  <span v-if="!client.email && !client.phone" class="text-content-muted">—</span>
                </div>
              </td>
              <td>
                <UiBadge :color="CLIENT_STATUS_COLORS[client.status].replace('badge-', '') as any">
                  {{ CLIENT_STATUS_LABELS[client.status] }}
                </UiBadge>
              </td>
              <td class="text-sm text-content-secondary">
                {{ formatDate(client.created_at) }}
              </td>
              <td v-if="hasPermission(authStore.role, 'manage_clients')" class="text-end">
                <UiButton variant="ghost" size="sm" @click.stop="openEditModal(client)">{{ $t('common.edit') }}</UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <ClientFormModal
      v-model="isModalOpen"
      :client="selectedClientForEdit"
      @saved="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from '~/utils/constants'
import { formatDate } from '~/utils/formatters'
import { hasPermission } from '~/utils/permissions'
import ClientFormModal from '~/components/clients/ClientFormModal.vue'

definePageMeta({
  middleware: ['auth', 'role']
})

const authStore = useAuthStore()
const clientsStore = useClientsStore()

const search = ref('')
const isModalOpen = ref(false)
const selectedClientForEdit = ref(null)

function openCreateModal() {
  selectedClientForEdit.value = null
  isModalOpen.value = true
}

function openEditModal(client: any) {
  selectedClientForEdit.value = client
  isModalOpen.value = true
}

async function fetchData() {
  await clientsStore.fetchClients(search.value)
}

const debouncedFetch = useDebounceFn(() => {
  fetchData()
}, 300)

onMounted(() => {
  fetchData()
})
</script>
