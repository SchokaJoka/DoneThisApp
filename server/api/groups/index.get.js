import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('groups')
    .select('*')

  if (error) {
    console.error('[api/aiGroups.[id].get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'groups not found' })
  }

  return data
})
