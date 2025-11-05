import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/tasks.[id].get] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/tasks.[id].get] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { taskId } = event.context.params || {}
  if (!taskId) throw createError({ statusCode: 400, statusMessage: 'taskId is required' })

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('[api/tasks.[id].get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  if (data.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return data
})
