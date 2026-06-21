import { defineStore } from 'pinia'
import type { Project, CreateProjectPayload, Profile } from '~/types'

export const useProjectsStore = defineStore('projects', () => {
  const supabase = useSupabaseClient()

  const projects = ref<Project[]>([])
  const current = ref<Project | null>(null)
  const salesUsers = ref<Pick<Profile, 'id' | 'full_name'>[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Sales users available to own a project (for the project form dropdown)
  async function fetchSalesUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'sales')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    salesUsers.value = (data ?? []) as Pick<Profile, 'id' | 'full_name'>[]
  }

  async function fetchProjects(clientId?: string) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('projects')
        .select('*, client:clients(id,company_name,status), sales:profiles!projects_sales_id_fkey(id,full_name)')
        .order('created_at', { ascending: false })
      if (clientId) query = query.eq('client_id', clientId)
      const { data, error: err } = await query
      if (err) throw err
      projects.value = (data ?? []) as Project[]
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id: string) {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('*, client:clients(id,company_name,status), sales:profiles!projects_sales_id_fkey(id,full_name)')
        .eq('id', id)
        .single()
      if (err) throw err
      current.value = data as Project
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createProject(payload: CreateProjectPayload) {
    const authStore = useAuthStore()
    const { data, error: err } = await supabase
      .from('projects')
      .insert({ ...payload, created_by: authStore.user?.id })
      .select('*, client:clients(id,company_name,status), sales:profiles!projects_sales_id_fkey(id,full_name)')
      .single()
    if (err) throw err
    projects.value.unshift(data as Project)
    return data as Project
  }

  async function updateProject(id: string, payload: Partial<CreateProjectPayload>) {
    const { data, error: err } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select('*, client:clients(id,company_name,status), sales:profiles!projects_sales_id_fkey(id,full_name)')
      .single()
    if (err) throw err
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx] = data as Project
    if (current.value?.id === id) current.value = data as Project
    return data as Project
  }

  async function deleteProject(id: string) {
    const { error: err } = await supabase.from('projects').delete().eq('id', id)
    if (err) throw err
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  const projectOptions = computed(() =>
    projects.value.map((p) => ({ label: p.name, value: p.id }))
  )

  const projectsByClient = computed(() => {
    const map = new Map<string, Project[]>()
    projects.value.forEach((p) => {
      if (!map.has(p.client_id)) map.set(p.client_id, [])
      map.get(p.client_id)!.push(p)
    })
    return map
  })

  return {
    projects, current, salesUsers, loading, error,
    projectOptions, projectsByClient,
    fetchProjects, fetchProject, createProject, updateProject, deleteProject,
    fetchSalesUsers
  }
})
