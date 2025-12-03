<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { userCategories, getUserCategories } = useUserCategories()
const { groups } = useGroups()

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
const userTranscript = ref([])
const assistantResponse = ref({})

const assistantDraft = ref({})
const assistantMessage = ref(['Hallo! Erzähle mir von deiner Aufgabe. Ich helfe dir, sie zu erstellen.'])
const displayedText = ref('')
const isTyping = ref(false)

const userTask = {
  showDraft: ref(false),
  name: ref(''),
  description: ref(''),
  category_id: ref(''),
  group_id: ref(''),
  due_date: ref(''),
  due_time: ref(''),
  status: ref(0)
}

const categoryDropdownOpen = ref(false)

// Combined datetime for the input
const dateTimeLocal = computed({
  get() {
    if (!userTask.due_date.value) return ''
    const date = userTask.due_date.value
    const time = userTask.due_time.value || '00:00'
    return `${date}T${time}`
  },
  set(value) {
    if (!value) {
      userTask.due_date.value = ''
      userTask.due_time.value = ''
      return
    }
    const [date, time] = value.split('T')
    userTask.due_date.value = date
    userTask.due_time.value = time
  }
})



// Typing animation function
function typeText(text, speed = 25) {
  return new Promise((resolve) => {
    isTyping.value = true
    displayedText.value = ''
    let index = 0
    
    const interval = setInterval(() => {
      if (index < text.length) {
        displayedText.value += text[index]
        index++
      } else {
        clearInterval(interval)
        isTyping.value = false
        resolve()
      }
    }, speed)
  })
}

// Watch for new messages and trigger typing animation
watch(() => assistantMessage.value.length, async (newLength, oldLength) => {
  if (newLength > oldLength && newLength > 0) {
    const latestMessage = assistantMessage.value[assistantMessage.value.length - 1]
    await typeText(latestMessage)
  }
})

onMounted(async () => {
  if (assistantMessage.value.length > 0) {
    await typeText(assistantMessage.value[0])
  }
})

async function handleUserAudio() {
  const filePath = await uploadAudio()
  if (filePath) {
    const signedUrl = await getFileUrl(filePath)

    const transcription = await transcribeAudio(signedUrl)
    userTranscript.value.push(transcription)
    
    if (!transcription) {
      errorMsg.value = 'Failed to transcribe audio.'
      return
    }

  } else {
    console.log('No file path returned from uploadAudio()')
    return
  }

  assistantResponse.value = await getAssistantDraft(userTranscript.value, userTask.value, userCategories.value, groups.value)
  console.log('Assistant response: ', assistantResponse.value)

  assistantDraft.value = assistantResponse.value.draftResponse.task
  assistantMessage.value.push(assistantResponse.value.draftResponse.aiMessage)


  userTask.name.value = assistantDraft.value.name || ''
  userTask.description.value = assistantDraft.value.description || ''
  userTask.group_id.value = assistantDraft.value.category || ''  // AI chooses the group
  userTask.due_date.value = assistantDraft.value.due_date || ''
  userTask.due_time.value = assistantDraft.value.due_time || ''
  userTask.showDraft.value = true

  return
}

function supportedType() {
  // Prefer webm/opus; fallback to audio/webm
  const candidates = ['audio/webm;codecs=opus', 'audio/webm']
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

function startRecording() {
  errorMsg.value = ''
  
  // Request mic access synchronously to maintain user gesture chain on iOS
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
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
    })
    .catch(e => {
      errorMsg.value = e?.message || 'Microphone permission denied or unsupported browser.'
      console.error('getUserMedia error:', e)
    })
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

async function getAssistantDraft(userTranscript, existingDraft, userCategories, groups) {
  const data = await $fetch('/api/ai/draft', {
    method: 'POST',
    body: {
      transcript: userTranscript,
      existingDraft: JSON.stringify(existingDraft),
      userCategories: JSON.stringify(userCategories), 
      groups: JSON.stringify(groups),
    },
  })

  console.log('fetch /api/ai/draft data: ', data)
  return data || ''
}

onBeforeUnmount(() => {
  try {
    if (recorder.value && recorder.value.state !== 'inactive') recorder.value.stop()
    mediaStream.value?.getTracks().forEach(t => t.stop())
  } catch { }
})

</script>

