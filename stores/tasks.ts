import { defineStore } from 'pinia'
import type {
  Task, Comment, TaskHistory, Attachment,
  CreateTaskPayload, CreateCommentPayload, TaskFilters
} from '~/types'
import { formatTaskNumber } from '~/utils/formatters'

export const useTasksStore = defineStore('tasks', () => {
  const supabase = useSupabaseClient()

  const tasks = ref<Task[]>([])
  const current = ref<Task | null>(null)
  const comments = ref<Comment[]>([])
  const history = ref<TaskHistory[]>([])
  const attachments = ref<Attachment[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // ─── Fetch Tasks ────────────────────────────────────────
  async function fetchTasks(filters: TaskFilters = {}, page = 0, perPage = 25) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          client:clients(id,company_name),
          project:projects(id,name),
          assignee:profiles!tasks_assigned_to_fkey(id,full_name,role),
          creator:profiles!tasks_created_by_fkey(id,full_name,role)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * perPage, (page + 1) * perPage - 1)

      // Visibility is enforced by RLS: sales sees only tasks of their own
      // projects; admin/PM/developer/tester see everything.

      if (filters.client_id)  query = query.eq('client_id', filters.client_id)
      if (filters.project_id) query = query.eq('project_id', filters.project_id)
      if (filters.status)     query = query.eq('status', filters.status)
      if (filters.priority)   query = query.eq('priority', filters.priority)
      if (filters.type)       query = query.eq('type', filters.type)
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
      if (filters.date_from)  query = query.gte('created_at', filters.date_from)
      if (filters.date_to)    query = query.lte('created_at', filters.date_to)
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      const { data, error: err, count } = await query
      if (err) throw err
      tasks.value = (data ?? []) as Task[]
      total.value = count ?? 0
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Portal: tasks for a client (anon, token-scoped RPC) ──
  async function fetchTasksByClientToken(token: string) {
    const { data, error: err } = await supabase.rpc('portal_get_tasks', { p_token: token })
    if (err) throw err
    // Normalise project_name → project.name for the UI
    return (data ?? []).map((t: any) => ({
      ...t,
      project: t.project_id ? { id: t.project_id, name: t.project_name } : null
    })) as Task[]
  }

  // ─── Portal: public comments (anon, token-scoped RPC) ─────
  async function fetchPortalComments(token: string, taskId: string) {
    const { data, error: err } = await supabase.rpc('portal_get_comments', {
      p_token: token,
      p_task: taskId
    })
    if (err) throw err
    return (data ?? []) as Comment[]
  }

  async function addPortalComment(token: string, taskId: string, content: string, author: string) {
    const { data, error: err } = await supabase.rpc('portal_add_comment', {
      p_token: token,
      p_task: taskId,
      p_content: content,
      p_author: author
    })
    if (err) throw err
    return (data?.[0] ?? null) as Comment | null
  }

  // ─── Fetch Single ────────────────────────────────────────
  async function fetchTask(id: string) {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(id,company_name,portal_token),
          project:projects(id,name),
          assignee:profiles!tasks_assigned_to_fkey(id,full_name,role,avatar_url),
          creator:profiles!tasks_created_by_fkey(id,full_name,role)
        `)
        .eq('id', id)
        .single()
      if (err) throw err
      current.value = data as Task
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Create Task ─────────────────────────────────────────
  async function createTask(payload: CreateTaskPayload) {
    const authStore = useAuthStore()
    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .insert({ ...payload, created_by: authStore.user?.id })
        .select(`
          *,
          client:clients(id,company_name),
          project:projects(id,name),
          assignee:profiles!tasks_assigned_to_fkey(id,full_name,role),
          creator:profiles!tasks_created_by_fkey(id,full_name,role)
        `)
        .single()
      if (err) throw err
      tasks.value.unshift(data as Task)

      // History: created
      await addHistory(data.id, 'status', null, 'new', authStore.profile?.full_name ?? 'Unknown')
      return data as Task
    } finally {
      saving.value = false
    }
  }

  // ─── Update Task ─────────────────────────────────────────
  async function updateTask(id: string, payload: Partial<Task>) {
    const authStore = useAuthStore()
    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          client:clients(id,company_name),
          project:projects(id,name),
          assignee:profiles!tasks_assigned_to_fkey(id,full_name,role),
          creator:profiles!tasks_created_by_fkey(id,full_name,role)
        `)
        .single()
      if (err) throw err
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data as Task
      if (current.value?.id === id) current.value = data as Task
      return data as Task
    } finally {
      saving.value = false
    }
  }

  // ─── Delete Task ─────────────────────────────────────────
  async function deleteTask(id: string) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (err) throw err
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  // ─── Comments ────────────────────────────────────────────
  async function fetchComments(taskId: string, includeInternal = true) {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (!includeInternal) query = query.eq('is_internal', false)
    const { data } = await query
    comments.value = (data ?? []) as Comment[]
  }

  async function addComment(payload: CreateCommentPayload) {
    const authStore = useAuthStore()
    const { data, error: err } = await supabase
      .from('comments')
      .insert({
        ...payload,
        author_id: authStore.user?.id,
        author_name: authStore.profile?.full_name ?? 'Unknown',
        author_role: authStore.profile?.role ?? 'developer'
      })
      .select()
      .single()
    if (err) throw err
    comments.value.push(data as Comment)

    // Send notification for new comment
    await createNotification(payload.task_id, 'comment_added',
      `New comment on task`)
    return data as Comment
  }

  async function deleteComment(id: string) {
    const { error: err } = await supabase.from('comments').delete().eq('id', id)
    if (err) throw err
    comments.value = comments.value.filter((c) => c.id !== id)
  }

  // ─── History ─────────────────────────────────────────────
  async function fetchHistory(taskId: string) {
    const { data } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('changed_at', { ascending: false })
    history.value = (data ?? []) as TaskHistory[]
  }

  async function addHistory(
    taskId: string,
    field: string,
    oldVal: string | null,
    newVal: string | null,
    changedByName: string
  ) {
    const authStore = useAuthStore()
    await supabase.from('task_history').insert({
      task_id: taskId,
      field_changed: field,
      old_value: oldVal,
      new_value: newVal,
      changed_by: authStore.user?.id,
      changed_by_name: changedByName
    })
  }

  // ─── Attachments ─────────────────────────────────────────
  async function fetchAttachments(taskId: string) {
    const { data } = await supabase
      .from('attachments')
      .select('*, uploader:profiles(id,full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    attachments.value = (data ?? []) as Attachment[]
  }

  async function uploadAttachment(taskId: string, file: File) {
    const authStore = useAuthStore()
    const ext = file.name.split('.').pop()
    const path = `${taskId}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('task-attachments')
      .upload(path, file)
    if (uploadErr) throw uploadErr

    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(path)

    const { data, error: err } = await supabase
      .from('attachments')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: authStore.user?.id
      })
      .select('*, uploader:profiles(id,full_name)')
      .single()
    if (err) throw err
    attachments.value.unshift(data as Attachment)
    return data as Attachment
  }

  async function deleteAttachment(id: string, fileUrl: string) {
    // Extract path from URL
    const path = fileUrl.split('/task-attachments/')[1]
    if (path) {
      await supabase.storage.from('task-attachments').remove([path])
    }
    const { error: err } = await supabase.from('attachments').delete().eq('id', id)
    if (err) throw err
    attachments.value = attachments.value.filter((a) => a.id !== id)
  }

  // ─── Notifications ───────────────────────────────────────
  async function createNotification(taskId: string, type: string, message: string) {
    // Notify assigned developer and PM
    const task = tasks.value.find((t) => t.id === taskId) ?? current.value
    if (!task) return
    const recipients = [task.assigned_to, task.created_by].filter(Boolean) as string[]
    const authStore = useAuthStore()
    const uniqueRecipients = [...new Set(recipients)].filter(
      (id) => id !== authStore.user?.id
    )
    if (!uniqueRecipients.length) return
    await supabase.from('notifications').insert(
      uniqueRecipients.map((uid) => ({
        user_id: uid,
        type,
        message,
        task_id: taskId
      }))
    )
  }

  // ─── Dashboard Stats ─────────────────────────────────────
  async function getTableCount(table: string, applyFilters?: (query: any) => any) {
    let query = supabase.from(table as any).select('id', { count: 'exact', head: true })
    if (applyFilters) query = applyFilters(query)

    const { count, error: err } = await query
    if (err) throw err
    return count ?? 0
  }

  async function fetchStats() {
    const [
      total_clients,
      active_projects,
      active_tasks,
      completed_tasks,
      tasks_in_testing
    ] = await Promise.all([
      getTableCount('clients'),
      getTableCount('projects', (query) => query.eq('status', 'active')),
      getTableCount('tasks', (query) => query.not('status', 'in', '(completed,cancelled,rejected)')),
      getTableCount('tasks', (query) => query.eq('status', 'completed')),
      getTableCount('tasks', (query) => query.eq('status', 'testing'))
    ])

    // Overdue: due_date < today AND status not done
    const today = new Date().toISOString().split('T')[0]
    const overdue_tasks = await getTableCount('tasks', (query) =>
      query
        .lt('due_date', today)
        .not('status', 'in', '(completed,cancelled,rejected)')
    )

    return {
      total_clients,
      active_projects,
      active_tasks,
      overdue_tasks,
      completed_tasks,
      tasks_in_testing
    }
  }

  async function fetchStatusBreakdown() {
    const { data, error: rpcError } = await supabase.rpc('get_tasks_by_status')
    if (!rpcError && data) return data

    // Fallback: count per status
    const statuses = ['new','under_review','approved','assigned','in_progress',
      'development_completed','testing','waiting_client_feedback','completed','rejected','cancelled']
    const results = await Promise.all(
      statuses.map(async (s) => {
        const count = await getTableCount('tasks', (query) => query.eq('status', s))
        return { status: s, count }
      })
    )
    return results
  }

  async function fetchPriorityBreakdown() {
    const priorities = ['critical', 'high', 'medium', 'low']
    const results = await Promise.all(
      priorities.map(async (p) => {
        const count = await getTableCount('tasks', (query) => query.eq('priority', p))
        return { priority: p, count }
      })
    )
    return results
  }

  // ─── Computed ────────────────────────────────────────────
  const openTasks = computed(() =>
    tasks.value.filter((t) => !['completed', 'cancelled', 'rejected'].includes(t.status))
  )

  const publicComments = computed(() =>
    comments.value.filter((c) => !c.is_internal)
  )

  const internalComments = computed(() =>
    comments.value.filter((c) => c.is_internal)
  )

  return {
    tasks, current, comments, history, attachments,
    loading, saving, error, total,
    openTasks, publicComments, internalComments,
    fetchTasks, fetchTask, fetchTasksByClientToken,
    fetchPortalComments, addPortalComment,
    createTask, updateTask, deleteTask,
    fetchComments, addComment, deleteComment,
    fetchHistory, addHistory,
    fetchAttachments, uploadAttachment, deleteAttachment,
    fetchStats, fetchStatusBreakdown, fetchPriorityBreakdown,
    createNotification
  }
})
