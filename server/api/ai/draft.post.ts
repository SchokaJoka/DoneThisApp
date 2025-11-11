import Replicate from 'replicate'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ transcript?: string, draftTask?: any }>(event)
  if (!body?.transcript) {
    throw createError({ statusCode: 400, statusMessage: 'transcript is required' })
  }

  const { replicateApiToken } = useRuntimeConfig()
  if (!replicateApiToken) {
    throw createError({ statusCode: 500, statusMessage: 'REPLICATE_API_TOKEN is not configured' })
  }

  const replicate = new Replicate({ auth: replicateApiToken })

  const now = new Date()
  const currentDateTime = now.toISOString() // e.g. 2025-11-11T13:45:30.000Z
  const currentDate = currentDateTime.slice(0, 10) // YYYY-MM-DD
  const currentTime = currentDateTime.slice(11, 19) // HH:MM:SS

  const systemPrompt = `
You are helping a user define a single task through a short conversation.
Current server date/time (ISO 8601, UTC): ${currentDateTime}
Current server date: ${currentDate}
Current server time (UTC): ${currentTime}

You receive:
- current_draft: a partial task object (may be empty)
- user_transcript: the user's latest spoken input

Your job:
1) Merge any new concrete details from user_transcript into current_draft.
2) Keep the task schema exactly:
   {
     "name": string,               // short, imperative (<= 10 words)
     "priority": "low"|"medium"|"high",
     "due_date": string|null,     // ISO YYYY-MM-DD or null if no exact date
     "description": string,       // 1-2 concise sentences
     "subtasks": array|null       // array of strings representing subtasks, or null if none mentioned
   }
3) Identify which fields are still missing or weakly specified.
4) Ask ONE clear follow-up question to help complete the task. If everything looks complete, ask a short confirmation question.

Rules:
- Derive priority from language cues ("ASAP" -> high, "by Friday" -> medium, etc.).
- Only set due_date when an exact date is known; otherwise null.
- If user mentions steps, checkpoints, or subtasks, extract them into the subtasks array as strings.
- Do not invent facts. Use only provided information.
- Write messages in the same language as the user_transcript.

Return a JSON object:
{
  "task": { name, priority, due_date, description, subtasks },
  "missingFields": string[],
  "message": string,
  "nextQuestion": string
}
`.trim()

  const gptInput = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify({ current_draft: body.draftTask ?? null, user_transcript: body.transcript }) }
    ]
  }

  const aiOutput = await replicate.run('openai/gpt-4o-mini', { input: gptInput } as any)
  const aiRaw = Array.isArray(aiOutput)
    ? aiOutput.join('')
    : typeof aiOutput === 'string'
      ? aiOutput
      : JSON.stringify(aiOutput)

  let ai
  try {
    ai = JSON.parse(aiRaw)
  } catch {
    ai = {
      task: { name: '', priority: 'low', due_date: null, description: '', subtasks: null },
      missingFields: ['name', 'description'],
      message: aiRaw,
      nextQuestion: 'Could you restate the task name and a brief description?'
    }
  }

  return { ai }
})


