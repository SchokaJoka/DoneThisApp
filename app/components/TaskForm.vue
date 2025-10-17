<template>
  <form @submit.prevent="createTask" class="max-w-md mx-auto bg-white/70 backdrop-blur-md p-6 rounded-lg shadow">
    <h2 class="text-lg font-semibold mb-4">Add a task</h2>

    <label class="block mb-3">
      <span class="text-sm font-medium text-slate-700">Name</span>
      <input
        v-model="name"
        required
        class="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-300 focus:border-sky-400 p-2"
        placeholder="e.g. Buy groceries"
      />
    </label>

    <label class="block mb-4">
      <span class="text-sm font-medium text-slate-700">Priority</span>
      <select
        v-model.number="priority"
        required
        class="mt-1 block w-24 rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-300 focus:border-sky-400 p-2"
      >
        <option v-for="p in [1,2,3,4,5]" :key="p" :value="p">{{ p }}</option>
      </select>
    </label>

    <button
      type="submit"
      :disabled="loading"
      class="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span>{{ loading ? 'Adding...' : 'Add Task' }}</span>
    </button>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const supabase = useSupabaseClient()

const name = ref('')
const priority = ref(1)
const tasks = ref([])
const error = ref(null)
const loading = ref(false)



async function createTask() {
  error.value = null
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) {
    error.value = 'User not authenticated'
    return
  }

  loading.value = true
  const { data, error: insertError } = await supabase
    .from('tasks')
    .insert([
      { name: name.value, priority: priority.value, user_id: user.user.id }
    ])
    .select()
  loading.value = false

  if (insertError) {
    error.value = insertError.message
  } else {
    // clear form and refresh tasks (or optimistically add the returned row)
    name.value = ''
    priority.value = 1
    if (data?.length) tasks.value.unshift(data[0])
  }
}
</script>