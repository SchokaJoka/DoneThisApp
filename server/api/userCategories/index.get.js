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
    .eq('user_id', verifiedUser.id)
    .single()

  if (error) {
    // PGRST116 = no rows returned - this is OK, user just doesn't have custom categories yet
    if (error.code === 'PGRST116') {
      throw createError ({ statusCode: 404, statusMessage: 'User has no Row in userCategories' })
      return {}
    }
    console.error('[api/userCategories.get] supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user categories' })
  }

  return data
})
