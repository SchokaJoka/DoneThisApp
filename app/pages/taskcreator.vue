<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { createTask, loading: creatingTask } = useTasks()
const router = useRouter()

// Recording state
const isRecording = ref(false)
const recorder = shallowRef<MediaRecorder | null>(null)
const mediaStream = shallowRef<MediaStream | null>(null)
const chunks: BlobPart[] = []
const audioBlob = shallowRef<Blob | null>(null)
const audioObjectUrl = ref<string | null>(null)

// Transcription / chat state
const language = ref('en')
const transcript = ref('')
const loading = ref(false)
const errorMsg = ref('')

type DraftTask = {
  name: string
  due_date: string | null
  description: string
  subtasks: string[] | null
}

const draftTask = ref<DraftTask>({ name: '', due_date: null, description: '', subtasks: null })
const aiMessage = ref('')
const missingFields = ref<string[]>([])
const messages = ref<Array<{ role: 'assistant' | 'user', content: string }>>([
  { role: 'assistant', content: 'What can I help you with today?' }
])

const extractedTask = computed(() => {
  if (!draftTask.value || !draftTask.value.name) return null
  return draftTask.value
})

const uploadAndTranscribe = async () => {
  loading.value = true
  errorMsg.value = ''
  transcript.value = ''
  const url = await uploadToSupabase()
  try {
    // 1) Transcribe only
    const tRes: any = await $fetch('/api/ai/transcribe', {
      method: 'POST',
      body: { audioUrl: url },
    })
    console.log('[client] /api/ai/transcribe response:', tRes)
    transcript.value = tRes?.text ?? ''
    if (transcript.value) messages.value.push({ role: 'user', content: transcript.value })

    // 2) Merge into draft
    const dRes: any = await $fetch('/api/ai/draft', {
      method: 'POST',
      body: { transcript: transcript.value, draftTask: draftTask.value },
    })
    console.log('[client] /api/ai/draft response:', dRes)
    const ai = dRes?.ai || {}
    aiMessage.value = ai.aiMessage || ''
    missingFields.value = Array.isArray(ai.missingFields) ? ai.missingFields : []
    if (ai.task && typeof ai.task === 'object') {
      draftTask.value = {
        name: ai.task.name || '',
        due_date: ai.task.due_date || null,
        description: ai.task.description || '',
        subtasks: ai.task.subtasks || null
      }
    }
    if (aiMessage.value) messages.value.push({ role: 'assistant', content: aiMessage.value })
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.data?.message || e?.message || 'Failed to transcribe'
  } finally {
    loading.value = false
    // Delete the uploaded audio file from Supabase after processing (cleanup)
    try {
      if (url) {
        const parsed = new URL(url)
        const bucketSegments = parsed.pathname.slice(1).split('/')
        const bucketIndex = bucketSegments.indexOf('audio')
        const filePath = bucketIndex >= 0 ? bucketSegments.slice(bucketIndex + 1).join('/') : ''
        if (filePath) {
          await supabase.storage.from('audio').remove([filePath])
          console.log('Audio file deleted from Supabase' + filePath)
        }
      }
    } catch (deleteErr) {
      console.error('Supabase cleanup error:', deleteErr)
    }
  }
}

