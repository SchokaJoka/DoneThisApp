<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="close"></div>

    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
      <h3 class="text-lg font-semibold mb-4">Edit Task</h3>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input v-model="name" class="mt-1 block w-full rounded-md border-gray-200 p-2" />
      </label>

      <label class="block mb-4">
        <span class="text-sm font-medium text-slate-700">Priority</span>
        <select v-model.number="priority" class="mt-1 block w-24 rounded-md border-gray-200 p-2">
          <option v-for="p in [1,2,3,4,5]" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>

      <div class="flex justify-end gap-3">
        <button @click="close" class="px-3 py-1 rounded border">Cancel</button>
        <button :disabled="loading" @click="save()" class="px-4 py-1 bg-sky-600 text-white rounded disabled:opacity-50">
          <span v-if="loading">Saving…</span>
          <span v-else>Save</span>
        </button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
const props = defineProps({
  taskId: { type: [String, Number], required: true }
})
const emit = defineEmits(['close','saved'])

const name = ref('')
const priority = ref(1)
const loading = ref(false)
const error = ref(null)

const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function loadTask() {
  error.value = null
  loading.value = true
  const { data, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', props.taskId)
    .single()
  loading.value = false

  if (fetchError) {
    error.value = fetchError.message
  } else if (data) {
    name.value = data.name ?? ''
    priority.value = data.priority ?? 1
  }
}

onMounted(loadTask)
watch(() => props.taskId, () => loadTask())

function close() {
  emit('close')
}

async function save() {
    if (!user?.value) {
        error.value = 'Not authenticated'
        console.error("User not authenticated")
        return
    }

    loading.value = true
    error.value = null

    const updates = { name: name.value, priority: Number(priority.value) }
    updates.updated_at = new Date().toISOString()
    
    const { data, e } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', props.taskId)

    loading.value = false

    if (e) {
        error.value = e.message
    } else {
        console.log("Task updated:", data)
        emit('close')
    }
}
</script>