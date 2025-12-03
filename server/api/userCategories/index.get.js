import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/userCategories.get] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/tasks.[id].get] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data, error } = await client
    .from('user_categories')
    .select('*')
    .single()
    .eq('user_id', verifiedUser.id)

  if (error) {
    console.error('[api/userCategories.get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return data
})
