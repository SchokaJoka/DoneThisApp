<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { categories } = useCategories()
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

const userTask = ref({
  showDraft: true,
  name: '',
  description: '',
  categoryName: '',
  categoryUserName: '',
  groupName: '',
  group_id: '',
  category_id: '',
  due_date: '',
  due_time: '',
  status: 0
})

// Computed property to get the background image URL
const backgroundImageUrl = computed(() => {
  if (userTask.value?.group_id && userTask.value?.categoryName) {
    return `/img/bg-card/${userTask.value.group_id}/${userTask.value.categoryName}.webp`
  } else if (userTask.value?.categoryName) {
    return `/img/bg-card/7fe28093-27dd-489b-b089-56109b2b4d14/${userTask.value.categoryName}.webp`
  }
  return '/img/default.webp'
})


// Extract only color_name fields for the category dropdown
const categoryOptions = computed(() => {
  const options = {}
  if (userCategories.value) {
    Object.keys(userCategories.value).forEach(key => {
      if (key.endsWith('_name')) {
        const colorKey = key.replace('_name', '')
        options[colorKey] = userCategories.value[key]
      }
    })
  }
  return options
})

// Combined datetime for the input
const dateTimeLocal = computed({
  get() {
    if (!userTask.value.due_date) return ''
    const date = userTask.value.due_date
    const time = userTask.value.due_time || '00:00'
    return `${date}T${time}`
  },
  set(value) {
    if (!value) {
      userTask.value.due_date = ''
      userTask.value.due_time = ''
      return
    }
    const [date, time] = value.split('T')
    userTask.value.due_date = date
    userTask.value.due_time = time
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

// Watch for groupName changes and fetch the group_id
watch(() => userTask.value.groupName, async (newGroupName) => {
  if (!newGroupName) {
    userTask.value.group_id = ''
    return
  }
  try {
    const groupId = await $fetch(`/api/groups/${encodeURIComponent(newGroupName)}`)
    userTask.value.group_id = groupId || ''
  } catch (e) {
    console.error('Failed to fetch group_id for groupName:', newGroupName, e)
    userTask.value.group_id = ''
  }

  console.log('Updated group_id to:', userTask.value)
})

// Watch for categoryUserName changes and update categoryName
watch(() => userTask.value.categoryUserName, (newCategoryUserName) => {
  if (!newCategoryUserName) {
    userTask.value.categoryName = ''
    return
  }
  
  // Find the color key that matches the category name in categoryOptions
  const colorKey = Object.entries(categoryOptions.value).find(
    ([key, name]) => name.toLowerCase() === newCategoryUserName.toLowerCase()
  )?.[0]
  
  if (!colorKey) {
    userTask.value.categoryName = ''
    console.log('No matching color key found for:', newCategoryUserName)
    return
  }
  
  userTask.value.categoryName = colorKey
  console.log('Updated categoryName to:', colorKey)
})

// Watch for categoryName changes and update category_id
watch(() => userTask.value.categoryName, (newCategoryName) => {
  if (!newCategoryName) {
    userTask.value.category_id = ''
    return
  }
  
  // Find the category ID from categories using the color key
  const category = categories.value.find(cat => cat.name === newCategoryName)
  userTask.value.category_id = category?.id || ''
  
  console.log('Updated category_id to:', userTask.value.category_id)
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

  const draftTask = ref({
    name: userTask.value.name,
    description: userTask.value.description,
    category: userTask.value.categoryName,
    due_date: userTask.value.due_date,
    due_time: userTask.value.due_time,
    type: userTask.value.groupName
  })

  assistantResponse.value = await getAssistantDraft(userTranscript.value, draftTask.value, userCategories.value, groups.value)

  assistantDraft.value = assistantResponse.value.draftResponse.task
  assistantMessage.value.push(assistantResponse.value.draftResponse.aiMessage)


  userTask.value.categoryUserName = assistantDraft.value.category || ''
  userTask.value.description = assistantDraft.value.description || ''
  userTask.value.due_date = assistantDraft.value.due_date || ''
  userTask.value.due_time = assistantDraft.value.due_time || ''
  userTask.value.name = assistantDraft.value.name || ''
  userTask.value.groupName = assistantDraft.value.type || ''
  userTask.value.showDraft = true

  return
}

function supportedType() {
  // Check supported formats in order of preference
  // Safari/iOS supports mp4/m4a, Chrome/Firefox support webm
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ]
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
      console.log('Selected audio format:', type || 'browser default')
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
      errorMsg.value = e?.message || 'Microphone permission denied  -or unsupported browser.'
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
    // Determine file extension based on MIME type
    const mimeType = audioBlob.value.type
    let fileExt = 'webm'
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      fileExt = 'm4a'
    } else if (mimeType.includes('ogg')) {
      fileExt = 'ogg'
    } else if (mimeType.includes('webm')) {
      fileExt = 'webm'
    }
    
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
  // Extract only the color_name fields from userCategories
  const colorNames = {}
  if (userCategories) {
    Object.keys(userCategories).forEach(key => {
      if (key.endsWith('_name')) {
        // Convert key like 'yellow_name' to 'yellow'
        const colorKey = key.replace('_name', '')
        colorNames[colorKey] = userCategories[key]
      }
    })
  }

  // Extract only title and description from groups
  const groupsSimple = groups?.map(g => ({
    title: g.title,
    description: g.description
  })) || []

  const data = await $fetch('/api/ai/draft', {
    method: 'POST',
    body: {
      transcript: userTranscript,
      existingDraft: JSON.stringify(existingDraft),
      categories: JSON.stringify(colorNames), 
      types: JSON.stringify(groupsSimple),
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

function addTask(task) {
  const { createTask } = useTasks()
  createTask(userTask.value)
  navigateTo('/mytasks')
}
</script>

<template>
  <div class="w-full h-full flex flex-col">
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
      <div v-if="userTask.showDraft" class="sticky top-0 z-30 w-full max-h-[50vh]  flex justify-center items-start px-4 pt-4">
        <div class="w-[360px] flex flex-col justify-start items-start bg-bg-surface p-4 rounded-[21px] gap-4 overflow-hidden" :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : `url()`, backgroundSize: 'cover', backgroundPosition: 'center' }">
          <div class="w-full flex flex-row flex-wrap justify-between items-center gap-2">
            <div class="">
              <select v-model="userTask.categoryUserName" class="h-10 px-4 rounded-lg bg-bg-fill text-text-primary">
                <option value="" disabled selected>Kategorie</option>
                <option v-for="(name, key) in categoryOptions" :key="key" :value="name">
                  {{ name }}
                </option>
              </select>
            </div>
            
            <div class="flex-shrink-0">
              <input 
                type="datetime-local"
                v-model="dateTimeLocal"
                class="h-10 px-2 rounded-lg bg-bg-fill text-sm max-w-[180px]"
              />
            </div>
          </div>
        
          <div class="w-full">
            <input 
              type="text" 
              v-model="userTask.name" 
              placeholder="Name" 
              class="w-full px-4 py-2 rounded-lg text-2xl font-bold bg-bg-fill border-none outline-none placeholder-text-primary"
              style="font-family: var(--font-primary);"
            /> 
          </div>
          <div class="w-full">
            <textarea 
              v-model="userTask.description" 
              placeholder="Description" 
              rows="4"
              class="w-full px-4 py-3 text-base bg-bg-fill rounded-lg border-none placeholder-text-primary"
              style="font-family: var(--font-secondary);"
            />
          </div>
        </div>
      </div>
    </Transition>


    <div v-if="!userTask.showDraft" class="flex flex-col items-center gap-6">
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
        v-if="!userTask.showDraft"
        @click="userTask.showDraft = true"
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
      <button 
        v-if="userTask.showDraft"
        @click="addTask(userTask)"
        class="h-16 px-6 flex items-center justify-center bg-btn-primary hover:bg-btn-primary-hover text-text-secondary rounded-lg transition-all font-medium shadow-md"
      >
        Add
      </button>
    
    
  </TransitionGroup>
  </div>
  </div>
</template>