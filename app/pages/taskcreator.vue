<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

console.log('Current user:', user.value)

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
const loading = ref(false)
const errorMsg = ref('')

const uploadAndTranscribe = async () => {
    loading.value = true
    errorMsg.value = ''
    transcript.value = ''
    try {
        const url = await uploadToSupabase()
        const res = await $fetch('/api/transcribe', {
            method: 'POST',
            body: { audioUrl: url, language: language.value },
        })
        transcript.value = (res as any).text ?? ''
    } catch (e: any) {
        errorMsg.value = e?.data?.statusMessage || e?.data?.message || e?.message || 'Failed to transcribe'
    } finally {
        loading.value = false
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
        mr.onstop = () => {
            const typeFinal = mr.mimeType || 'audio/webm'
            audioBlob.value = new Blob(chunks, { type: typeFinal })
            if (audioObjectUrl.value) URL.revokeObjectURL(audioObjectUrl.value)
            audioObjectUrl.value = URL.createObjectURL(audioBlob.value)
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
</script>

<template>
    <div class="space-y-6 p-4 max-w-2xl mx-auto">
        <h1 class="text-2xl font-semibold">Record and transcribe</h1>

        <div class="flex items-center gap-3">
            <button v-if="!isRecording" @click="startRecording" class="px-3 py-2 bg-green-600 text-white rounded">
                Start Recording
            </button>
            <button v-else @click="stopRecording" class="px-3 py-2 bg-red-600 text-white rounded">
                Stop Recording
            </button>
            <input v-model="language" class="border p-2 w-28" placeholder="en" />
        </div>

        <div v-if="audioObjectUrl" class="space-y-2">
            <audio :src="audioObjectUrl" controls class="w-full"></audio>
            <div class="flex gap-2">
                <button :disabled="loading || !audioObjectUrl" @click="uploadAndTranscribe" class="px-3 py-2 bg-blue-600 text-white rounded">
                    {{ loading ? 'Uploading & Transcribing…' : 'Upload & Transcribe' }}
                </button>
                <button :disabled="loading" @click="() => { transcript=''; errorMsg=''; }" class="px-3 py-2 border rounded">
                    Clear
                </button>
            </div>
        </div>

        <p v-if="errorMsg" class="text-red-600 whitespace-pre-wrap">{{ errorMsg }}</p>
        <pre v-if="transcript" class="whitespace-pre-wrap border p-3 rounded">{{ transcript }}</pre>
    </div>

    <TaskForm />
</template>