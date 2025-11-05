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
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  description: string
}

const draftTask = ref<DraftTask>({ name: '', priority: 'low', due_date: null, description: '' })
const aiMessage = ref('')
const nextQuestion = ref('')
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
        aiMessage.value = ai.message || ''
        nextQuestion.value = ai.nextQuestion || ''
        missingFields.value = Array.isArray(ai.missingFields) ? ai.missingFields : []
        if (ai.task && typeof ai.task === 'object') {
            draftTask.value = {
                name: ai.task.name || '',
                priority: (ai.task.priority || 'low'),
                due_date: ai.task.due_date || null,
                description: ai.task.description || ''
            }
        }
        if (aiMessage.value) messages.value.push({ role: 'assistant', content: aiMessage.value })
        if (nextQuestion.value) messages.value.push({ role: 'assistant', content: nextQuestion.value })
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
    } catch {}
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
    } catch {}
    audioBlob.value = null
    if (audioObjectUrl.value) {
        URL.revokeObjectURL(audioObjectUrl.value)
        audioObjectUrl.value = null
    }
    transcript.value = ''
    aiMessage.value = ''
    nextQuestion.value = ''
    missingFields.value = []
    messages.value = [{ role: 'assistant', content: 'What can I help you with today?' }]
    draftTask.value = { name: '', priority: 'low', due_date: null, description: '' }
    errorMsg.value = ''
}

async function createFromDraft() {
    if (!draftTask.value.name) return
    const created = await createTask({
        name: draftTask.value.name,
        description: draftTask.value.description || null,
        effort: null,
        due_date: draftTask.value.due_date || null,
        due_time: null
    })
    if (created && (created as any).id) {
        // Optional reset and navigate
        clearAll()
        try { await router.push('/mytasks') } catch {}
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
</script>

<template>
    <!-- "Chat" window - directly on page, no wrapper -->
    <div 
        ref="chatContainer"
        class="flex-1 p-6 pb-32 overflow-y-auto flex flex-col gap-4"
        style="min-height: calc(100vh - 200px);"
    >
        <!-- Conversation -->
        <div v-for="(m, idx) in messages" :key="idx">
          <transition :name="m.role === 'assistant' ? 'chat-slide-left' : 'chat-slide-right'">
            <div :class="m.role === 'assistant' ? 'flex' : 'flex justify-end'">
              <div class="flex items-end gap-2">
                <template v-if="m.role === 'assistant'">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">AI</div>
                  <div class="bg-blue-50 text-gray-900 p-4 rounded-2xl rounded-bl-lg max-w-xs shadow text-sm whitespace-pre-wrap">{{ m.content }}</div>
                </template>
                <template v-else>
                  <div class="bg-green-100 text-gray-800 p-4 rounded-2xl rounded-br-lg max-w-xs shadow text-sm">{{ m.content }}</div>
                  <div class="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700">You</div>
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
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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


    <!-- Draft Task Card - outside chat, fixed position -->
    <transition name="chat-slide-left">
    <div v-if="extractedTask" class="fixed bottom-64 left-1/2 -translate-x-1/2 z-[95] w-[22rem] max-w-[90vw]">
      <div class="bg-white border border-gray-200 rounded-xl shadow p-4 text-sm">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-base font-semibold text-gray-900">{{ extractedTask.name }}</h3>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="{
              'bg-red-100 text-red-700': extractedTask.priority === 'high',
              'bg-yellow-100 text-yellow-700': extractedTask.priority === 'medium',
              'bg-green-100 text-green-700': extractedTask.priority === 'low'
            }"
          >
            {{ extractedTask.priority || 'n/a' }}
          </span>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          <span class="font-medium">Due:</span>
          <span>{{ extractedTask.due_date || 'No exact date' }}</span>
        </div>
        <p class="mt-2 text-gray-700 whitespace-pre-wrap">{{ extractedTask.description }}</p>
        <div v-if="missingFields.length" class="mt-3 text-xs text-gray-600">
          <span class="font-medium">Missing:</span>
          <span>{{ missingFields.join(', ') }}</span>
        </div>
      </div>
    </div>
    </transition>

    <!-- Confirm/Create button -->
    <div class="fixed bottom-44 left-1/2 -translate-x-1/2 z-[100]">
      <button
        @click="createFromDraft"
        :disabled="creatingTask || !draftTask.name"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ creatingTask ? 'Creating…' : (draftTask.name ? 'Create Task' : 'Set task details to enable') }}
      </button>
    </div>

    <!-- Recording mic button - absolute on page -->
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]">
    <button
        @click="isRecording ? stopRecording() : startRecording()"
        :disabled="loading"
        :class="[
        'flex items-center justify-center w-16 h-16 text-white font-medium rounded-full transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed',
        isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'
        ]"
    >
        <template v-if="!isRecording">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
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
  transition: opacity 0.4s, transform 0.5s cubic-bezier(.32,1.11,.29,1);
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
  transition: opacity 0.45s, transform 0.45s cubic-bezier(.32,1.11,.29,1);
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
  transition: opacity 0.45s, transform 0.45s cubic-bezier(.32,1.11,.29,1);
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