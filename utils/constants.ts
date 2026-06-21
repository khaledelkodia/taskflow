import type {
  TaskStatus,
  Priority,
  TaskType,
  ClientStatus,
  ProjectStatus,
  UserRole,
  NotificationType,
  SelectOption
} from '~/types'

// ─── Role Labels ──────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  project_manager: 'Project Manager',
  sales: 'Sales',
  developer: 'Developer',
  tester: 'Tester'
}

// ─── Task Status ──────────────────────────────────────────────────────
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  approved: 'Approved',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  development_completed: 'Dev Completed',
  testing: 'Testing',
  waiting_client_feedback: 'Awaiting Feedback',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  new: 'badge-gray',
  under_review: 'badge-blue',
  approved: 'badge-indigo',
  assigned: 'badge-purple',
  in_progress: 'badge-blue',
  development_completed: 'badge-orange',
  testing: 'badge-yellow',
  waiting_client_feedback: 'badge-yellow',
  completed: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-gray'
}

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  new: 'bg-gray-400',
  under_review: 'bg-blue-400',
  approved: 'bg-indigo-500',
  assigned: 'bg-purple-500',
  in_progress: 'bg-blue-500',
  development_completed: 'bg-orange-400',
  testing: 'bg-yellow-500',
  waiting_client_feedback: 'bg-yellow-400',
  completed: 'bg-success',
  rejected: 'bg-danger',
  cancelled: 'bg-gray-400'
}

export const TASK_STATUS_OPTIONS: SelectOption[] = Object.entries(
  TASK_STATUS_LABELS
).map(([value, label]) => ({ value, label }))

// ─── Priority ─────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'badge-red',
  high: 'badge-yellow',
  medium: 'badge-blue',
  low: 'badge-green'
}

export const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-success'
}

export const PRIORITY_OPTIONS: SelectOption[] = Object.entries(
  PRIORITY_LABELS
).map(([value, label]) => ({ value, label }))

// ─── Task Types ───────────────────────────────────────────────────────
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  bug: 'Bug',
  feature: 'Feature',
  enhancement: 'Enhancement',
  support: 'Support',
  integration: 'Integration',
  database: 'Database',
  ui_ux: 'UI/UX',
  infrastructure: 'Infrastructure'
}

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  bug: '🐛',
  feature: '✨',
  enhancement: '🔧',
  support: '🎧',
  integration: '🔗',
  database: '🗄️',
  ui_ux: '🎨',
  infrastructure: '⚙️'
}

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  bug: 'badge-red',
  feature: 'badge-blue',
  enhancement: 'badge-indigo',
  support: 'badge-yellow',
  integration: 'badge-purple',
  database: 'badge-orange',
  ui_ux: 'badge-purple',
  infrastructure: 'badge-gray'
}

export const TASK_TYPE_OPTIONS: SelectOption[] = Object.entries(
  TASK_TYPE_LABELS
).map(([value, label]) => ({ value, label }))

// ─── Client Status ────────────────────────────────────────────────────
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  prospect: 'Prospect'
}

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'badge-green',
  inactive: 'badge-gray',
  prospect: 'badge-yellow'
}

export const CLIENT_STATUS_OPTIONS: SelectOption[] = Object.entries(
  CLIENT_STATUS_LABELS
).map(([value, label]) => ({ value, label }))

// ─── Project Status ───────────────────────────────────────────────────
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: 'badge-green',
  on_hold: 'badge-yellow',
  completed: 'badge-blue',
  cancelled: 'badge-gray'
}

export const PROJECT_STATUS_OPTIONS: SelectOption[] = Object.entries(
  PROJECT_STATUS_LABELS
).map(([value, label]) => ({ value, label }))

// ─── Notification Labels ──────────────────────────────────────────────
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  task_assigned: 'Task Assigned',
  status_changed: 'Status Changed',
  task_completed: 'Task Completed',
  comment_added: 'New Comment'
}

// ─── Task Status Transitions ──────────────────────────────────────────
// Maps current status → allowed next statuses per role
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  new: ['under_review', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['development_completed', 'cancelled'],
  development_completed: ['testing', 'in_progress'],
  testing: ['waiting_client_feedback', 'completed', 'in_progress'],
  waiting_client_feedback: ['completed', 'in_progress'],
  completed: [],
  rejected: ['new'],
  cancelled: ['new']
}

// ─── Avatar color palette ─────────────────────────────────────────────
export const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700'
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
