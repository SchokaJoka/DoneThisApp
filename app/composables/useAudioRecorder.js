export function useAudioRecorder() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Recording state
  const isRecording = ref(false)
  const recorder = shallowRef(null)
  const mediaStream = shallowRef(null)
  const chunks = []
  const audioBlob = shallowRef(null)
  const errorMsg = ref('')

  // User ID
  const userId = computed(() => user.value?.sub)

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
    
    // Wait a moment for the blob to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
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

  async function getFileUrl(filePath) {
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

  function cleanup() {
    try {
      if (recorder.value && recorder.value.state !== 'inactive') recorder.value.stop()
      mediaStream.value?.getTracks().forEach(t => t.stop())
    } catch { }
  }

  return {
    // State
    isRecording,
    audioBlob,
    errorMsg,
    
    // Methods
    startRecording,
    stopRecording,
    uploadAudio,
    getFileUrl,
    transcribeAudio,
    getAssistantDraft,
    cleanup
  }
}
