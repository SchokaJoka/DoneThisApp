<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Recording state
// =================================
const isRecording = ref(false)
const recorder = shallowRef(null)
const mediaStream = shallowRef(null)
const chunks = []
const audioBlob = shallowRef(null)
const errorMsg = ref('')
// =================================

// user ID
const userId = ref(user.value.sub)

// transcript
const userTranscript = ref('')
const assistantResponse = ref({})
const assistantDraft = ref({})

const userTask = {
  name: ref(''),
  description: ref(''),
  category: ref(''),
  due_date: ref(''),
  due_time: ref(''),
}

const categories = ref({})



// Get and store user ID on mount
onMounted(async () => {
  categories.value = await getUserCategories()

})

async function getUserCategories() {
  const data = await $fetch('/api/categories', {
    method: 'GET',
  })
  return data
}

function supportedType() {
  // Prefer webm/opus; fallback to audio/webm
  const candidates = ['audio/webm;codecs=opus', 'audio/webm']
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

async function startRecording() {
  errorMsg.value = ''
  try {
    // Request mic access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStream.value = stream
    const type = supportedType()
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    chunks.length = 0
    
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    
    mr.onstop = async () => {
      const typeFinal = mr.mimeType || 'audio/webm'
      audioBlob.value = new Blob(chunks, { type: typeFinal })
    }
    
    mr.start()
    recorder.value = mr
    isRecording.value = true
  } catch (e) {
    errorMsg.value = e?.message || 'Microphone permission denied or unsupported browser.'
  }

  return
}

async function stopRecording() {
  if (!recorder.value) return
  recorder.value.stop()
  // Stop all tracks so the mic icon turns off
  mediaStream.value?.getTracks().forEach(t => t.stop())
  isRecording.value = false
  
  // Wait a moment for the blob to be ready, then handle upload
  await new Promise(resolve => setTimeout(resolve, 100))
  await handleUserAudio()
  return
}

async function handleUserAudio() {
  const filePath = await uploadAudio()
  if (filePath) {
    const signedUrl = await getFileUrl(filePath)

    userTranscript.value = await transcribeAudio(signedUrl)
    
    if (!userTranscript.value) {
      errorMsg.value = 'Failed to transcribe audio.'
      return
    }

  } else {
    console.log('No file path returned from uploadAudio()')
    return
  }

  assistantResponse.value = await getAssistantDraft(userTranscript.value, assistantDraft.value)

  return
}

async function uploadAudio() {
  if (!audioBlob.value) {
    errorMsg.value = 'No audio recorded.'
    return null
  }

  if (!userId.value) {
    errorMsg.value = 'You must be logged in to upload.'
    return null
  }

  try {
    // Create file path
    const fileExt = audioBlob.value.type.includes('webm') ? 'webm' : 'ogg'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const fileName = `${timestamp}.${fileExt}`
    const filePath = `${userId.value}/recordings/${fileName}`

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBlob.value, { contentType: audioBlob.value.type })
    
    if (upErr) throw new Error(upErr.message)

    console.log('Audio uploaded successfully. filePath:', filePath)
    return filePath
  } catch (e) {
    errorMsg.value = e?.message || 'Failed to upload audio'
    console.error('Upload error:', e)
    return null
  }
}

async function getFileUrl(filePath){
  if (!filePath) {
    errorMsg.value = 'Missing file path.'
    return null
  }

  if (!userId.value) {
    errorMsg.value = 'User not logged in.'
    return null
  }

  try {
    // Create signed URL (valid for 15 minutes)
    const { data: signed, error: signErr } = await supabase.storage
      .from('audio')
      .createSignedUrl(filePath, 60 * 15)
    
    if (signErr || !signed?.signedUrl) {
      throw new Error(signErr?.message || 'Failed to create signed URL.')
    }

    console.log('Signed URL created:', signed.signedUrl)
    return signed.signedUrl
  } catch (e) {
    errorMsg.value = e?.message || 'Failed to create signed URL'
    console.error('Signed URL error:', e)
    return null
  }
}

async function transcribeAudio(url) {
  const data = await $fetch('/api/ai/transcribe', {
    method: 'POST',
    body: {
      audioUrl: url
    },
  })

  console.log('fetch /api/ai/transcribe data: ', data)
  return data || ''
}

async function getAssistantDraft(userTranscript, existingDraft) {
  console.log('Getting assistant draft for transcript:')
}

onBeforeUnmount(() => {
  try {
    if (recorder.value && recorder.value.state !== 'inactive') recorder.value.stop()
    mediaStream.value?.getTracks().forEach(t => t.stop())
  } catch { }
})

</script>

<template>
  <div class="w-screen h-screen flex flex-col justify-between" >

    <!-- User Task -->
    <div class="sticky top-0 z-30 w-full h-[60vh] flex justify-center items-center pt-4 px-4">
      <div class="w-full h-full flex flex-col justify-between items-start bg-[url(assets/img/bg-card/yellow-circle.png)] bg-cover p-[11px] rounded-[21px] shadow">
        <h3>User Task</h3>
        <p>Name: {{ userTask.name || 'Not set' }}</p>
        <p>Description: {{ userTask.description || 'Not set' }}</p>
        <p>Category: {{ userTask.category || 'Not set' }}</p>
        <p>Due Date: {{ userTask.due_date || 'Not set' }}</p>
        <p>Due Time: {{ userTask.due_time || 'Not set' }}</p>
      </div>
    </div>
    <div class="w-full overflow-hidden overflow-y-scroll flex justify-center items center px-4">
      <div class="w-full flex flex-col justify-between items-start bg-yellow-300">
        <div v-if="user">
          UserID: {{ user.sub }}
        </div>
        <!-- Error message -->
        <div v-if="errorMsg">
          {{ errorMsg }}
        </div>

        <!-- User Info -->
        <div>
          <h3>User Info</h3>
          <p>User ID: {{ userId || 'Not loaded' }}</p>
        </div>

        <!-- Transcript -->
        <div v-if="userTranscript">
          <h3>Transcript</h3>
          <p>{{ userTranscript }}</p>
        </div>

        <!-- Categories -->
        <div v-if="categories">
          <h3>Categories</h3>
          <pre>{{ JSON.stringify(categories, null, 2) }}</pre>
        </div>



        <!-- Assistant Response -->
        <div v-if="assistantResponse && Object.keys(assistantResponse).length">
          <h3>Assistant Response</h3>
          <pre>{{ JSON.stringify(assistantResponse, null, 2) }}</pre>
        </div>

        <!-- Assistant Draft -->
        <div v-if="assistantDraft && Object.keys(assistantDraft).length">
          <h3>Assistant Draft</h3>
          <pre>{{ JSON.stringify(assistantDraft, null, 2) }}</pre>
        </div>
      </div>
    </div>
    <!-- Recording button -->
  </div>
  <div class=" w-16 h-16 fixed bottom-env(safe-area-inset-bottom,0px)] flex justify-center items-center px-4 pb-4">
    <div class="w-full bg-red-400 flex justify-center items-center ">
      <button 
        @click="isRecording ? stopRecording() : startRecording()"
        :class="[
          'flex items-center justify-center w-16 h-16 text-white font-medium rounded-full transition-colors shadow',
          isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'
        ]"
      >
        <template v-if="!isRecording">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </template>
        <template v-else>
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </template>
      </button>
    </div>
  </div>
</template>