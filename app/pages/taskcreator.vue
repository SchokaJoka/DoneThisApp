<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Recording state
const isRecording = ref(false)
const recorder = shallowRef<MediaRecorder | null>(null)
const mediaStream = shallowRef<MediaStream | null>(null)
const chunks: BlobPart[] = []
const audioBlob = shallowRef<Blob | null>(null)
const audioObjectUrl = ref<string | null>(null)

// Transcription state
const language = ref('en')
const transcript = ref('')
const aiResponse = ref('')
const loading = ref(false)
const errorMsg = ref('')

const uploadAndTranscribe = async () => {
    loading.value = true
    errorMsg.value = ''
    transcript.value = ''
    const url = await uploadToSupabase()
    try {
        const res = await $fetch('/api/ai/transcribe', {
            method: 'POST',
            body: { audioUrl: url },
        })
        transcript.value = (res as any).text ?? ''
        aiResponse.value = (res as any).ai ?? ''
    } catch (e: any) {
        errorMsg.value = e?.data?.statusMessage || e?.data?.message || e?.message || 'Failed to transcribe'
    } finally {
        loading.value = false
    // Delete the uploaded audio file from Supabase after processing (cleanup)
    try {
        if (url) {
            // Parse the path from the Supabase public URL
            // Use new URL() to safely handle paths
            const parsed = new URL(url)
            // The pathname starts with a slash - remove it
            const bucketSegments = parsed.pathname.slice(1).split('/')
            const filePath = bucketSegments.slice(1).join('/')
            if (filePath) {
                await supabase.storage.from('audio').remove([filePath])
            }
        }
    } catch (deleteErr) {
        // Optional: Log or silently ignore deletion errors
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
  const filePath = `${user.id}/recordings/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
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
    aiResponse.value = ''
    errorMsg.value = ''
}
</script>

<template>
    <div class="min-h-screen p-4 pb-24">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p class="text-gray-600 mt-1">Add a task using voice or fill out the form below</p>
        </div>

        <!-- Voice Recording Section -->
        <div class="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Voice Recording</h2>
          
          <div class="flex items-center gap-4">
            <button
              v-if="!isRecording"
              @click="startRecording"
              class="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              Start Recording
            </button>
            <button
              v-else
              @click="stopRecording"
              class="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors animate-pulse"
            >
              <div class="w-3 h-3 bg-white rounded-full"></div>
              Stop Recording
            </button>

            <button
              v-if="audioObjectUrl || transcript || aiResponse"
              :disabled="loading"
              @click="clearAll"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <p v-if="isRecording" class="text-sm text-gray-600 flex items-center gap-2">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Recording in progress...
          </p>

          <p v-if="audioObjectUrl && !isRecording" class="text-sm text-gray-600">
            Recording complete. Uploading and transcribing...
          </p>

          <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600 whitespace-pre-wrap">{{ errorMsg }}</p>
          </div>

          <div v-if="transcript" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Transcribed Text</label>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ transcript }}</p>
            </div>
          </div>

          <div v-if="aiResponse" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">AI Response</label>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ aiResponse }}</p>
            </div>
          </div>
        </div>

        <!-- Task Form Section -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
          <TaskForm />
        </div>
      </div>
    </div>
</template>