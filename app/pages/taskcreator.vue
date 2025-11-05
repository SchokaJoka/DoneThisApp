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
    <div class="p-4 max-w-2xl  mx-auto fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <div class="flex items-center gap-3">
            <div>
                <button v-if="!isRecording" @click="startRecording" class="px-3 py-2 bg-green-600 text-white rounded">
                    Start Recording
                </button>
                <button v-else @click="stopRecording" class="px-3 py-2 bg-red-600 text-white rounded">
                    Stop Recording
                </button>
            </div>
            <div v-if="audioObjectUrl" class="space-y-2">
                <div class="flex gap-2">
                    <div class="flex items-center gap-2">
                        <div class="text-sm text-slate-500">The recording will be uploaded and transcribed automatically when you stop.</div>
                        <button :disabled="loading" @click="clearAll" class="px-3 py-2 border rounded">
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <p v-if="errorMsg" class="text-red-600 whitespace-pre-wrap">{{ errorMsg }}</p>
            <div class="mt-3">
                <label class="block text-sm font-medium mb-1">transciptet text</label>
                <pre v-if="transcript" class="whitespace-pre-wrap border p-3 rounded bg-slate-50">{{ transcript }}</pre>
            </div>
            <div class="mt-3">
                <label class="block text-sm font-medium mb-1">AI Response</label>
                <pre v-if="aiResponse" class="whitespace-pre-wrap border p-3 rounded bg-slate-50">{{ aiResponse }}</pre>
            </div>
    </div>



    <div class="w-screen h-screen flex items-center justify-center">
        <TaskForm />
    </div>
</template>