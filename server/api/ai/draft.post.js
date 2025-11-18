import Replicate from 'replicate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
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
        "due_date": string|null,     // ISO YYYY-MM-DD or null if no exact date
        "description": string,       // 1-2 concise sentences
      }
    3) Extract any steps, checkpoints, or subtasks mentioned into an array of subtasks:
      {
        "subtask_1": { "name": string },
        "subtask_2": { "name": string },
        ...
      }
    4) Identify any fields that are still missing or weakly specified.
    5) Ask ONE clear follow-up question to help complete the task. If everything looks complete, ask a short confirmation question.

    Rules:
    - Only set due_date when an exact date is mentioned; otherwise null.
    - If user mentions steps, checkpoints, or subtasks, extract them into the subtasks array as strings.
    - Do not invent facts or subtasks. Use only provided information.
    - Write messages in the same language as the user_transcript but German is mostly used.

    Return a JSON object:
    {
      "task": { 
        name, 
        due_date, 
        description, 
      },
      "subtasks": { 
        "subtask_1": {
          "name": string,
        },
        "subtask_2": {
          "name": string,
        },
        ...
      },
      "missingFields": string[],
      "aiMessage": string,
    }
  `.trim()

  const input = {
    system_prompt: systemPrompt,
    prompt: JSON.stringify({ 
      current_draft: body.draftTask ?? null, 
      user_transcript: body.transcript }) 
  }

  const output = await replicate.run('openai/gpt-4o-mini', { input })
  
  const response = output.join('')

  console.log('[api/ai/draft.post.js] response: ', response)

  let draftResponse
  
  try {
    draftResponse = JSON.parse(response)
    console.log('[api/ai/draft.post.js] draftResponse: ', draftResponse)
  } catch {
    draftResponse = {
      task: { name: 'Not Specified', due_date: null, description: 'Not Speficied', subtasks: null },
      missingFields: [],
      aiMessage: 'Could you restate the task?'
    }
  }

  return { draftResponse }
})


