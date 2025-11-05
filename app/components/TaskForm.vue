// ...existing code...
<script setup>
const { loading, error, tasks, getTasks, createTask } = useTasks()

const name = ref('')
const description = ref('')
const effort = ref('')
const dueDate = ref(null)
const dueTime = ref(null)

async function add() {
  error.value = null
  await createTask({
    name: name.value || '',
    description: description.value || '',
    effort: effort.value || '',
    due_date: dueDate.value || null,
    due_time: dueTime.value || null
  })
  // clear form
  name.value = ''
  description.value = ''
  effort.value = ''
  dueDate.value = null
  dueTime.value = null
}
</script>

<template>
  <form @submit.prevent="add" class="space-y-5">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
        Task Name <span class="text-red-500">*</span>
      </label>
      <input
        id="name"
        v-model="name"
        required
        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
        placeholder="e.g. Buy groceries"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <textarea
        id="description"
        v-model="description"
        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none resize-none"
        rows="4"
        placeholder="Optional description or additional details"
      />
    </div>

    <div>
      <label for="effort" class="block text-sm font-medium text-gray-700 mb-2">
        Effort
      </label>
      <input
        id="effort"
        v-model="effort"
        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
        placeholder="e.g. 2h, small, medium"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="dueDate" class="block text-sm font-medium text-gray-700 mb-2">
          Due Date
        </label>
        <input
          id="dueDate"
          v-model="dueDate"
          type="date"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
        />
      </div>

      <div>
        <label for="dueTime" class="block text-sm font-medium text-gray-700 mb-2">
          Due Time
        </label>
        <input
          id="dueTime"
          v-model="dueTime"
          type="time"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
        />
      </div>
    </div>

    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg v-if="loading" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span>{{ loading ? 'Adding Task...' : 'Add Task' }}</span>
    </button>
  </form>
</template>