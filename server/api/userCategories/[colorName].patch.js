import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)


  // verify session
  const { data: { session } = {}, error: sessionErr } = await client.auth.getSession()
  if (sessionErr || !session || !session.access_token) {
    console.error('[api/userCategories.[id].patch] missing session:', sessionErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } = await client.auth.getUser(session.access_token)
  if (verifyErr || !verifiedUser) {
    console.error('[api/userCategories.[id].update] failed to verify user:', verifyErr)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const color = event.context.params?.colorName
  if (!color) throw createError({ statusCode: 400, statusMessage: 'color is required' })

  const body = await readBody(event)
  const newName = body.newName
  if (!newName) throw createError({ statusCode: 400, statusMessage: 'newName is required' })

  const colorId = `${color}_name`

  const { data, error } = await client
    .from('user_categories')
    .update({ [colorId]: newName})
    .eq('user_id', verifiedUser.id)
    .select()
    .single()

  if (error) {
    console.error('[api/userCategories/[id].patch] supabase error:', error)
    throw createError({ statusCode: 404, statusMessage: 'user category not found' })
  }
  
  return data[`${color}_name`]
})
