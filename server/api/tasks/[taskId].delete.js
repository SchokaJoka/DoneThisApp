import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/tasks.[id].delete] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/tasks.[id].delete] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { taskId } = event.context.params || {}
  if (!taskId) throw createError({ statusCode: 400, statusMessage: 'taskId is required' })

  // ensure ownership
  const { data: existing, error: fetchErr } = await client
    .from('tasks')
    .select('user_id')
    .eq('id', taskId)
    .single()

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  if (existing.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('[api/tasks.[id].delete] supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to delete task' })
  }

  console.log(`[api/tasks.[id].delete] deleted task ${taskId} for user ${verifiedUser.id}`)

  return { success: true, id: taskId }
})
