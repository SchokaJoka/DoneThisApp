import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('categories')
    .select('*')

  if (error) {
    console.error('[api/categories.[id].get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return data
})
