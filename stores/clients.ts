import { defineStore } from 'pinia'
import type { Client, CreateClientPayload, Project } from '~/types'

export const useClientsStore = defineStore('clients', () => {
  const supabase = useSupabaseClient()

  const clients = ref<Client[]>([])
  const current = ref<Client | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Fetch All ──────────────────────────────────────────
  async function fetchClients(search?: string) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      const { data, error: err } = await query
      if (err) throw err
      clients.value = (data ?? []) as Client[]
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch Single ────────────────────────────────────────
  async function fetchClient(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      if (err) throw err
      current.value = data as Client
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch by Portal Token (anon, token-scoped RPC) ──────
  async function fetchClientByToken(token: string) {
    const { data, error: err } = await supabase.rpc('portal_get_client', { p_token: token })
    if (err) return null
    return (data?.[0] ?? null) as Client | null
  }

  // ─── Portal: projects for a client (anon, token-scoped) ──
  async function fetchProjectsByClientToken(token: string) {
    const { data, error: err } = await supabase.rpc('portal_get_projects', { p_token: token })
    if (err) throw err
    return (data ?? []) as Project[]
  }

  // ─── Create ──────────────────────────────────────────────
  async function createClient(payload: CreateClientPayload) {
    const authStore = useAuthStore()
    const { data, error: err } = await supabase
      .from('clients')
      .insert({ ...payload, created_by: authStore.user?.id })
      .select()
      .single()
    if (err) throw err
    clients.value.unshift(data as Client)
    return data as Client
  }

  // ─── Update ──────────────────────────────────────────────
  async function updateClient(id: string, payload: Partial<CreateClientPayload>) {
    const { data, error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = clients.value.findIndex((c) => c.id === id)
    if (idx !== -1) clients.value[idx] = data as Client
    if (current.value?.id === id) current.value = data as Client
    return data as Client
  }

  // ─── Delete ──────────────────────────────────────────────
  async function deleteClient(id: string) {
    const { error: err } = await supabase.from('clients').delete().eq('id', id)
    if (err) throw err
    clients.value = clients.value.filter((c) => c.id !== id)
  }

  // ─── Computed ────────────────────────────────────────────
  const activeClients = computed(() =>
    clients.value.filter((c) => c.status === 'active')
  )

  const clientOptions = computed(() =>
    clients.value.map((c) => ({ label: c.company_name, value: c.id }))
  )

  return {
    clients,
    current,
    loading,
    error,
    activeClients,
    clientOptions,
    fetchClients,
    fetchClient,
    fetchClientByToken,
    fetchProjectsByClientToken,
    createClient,
    updateClient,
    deleteClient
  }
})
