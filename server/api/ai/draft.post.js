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


  console.log('[api/ai/draft.post.js] body: ', body)

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
    - currentDraft: a partial task object (may be empty)
    - userTranscript: the user's spoken input in an array of strings
    - userCategories: an array of categories provided by the user to choose from
    - groups: an array of group names provided by the user to choose from

    Your job is to:
    1) Merge any new concrete details from userTranscript into currentDraft.
    2) Keep the task schema exactly:
      {
        "name": string|null,         // short, imperative (<= 10 words)
        "category": string|null,     // from the input provided categories which match the best or null
        "due_date": string|null,     // ISO YYYY-MM-DD or null if no exact date
        "due_time": string|null,     // HH:MM:SS (24h) or null if no exact time
        "description": string|null,  // 1-2 concise sentences
        "group": string|null,        // from the input provided groups which match the best or null
        "subtasks": object|null      // null here, handled separately
      }
    3) Extract any steps, checkpoints, or subtasks mentioned into an object of subtasks:
      {
        "subtask_1": string,
        "subtask_2": string,
        ...
      }
    4) Identify any fields that are still missing or weakly specified.
    5) Ask ONE clear follow-up question to help complete the task. If everything looks complete, ask a short confirmation question.

    Rules:
    - Only set due_date when an exact date is mentioned; otherwise null.
    - If user mentions steps, checkpoints, or subtasks, extract them into the subtasks array as strings.
    - Use cheerful and motivating language in your follow-up question.
    - If userCategories is non-empty, choose the best matching category; otherwise set to null.
    - If groups is non-empty, choose the best matching group; otherwise set to null.
    - Always respond in JSON format as specified below.
    - Do not invent facts or subtasks. Use only provided information.
    - Write messages in the same language as the user_transcript but German is mostly used.

    Return a JSON object:
    {
      "task": { 
        name, 
        category,
        due_date,
        due_time,
        description,
        group
      },
      "subtasks": { 
        "subtask_1": string,
        "subtask_2": string,
        ...
      },
      "aiMessage": string,
    }
  `.trim()

  const input = {
    system_prompt: systemPrompt,
    prompt: JSON.stringify({ 
      currentDraft: body.draftTask ?? null, 
      userTranscript: body.transcript,
      userCategories: body.userCategories ?? [],
      groups: body.groups ?? []
    }) 
  }

  const output = await replicate.run('openai/gpt-4o-mini', { input })
  
  const response = output.join('')

  console.log('[api/ai/draft.post.js] response: ', response)

  let draftResponse
  
  try {
    draftResponse = JSON.parse(response)
  } catch {
    draftResponse = {
      task: { name: 'Not Specified', due_date: null, description: 'Not Speficied', subtasks: null },
      missingFields: [],
      aiMessage: 'Could you restate the task?'
    }
  }

  return { draftResponse }
})