const supportedType = () => {
  // Prefer webm/opus; fallback to audio/webm; as last resort use default
  const candidates = ['audio/webm;codecs=opus', 'audio/webm']
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

const startRecording = async () => {
  errorMsg.value = ''
  transcript.value = ''
  try {
    // Request mic access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStream.value = stream
    const type = supportedType()
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    chunks.length = 0
    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    mr.onstop = async () => {
      const typeFinal = mr.mimeType || 'audio/webm'
      audioBlob.value = new Blob(chunks, { type: typeFinal })
      if (audioObjectUrl.value) URL.revokeObjectURL(audioObjectUrl.value)
      audioObjectUrl.value = URL.createObjectURL(audioBlob.value)
      // automatically upload and transcribe when recording stops
      try {
        await uploadAndTranscribe()
      } catch (e) {
        // uploadAndTranscribe already sets errorMsg; swallow here
      }
    }
    mr.start()
    recorder.value = mr
    isRecording.value = true
  } catch (e: any) {
    errorMsg.value = e?.message || 'Microphone permission denied or unsupported browser.'
  }
}

const stopRecording = () => {
  if (!recorder.value) return
  recorder.value.stop()
  // Stop all tracks so the mic icon turns off
  mediaStream.value?.getTracks().forEach(t => t.stop())
  isRecording.value = false
}

onBeforeUnmount(() => {
  try {
    if (recorder.value && recorder.value.state !== 'inactive') recorder.value.stop()
    mediaStream.value?.getTracks().forEach(t => t.stop())
    if (audioObjectUrl.value) URL.revokeObjectURL(audioObjectUrl.value)
  } catch { }
})

const uploadToSupabase = async (): Promise<string> => {
  if (!audioBlob.value) throw new Error('No audio recorded.')

  // Always fetch a fresh user to ensure an id is present
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  if (!user) throw new Error('You must be logged in to upload.')

  console.log('USER ID: ', user.id)

  const fileExt = audioBlob.value.type.includes('webm') ? 'webm' : 'ogg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `${user.id}/recordings/${fileName}`
  console.log('Uploading to:', filePath)

  const { error: upErr } = await supabase.storage
    .from('audio')
    .upload(filePath, audioBlob.value, { contentType: audioBlob.value.type })
  if (upErr) {
    console.error('Upload error:', upErr)
    throw new Error(upErr.message)
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('audio')
    .createSignedUrl(filePath, 60 * 15)
  if (signErr || !signed?.signedUrl) throw new Error(signErr?.message || 'Failed to create signed URL.')

  console.log('File uploaded and signed URL created:', signed.signedUrl)
  return signed.signedUrl
}

const clearAll = () => {
  try {
    if (recorder.value && recorder.value.state !== 'inactive') recorder.value.stop()
  } catch { }
  audioBlob.value = null
  if (audioObjectUrl.value) {
    URL.revokeObjectURL(audioObjectUrl.value)
    audioObjectUrl.value = null
  }
  transcript.value = ''
  aiMessage.value = ''
  missingFields.value = []
  messages.value = [{ role: 'assistant', content: 'What can I help you with today?' }]
  draftTask.value = { name: '', due_date: null, description: '', subtasks: null }
  errorMsg.value = ''
}

async function createFromDraft() {
  if (!draftTask.value.name) return
  
  // Convert subtasks to JSON strings for database storage
  let subtasksForDb = null
  if (draftTask.value.subtasks && draftTask.value.subtasks.length > 0) {
    subtasksForDb = draftTask.value.subtasks.map(st => 
      JSON.stringify({ text: st, done: false })
    )
  }
  
  const created = await createTask({
    name: draftTask.value.name,
    description: draftTask.value.description || null,
    due_date: draftTask.value.due_date || null,
    due_time: null,
    subtasks: subtasksForDb
  })
  if (created && (created as any).id) {
    // Optional reset and navigate
    clearAll()
    try { await router.push('/mytasks') } catch { }
  }
}

// Chat container ref for auto-scrolling
const chatContainer = ref<HTMLElement | null>(null)

// Auto-scroll to bottom when new messages arrive
watch([transcript, aiMessage, loading], () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
})

// Scroll to bottom on mount
onMounted(() => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
})

