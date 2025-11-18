import Replicate from 'replicate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.audioUrl) {
    throw createError({ statusCode: 400, statusMessage: 'audioUrl is required' })
  }

  const { replicateApiToken } = useRuntimeConfig()
  if (!replicateApiToken) {
    throw createError({ statusCode: 500, statusMessage: 'REPLICATE_API_TOKEN is not configured' })
  }

  const replicate = new Replicate({ auth: replicateApiToken })
  const input = {
    language: 'de',
    audio_file: body.audioUrl,
  }

  let output
  try {
    output = await replicate.run('openai/gpt-4o-mini-transcribe', { input })
    
  } catch (err) {
    console.error('[api/ai/transcribe.post.js] transcription error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `Transcription failed: ${err?.message ?? 'unknown error'}`
    })
  }

  console.log('[api/ai/transcribe.post.js] output: ', output)
  const text = output.join('')

  return text
})
