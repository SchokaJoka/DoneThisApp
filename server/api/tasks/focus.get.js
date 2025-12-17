// server/api/todos.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // VERIFY SESSION and fetch authenticated user from Supabase
  const { 
    data: { session } = {}, 
    error: sessionErr 
  } = await client.auth.getSession()
  
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/tasks.get] missing session or access token:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // getUser authenticates the user by contacting the Supabase Auth server
  const { data: { user } = {}, error: userErr } = await client.auth.getUser()
  if (userErr || !user || !user.id) {
    console.error('[api/tasks.get] failed to get authenticated user:', userErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const uid = user.id

  // Fetch tasks for this user id
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('user_id', uid)
    .eq('status', 1)
    // return multiple rows (do not use .single() when expecting an array)

  if (error) {
    console.error('[api/tasks.get] supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to fetch tasks' })
  }

  return data
})