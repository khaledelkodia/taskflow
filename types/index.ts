// ─── User & Auth ──────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'
  | 'project_manager'
  | 'sales'
  | 'developer'
  | 'tester'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string | null
  is_active: boolean
  created_at: string
}

// ─── Client ───────────────────────────────────────────────────────────
export type ClientStatus = 'active' | 'inactive' | 'prospect'

export interface Client {
  id: string
  company_name: string
  contact_person: string
  phone?: string | null
  email?: string | null
  status: ClientStatus
  notes?: string | null
  portal_token: string
  created_at: string
  created_by: string
}

// ─── Project ──────────────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  client_id: string
  client?: Client
  description?: string | null
  status: ProjectStatus
  sales_id?: string | null
  sales?: Pick<Profile, 'id' | 'full_name'> | null
  created_at: string
  created_by: string
}

// ─── Task ─────────────────────────────────────────────────────────────
export type TaskType =
  | 'bug'
  | 'feature'
  | 'enhancement'
  | 'support'
  | 'integration'
  | 'database'
  | 'ui_ux'
  | 'infrastructure'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export type TaskStatus =
  | 'new'
  | 'under_review'
  | 'approved'
  | 'assigned'
  | 'in_progress'
  | 'development_completed'
  | 'testing'
  | 'waiting_client_feedback'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface Task {
  id: string
  task_number: number
  title: string
  description?: string | null
  client_id: string
  client?: Client
  project_id?: string | null
  project?: Project
  type: TaskType
  priority: Priority
  status: TaskStatus
  assigned_to?: string | null
  assignee?: Profile
  created_by: string
  creator?: Profile
  estimated_hours?: number | null
  actual_hours?: number | null
  due_date?: string | null
  completion_date?: string | null
  created_at: string
  updated_at: string
}

// ─── Attachment ───────────────────────────────────────────────────────
export interface Attachment {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_size?: number | null
  file_type?: string | null
  uploaded_by: string
  uploader?: Profile
  created_at: string
}

// ─── Comment ──────────────────────────────────────────────────────────
export interface Comment {
  id: string
  task_id: string
  content: string
  is_internal: boolean
  is_client?: boolean
  author_id?: string | null
  author_name: string
  author_role?: UserRole | null
  created_at: string
}

// ─── Task History ─────────────────────────────────────────────────────
export interface TaskHistory {
  id: string
  task_id: string
  field_changed: string
  old_value?: string | null
  new_value?: string | null
  changed_by: string
  changed_by_name: string
  changed_at: string
}

// ─── Notification ─────────────────────────────────────────────────────
export type NotificationType =
  | 'task_assigned'
  | 'status_changed'
  | 'task_completed'
  | 'comment_added'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  is_read: boolean
  task_id?: string | null
  created_at: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────
export interface DashboardStats {
  total_clients: number
  active_projects: number
  active_tasks: number
  overdue_tasks: number
  completed_tasks: number
  tasks_in_testing: number
}

// ─── Filter State ─────────────────────────────────────────────────────
export interface TaskFilters {
  client_id?: string
  project_id?: string
  status?: TaskStatus | ''
  priority?: Priority | ''
  type?: TaskType | ''
  assigned_to?: string
  date_from?: string
  date_to?: string
  search?: string
}

// ─── API Payloads ─────────────────────────────────────────────────────
export interface CreateClientPayload {
  company_name: string
  contact_person: string
  phone?: string
  email?: string
  status: ClientStatus
  notes?: string
  portal_token?: string
}

export interface CreateProjectPayload {
  name: string
  client_id: string
  description?: string
  status: ProjectStatus
  sales_id?: string | null
}

export interface CreateTaskPayload {
  title: string
  description?: string
  client_id: string
  project_id?: string
  type: TaskType
  priority: Priority
  status: TaskStatus
  assigned_to?: string
  estimated_hours?: number
  due_date?: string
}

export interface CreateCommentPayload {
  task_id: string
  content: string
  is_internal: boolean
}

// ─── UI Helpers ───────────────────────────────────────────────────────
export interface SelectOption {
  label: string
  value: string
}

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface NavItem {
  label: string
  icon: string
  to: string
  badge?: number
  roles?: UserRole[]
}
