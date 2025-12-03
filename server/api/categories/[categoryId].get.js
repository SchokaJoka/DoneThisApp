import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { categoryId } = event.context.params || {}
  if  (!categoryId) throw createError({ statusCode: 400, statusMessage: 'categoryId is required' })

  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (error) {
    console.error('[api/categories/[id].get] supabase error:', error)
    throw createError({ statusCode: 404, statusMessage: 'groups not found' })
  }

  return data
})
