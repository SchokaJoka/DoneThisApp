import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/categories.[userId].get] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/categories.[userId].get] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { categoryId } = event.context.params || {}
  if  (!categoryId) throw createError({ statusCode: 400, statusMessage: 'categoryId is required' })

  const { data, error } = await client
    .from('categories')
    .select('name, color, id, src')
    .eq('user_id', verifiedUser.id)
    .eq('id', categoryId)
    .single()

  if (error) {
    console.error('[api/categories.[id].get] supabase error:', error)
    // If row not found supabase returns 406? but standardize to 404
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  // if (data.user_id !== verifiedUser.id) {
  //   throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  // }

  return data
})
