import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface DeleteUserBody {
  userId?: string
}

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
  const body = await readBody<DeleteUserBody>(event)
  const userId = body.userId
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }

  // Prevent admins from deleting their own account
  if (userId === caller.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account' })
  }

  // 4) Delete the auth user. The profiles row is removed automatically via
  //    ON DELETE CASCADE (profiles.id references auth.users(id)).
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    // Most common failure: the user still owns tasks/clients/projects
    // (created_by is a RESTRICT foreign key), so the delete is blocked.
    const message = /foreign key|violates|referenced/i.test(error.message)
      ? 'This user has related records (tasks, clients or projects) and cannot be deleted. Deactivate the account instead.'
      : error.message
    throw createError({ statusCode: 409, statusMessage: message })
  }

  return { ok: true }
})
