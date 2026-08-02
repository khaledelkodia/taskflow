import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { UserRole } from '~/types'

interface UpdateUserBody {
  userId?: string
  full_name?: string
  email?: string
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
  const body = await readBody<UpdateUserBody>(event)
  const userId = body.userId
  const full_name = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const role = body.role

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }
  if (!full_name && !email && !role) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }
  if (role && !VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  // Prevent an admin from demoting themselves (avoids locking out the last admin)
  if (userId === caller.id && role && role !== 'super_admin') {
    throw createError({ statusCode: 400, statusMessage: 'You cannot change your own role' })
  }

  // 4) If the email changed, update it in Supabase Auth first (keeps login in sync)
  if (email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, { email })
    if (authErr) {
      throw createError({ statusCode: 400, statusMessage: authErr.message })
    }
  }

  // 5) Update the profile row
  const updates: Record<string, unknown> = {}
  if (full_name) updates.full_name = full_name
  if (email) updates.email = email
  if (role) updates.role = role

  const { error } = await admin.from('profiles').update(updates).eq('id', userId)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { ok: true }
})
