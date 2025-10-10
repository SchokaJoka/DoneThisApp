import Replicate from 'replicate'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ audioUrl?: string; language?: string }>(event)
  if (!body?.audioUrl) {
    throw createError({ statusCode: 400, statusMessage: 'audioUrl is required' })
  }

  const { replicateApiToken } = useRuntimeConfig()
  if (!replicateApiToken) {
    throw createError({ statusCode: 500, statusMessage: 'REPLICATE_API_TOKEN is not configured' })
  }

  const replicate = new Replicate({ auth: replicateApiToken })
  const input = {
    language: body.language ?? 'en',
    audio_file: body.audioUrl,
  }

  // Replicate.run returns various shapes depending on model; normalize to text
  const output = await replicate.run('openai/gpt-4o-mini-transcribe', { input } as any)
  const text = Array.isArray(output)
    ? output.join('')
    : typeof output === 'string'
      ? output
      : JSON.stringify(output)

  return { text }
})
