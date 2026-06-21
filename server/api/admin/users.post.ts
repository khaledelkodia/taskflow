import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { UserRole } from '~/types'

interface CreateUserBody {
  full_name?: string
  email?: string
  password?: string
  role?: UserRole
}

const VALID_ROLES: UserRole[] = [
  'super_admin', 'project_manager', 'sales', 'developer', 'tester'
]

export default defineEventHandler(async (event) => {
  // 1) Must be authenticated
  const caller = await serverSupabaseUser(event)
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Service-role client (uses SUPABASE_SERVICE_KEY) bypasses RLS for admin ops
  const admin = serverSupabaseServiceRole(event)

  // 2) Caller must be a super_admin
  const { data: me, error: meErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (meErr || me?.role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // 3) Validate input
  const body = await readBody<CreateUserBody>(event)
  const full_name = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const role = body.role

  if (!full_name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'full_name, email and password are required' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }
  if (!role || !VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  // 4) Create the auth user — the handle_new_user() trigger creates the profile
  //    using full_name and role from user_metadata.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role }
  })
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { id: data.user?.id, email: data.user?.email }
})
