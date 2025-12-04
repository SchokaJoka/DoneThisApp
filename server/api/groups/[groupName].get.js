import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { groupName } = event.context.params || {}
  if  (!groupName) throw createError({ statusCode: 400, statusMessage: 'groupId is required' })

  const { data, error } = await client
    .from('groups')
    .select('*')
    .eq('title', groupName)
    .single()

  if (error) {
    console.error('[api/aiGroups.[id].get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'groups not found' })
  }

  console.log('[api/groups.[groupName].get] data:', data)

  return data.id
})
