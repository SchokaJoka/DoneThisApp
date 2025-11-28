import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)


  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/userCategories.[id].get] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/tauserCategoriessks.[id].get] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { colorName } = event.context.params || {}
  if  (!colorName) throw createError({ statusCode: 400, statusMessage: 'colorName is required' })

  const { data, error } = await client
    .from('user_categories')
    .select(`*`)
    .eq('user_id', verifiedUser.id)
    .single()

  if (error) {
    console.error('[api/userCategories/[id].get] supabase error:', error)
    throw createError({ statusCode: 404, statusMessage: 'groups not found' })
  }
  
  return data[`${colorName}_name`]
})