function formatDate(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<template>
  <!-- Back to My Tasks button -->
  <div class="fixed top-5 right-5 z-[100]">
    <NuxtLink
      to="/mytasks"
      class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow border border-gray-200 transition-colors"
    >
      <span class="font-medium">My Tasks</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </NuxtLink>
  </div>

  <!-- Draft Task Card - outside chat, fixed position -->
  <transition name="chat-slide-left">
    <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[95] w-[320px]">
      <div 
      class="bg-blue-100 border-2 border-blue-200 w-[320px] h-[480px] flex flex-col justify-between px-[12px] py-[35px] rounded-lg shadow-lg"
      >
      <!-- Title -->
      <div class="w-full">
        <h3 class="text-xl font-bold mb-2 text-center text-black">
        {{ draftTask.name || 'Untitled Task' }}
        </h3>
      </div>

      <!-- Description -->
      <div class="flex-1 overflow-auto">
        <span v-if="draftTask.description" class="text-sm text-black">
        {{ draftTask.description }}
        </span>
        <span v-else class="text-sm text-gray-400 italic">
        No description yet
        </span>
      </div>

      <!-- Subtasks -->
      <div v-if="draftTask.subtasks && draftTask.subtasks.length > 0" class="w-full space-y-1 mb-4">
        <div 
        v-for="(subtask, index) in draftTask.subtasks" 
        :key="index"
        class="flex items-start gap-2"
        >
        <div class="w-3 h-3 mt-0.5 rounded-sm border-2 border-gray-400"></div>
        <span class="text-xs text-black">
          {{ subtask }}
        </span>
        </div>
      </div>

      <!-- Bottom section with date and missing fields -->
      <div>
        <div v-if="draftTask.due_date" class="mb-2">
        <span class="text-sm text-black">
          {{ formatDate(draftTask.due_date) }}
        </span>
        </div>

        <div v-if="missingFields.length" class="mb-4">
        <div class="text-xs text-gray-600 bg-white/50 rounded-lg px-3 py-2">
          <span class="font-medium">Missing:</span>
          <span> {{ missingFields.join(', ') }}</span>
        </div>
        </div>
      </div>

      </div>
    </div>
  </transition>



  <!-- "Chat" window - directly on page, no wrapper -->
  <div ref="chatContainer" class="fixed bottom-20 flex-1 w-screen h-[250px] p-6 pb-32 overflow-y-auto flex flex-col gap-4">
    <!-- Conversation -->
    <div v-for="(m, idx) in messages" :key="idx">
      <transition :name="m.role === 'assistant' ? 'chat-slide-left' : 'chat-slide-right'">
        <div :class="m.role === 'assistant' ? 'flex' : 'flex justify-end'">
          <div class="flex items-end gap-2">
            <template v-if="m.role === 'assistant'">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                AI</div>
              <div
                class="bg-blue-50 text-gray-900 p-4 rounded-2xl rounded-bl-lg max-w-xs shadow text-sm whitespace-pre-wrap">
                {{ m.content }}</div>
            </template>
            <template v-else>
              <div class="bg-green-100 text-gray-800 p-4 rounded-2xl rounded-br-lg max-w-xs shadow text-sm">{{ m.content
                }}</div>
              <div
                class="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700">
                You</div>
            </template>
          </div>
        </div>
      </transition>
    </div>

    <!-- (Draft card moved outside chat) -->

    <!-- Loading indicator (when uploading/transcribing) -->
    <transition name="fade">
      <div v-if="loading" class="flex justify-center py-2">
        <svg class="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
      </div>
    </transition>

    <!-- Error (if any) -->
    <transition name="fade">
      <div v-if="errorMsg" class="flex justify-center">
        <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600 max-w-sm w-full">
          {{ errorMsg }}
        </div>
      </div>
    </transition>
  </div>




  <!-- Confirm/Create button -->
  <div class="fixed bottom-5 right-5 h-16 z-[100]">
    <button @click="createFromDraft" :hidden="creatingTask || !draftTask.name"
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed">
      {{ creatingTask ? 'Creating…' : (draftTask.name ? 'Create Task' : 'Set task details to enable') }}
    </button>
  </div>

  <!-- Recording mic button - absolute on page -->
  <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]">
    <button @click="isRecording ? stopRecording() : startRecording()" :disabled="loading" :class="[
      'flex items-center justify-center w-16 h-16 text-white font-medium rounded-full transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed',
      isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'
    ]">
      <template v-if="!isRecording">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path
            d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </template>
      <template v-else>
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </template>
    </button>
  </div>
</template>

<style scoped>
/* Chat message fade-in up from bottom */
.chat-fade-up-enter-active,
.chat-fade-up-leave-active {
  transition: opacity 0.4s, transform 0.5s cubic-bezier(.32, 1.11, .29, 1);
}

.chat-fade-up-enter-from,
.chat-fade-up-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.chat-fade-up-enter-to,
.chat-fade-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Right-to-left for user message - slides up from bottom */
.chat-slide-right-enter-active,
.chat-slide-right-leave-active {
  transition: opacity 0.45s, transform 0.45s cubic-bezier(.32, 1.11, .29, 1);
}

.chat-slide-right-enter-from,
.chat-slide-right-leave-to {
  opacity: 0;
  transform: translateY(30px) translateX(20px);
}

.chat-slide-right-enter-to,
.chat-slide-right-leave-from {
  opacity: 1;
  transform: translateY(0) translateX(0);
}

/* Left-to-right for ai message - slides up from bottom */
.chat-slide-left-enter-active,
.chat-slide-left-leave-active {
  transition: opacity 0.45s, transform 0.45s cubic-bezier(.32, 1.11, .29, 1);
}

.chat-slide-left-enter-from,
.chat-slide-left-leave-to {
  opacity: 0;
  transform: translateY(30px) translateX(-20px);
}

.chat-slide-left-enter-to,
.chat-slide-left-leave-from {
  opacity: 1;
  transform: translateY(0) translateX(0);
}

/* Simple fade-in-out for errors/loading/clear */
.fade-enter-active,
.fade-leave-active,
.mic-fade-enter-active,
.mic-fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to,
.mic-fade-enter-from,
.mic-fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from,
.mic-fade-enter-to,
.mic-fade-leave-from {
  opacity: 1;
}
</style>