import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface ResetPasswordBody {
  userId?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  // 1) Must be authenticated
  const caller = await serverSupabaseUser(event)
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

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
  const body = await readBody<ResetPasswordBody>(event)
  const userId = body.userId
  const password = body.password
  if (!userId || !password) {
    throw createError({ statusCode: 400, statusMessage: 'userId and password are required' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  // 4) Update the user's password
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { ok: true }
})
