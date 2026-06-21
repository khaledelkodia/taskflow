import type { UserRole } from '~/types'

// ─── Permission Matrix ────────────────────────────────────────────────

type Permission =
  | 'manage_users'
  | 'manage_clients'
  | 'create_projects'
  | 'delete_projects'
  | 'create_tasks'
  | 'assign_tasks'
  | 'set_priority'
  | 'set_estimates'
  | 'update_status'
  | 'log_hours'
  | 'add_internal_notes'
  | 'add_public_notes'
  | 'view_internal_notes'
  | 'view_estimates'
  | 'view_developer_info'
  | 'approve_reject_tasks'
  | 'view_analytics'
  | 'upload_attachments'
  | 'view_all_tasks'
  | 'manage_permissions'
  | 'delete_tasks'

const PERMISSION_MATRIX: Record<Permission, UserRole[]> = {
  manage_users:         ['super_admin'],
  manage_permissions:   ['super_admin'],
  // Sales is a read + comment role: it can no longer create/manage entities.
  manage_clients:       ['super_admin', 'project_manager'],
  create_projects:      ['super_admin', 'project_manager'],
  delete_projects:      ['super_admin'],
  create_tasks:         ['super_admin', 'project_manager'],
  assign_tasks:         ['super_admin', 'project_manager'],
  set_priority:         ['super_admin', 'project_manager'],
  set_estimates:        ['super_admin', 'project_manager'],
  update_status:        ['super_admin', 'project_manager', 'developer', 'tester'],
  log_hours:            ['super_admin', 'project_manager', 'developer'],
  add_internal_notes:   ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  add_public_notes:     ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  view_internal_notes:  ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  view_estimates:       ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  view_developer_info:  ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  approve_reject_tasks: ['super_admin', 'project_manager', 'tester'],
  view_analytics:       ['super_admin', 'project_manager'],
  upload_attachments:   ['super_admin', 'project_manager', 'developer', 'tester'],
  view_all_tasks:       ['super_admin', 'project_manager'],
  delete_tasks:         ['super_admin']
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return PERMISSION_MATRIX[permission]?.includes(role) ?? false
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

// ─── Page Access ──────────────────────────────────────────────────────
export const PAGE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':   ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  '/clients':     ['super_admin', 'project_manager'],
  '/projects':    ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  '/tasks':       ['super_admin', 'project_manager', 'sales', 'developer', 'tester'],
  '/admin/users': ['super_admin']
}

export function canAccessPage(role: UserRole | undefined, path: string): boolean {
  if (!role) return false
  // Check exact match first, then prefix
  const allowed = PAGE_ROLES[path]
  if (allowed) return allowed.includes(role)
  // Prefix check
  const prefix = Object.keys(PAGE_ROLES).find((p) => path.startsWith(p + '/'))
  if (prefix) return PAGE_ROLES[prefix].includes(role)
  return false
}

// ─── Nav Items by Role ────────────────────────────────────────────────
export function getNavItems(role: UserRole) {
  const all = [
    { label: 'Dashboard',  icon: 'dashboard',  to: '/dashboard',   roles: ['super_admin', 'project_manager', 'sales', 'developer', 'tester'] },
    { label: 'Tasks',      icon: 'tasks',       to: '/tasks',       roles: ['super_admin', 'project_manager', 'sales', 'developer', 'tester'] },
    { label: 'Projects',   icon: 'projects',    to: '/projects',    roles: ['super_admin', 'project_manager', 'sales', 'developer', 'tester'] },
    { label: 'Clients',    icon: 'clients',     to: '/clients',     roles: ['super_admin', 'project_manager'] },
    { label: 'Users',      icon: 'users',       to: '/admin/users', roles: ['super_admin'] }
  ] as const
  return all.filter((item) => (item.roles as readonly string[]).includes(role))
}