<template>
  <div class="w-full h-[90dvh] flex flex-col justify-between items-center" >
    <!-- User Task -->
    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div v-if="userTask.showDraft.value" class="sticky top-0 z-30 w-full h-full  flex justify-center items-start px-4 pt-4">
        <div class="w-full max-w-[500px] flex flex-col justify-start items-start bg-bg-surface p-[11px] rounded-[21px] gap-4">
          <div class="w-full flex flex-row justify-between items-center">
          <div>
            <select v-model="userTask.category_id.value" class="h-[40px] px-3 rounded-lg bg-white border border-gray-300">
              <option value="" disabled selected>Kategorie</option>
              <option v-for="(name, key) in userCategories" :key="key" :value="key">
                {{ name }}
              </option>
            </select>
          </div>
          
          <div>
            <input 
              type="datetime-local"
              v-model="dateTimeLocal"
              class="h-[40px] px-3 rounded-lg bg-white border border-gray-300"
            />
          </div>

          </div>
        
          <div class="w-full">
            <input 
              type="text" 
              v-model="userTask.name.value" 
              placeholder="Name" 
              class="w-full px-4 py-3 text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
              style="font-family: 'Baloo Chettan 2', sans-serif;"
            /> 
          </div>
          <div class="w-full">
            <textarea 
              v-model="userTask.description.value" 
              placeholder="Description" 
              rows="4"
              class="w-full px-4 py-3 text-base bg-transparent border-none outline-none resize-none placeholder-gray-400"
              style="font-family: 'Roboto', sans-serif;"
            />
          </div>
        </div>
      </div>
    </Transition>


    <div v-if="!userTask.showDraft.value" class="flex flex-col items-center gap-6">
        <div class="max-w-[500px] max-h-[50vh]">
          <Lottie 
            name="playing-cards"
            :autoplay="true"
            :loop="false"
            :speed="1.5"
            :pause-animation="false"
            :play-on-hover="false"
            width="100%"
            height="100%"
            direction="1"
          />
        </div>
    </div>

    <!-- AI Assistant Message -->
    <div class="w-full h-full overflow-hidden overflow-y-auto flex justify-center items-start px-4 pb-4">
      <div class="w-full max-w-[500px] flex flex-col items-center gap-4">
        <!-- Error message -->
        <div v-if="errorMsg" class="w-full bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {{ errorMsg }}
        </div>

        <!-- Message -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
        >            
          <div v-if="assistantMessage.length > 0" class="w-full flex flex-col rounded-2xl px-4 py-4 items-center text-left gap-4">
            
            <div class="w-15 h-15">
              <Lottie name="Eyes" :pause-animation="!isRecording && !isTyping" height="100%" :speed="1"/>
            </div>
            
            <div class="w-full">
              <p class="text-gray-800 text-lg" style="font-family: 'Roboto', sans-serif;">
                {{ displayedText }}
                <span v-if="isTyping" class="inline-block w-0.5 h-4 bg-gray-800 ml-0.5 animate-pulse"></span>
              </p>   
            </div>
          
          </div>
        </Transition>

      </div>
    </div>
    <!-- Recording button -->
  </div>
  <div class="w-full h-[10dvh] sticky bottom-16 flex justify-center items-center p-4">
    <TransitionGroup 
      tag="div" 
      class="flex justify-center items-center gap-4 mb-8"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-75"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-300 ease-in absolute"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-75"
      move-class="transition-transform duration-200 ease-in-out"
    >
      <button 
        v-if="!userTask.showDraft.value"
        key="manual-btn"
        @click="userTask.showDraft.value = true"
        class="h-16 px-6 flex items-center justify-center bg-btn-primary hover:bg-btn-primary-hover text-text-secondary rounded-lg transition-all font-medium shadow-md"
      >
        Manual Creation
      </button>
      
      <button 
        key="mic-btn"
        @click="isRecording ? stopRecording() : startRecording()"
        :class="[
          'flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg',
          isRecording ? 'bg-accent hover:bg-accent-hover animate-pulse text-white' : 'bg-btn-primary hover:bg-btn-primary-hover text-text-secondary'
        ]"
      >
        <template v-if="!isRecording">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </template>
        <template v-else>
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </template>
      </button>
    </TransitionGroup>
  </div>
</template>