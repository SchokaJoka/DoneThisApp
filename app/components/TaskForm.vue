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
  <div class="max-w-xl">
    <form @submit.prevent="add" class="">
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

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Description</span>
        <textarea
          v-model="description"
          class="mt-1 block w-full rounded-md border-gray-200 p-2"
          rows="3"
          placeholder="Optional description"
        />
      </label>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Effort</span>
        <input
          v-model="effort"
          class="mt-1 block w-full rounded-md border-gray-200 p-2"
          placeholder="e.g. 2h, small, medium"
        />
      </label>

      <div class="flex gap-4 mb-4">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">Due date</span>
          <input v-model="dueDate" type="date" class="mt-1 block rounded-md border-gray-200 p-2" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Due time</span>
          <input v-model="dueTime" type="time" class="mt-1 block rounded-md border-gray-200 p-2" />
        </label>
      </div>

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
  </div>
</template>