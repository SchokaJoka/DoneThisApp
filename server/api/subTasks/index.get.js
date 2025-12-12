import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/subTasks/get] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/subTasks/get] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data, error } = await client
    .from('sub_tasks')
    .select('*')

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError ({ statusCode: 404, statusMessage: '[api/subTasks/get] User has no Row in subTasks' })
      return {}
    }
    console.error('[api/subTasks/get] supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch subTasks' })
  }

  return data
})
