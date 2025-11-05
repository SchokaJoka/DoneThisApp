import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // VERIFY SESSION
  const { 
    data: { session } = {}, 
    error: sessionErr 
  } = await client.auth.getSession()
  
  if (sessionErr || !session || !session.user || !session.user.id) {
    console.error('[api/tasks.post] missing session or user id:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const properties = await readBody(event)
  if (!properties) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { data, error } = await client
    .from('tasks')
    .insert([{ 
      ...properties,
      user_id: session.user.id 
    }])
    .select()

  if (error) {
    console.error('[api/tasks.post] supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to create task' })
  }

  return data?.[0] ?? null
})
