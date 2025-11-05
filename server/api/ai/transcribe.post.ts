import Replicate from 'replicate'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ audioUrl?: string }>(event)
  if (!body?.audioUrl) {
    throw createError({ statusCode: 400, statusMessage: 'audioUrl is required' })
  }

  const { replicateApiToken } = useRuntimeConfig()
  if (!replicateApiToken) {
    throw createError({ statusCode: 500, statusMessage: 'REPLICATE_API_TOKEN is not configured' })
  }

  const replicate = new Replicate({ auth: replicateApiToken })
  const input = {
    language:'',
    audio_file: body.audioUrl,
  }

  // Replicate.run returns various shapes depending on model; normalize to text
  const output = await replicate.run('openai/gpt-4o-mini-transcribe', { input } as any)
  const text = Array.isArray(output)
    ? output.join('')
    : typeof output === 'string'
      ? output
      : JSON.stringify(output)

  // Now send the transcription to a GPT model on Replicate with a system prompt.
  // The client can provide an optional `systemPrompt` in the body; otherwise a sensible default is used.
  const systemPrompt = `
You are an extractor that converts a transcript into a single task definition. Read the transcript (the user message) and output only valid JSON (no explanation, no surrounding text) with exactly these keys:
{
  "name": string,        // short, imperative title (<= 10 words)
  "priority": string,    // one of: "low", "medium", "high"
  "due_date": string | null, // ISO 8601 date "YYYY-MM-DD" or null if no exact date
  "description": string  // 1-2 sentence summary with important details
}

Rules:
- Choose the most important actionable item in the transcript.
- Derive priority from language: words like "ASAP", "urgent", "today" -> "high"; "by next week", "by Friday" -> "medium"; "whenever", "sometime" -> "low".
- If the transcript contains an explicit calendar date, convert it to ISO "YYYY-MM-DD". If only a vague/relative date is present (e.g., "next week", "end of month") and you cannot reliably convert to an exact date, set due_date to null.
- Keep "name" concise (<= 10 words) and imperative (e.g., "Prepare Q3 budget draft").
- "description" should be a brief 1-2 sentence summary including key details (assignees, deliverables, constraints) found in the transcript.
- Do not invent facts not present in the transcript; only use information from the transcript.
- Use the provided language from the transcript for your output.

Output exactly one JSON object that follows the schema above.
`.trim()

  // Prepare messages for the GPT model. Different Replicate models accept different inputs; this uses a common messages shape.
  const gptInput = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ]
  }

  // Call a GPT model on Replicate (replace model name if you use a different one)
  const aiOutput = await replicate.run('openai/gpt-4o-mini', { input: gptInput } as any)
  const ai = Array.isArray(aiOutput)
    ? aiOutput.join('')
    : typeof aiOutput === 'string'
      ? aiOutput
      : JSON.stringify(aiOutput)

  return { text, ai }
})
