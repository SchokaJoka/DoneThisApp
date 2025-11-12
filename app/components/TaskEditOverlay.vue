<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Edit Task</h3>
        <button
          @click="close"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-5">
        <div>
          <label for="edit-name" class="block text-sm font-medium text-gray-700 mb-2">
            Task Name <span class="text-red-500">*</span>
          </label>
          <input
            id="edit-name"
            v-model="name"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
          />
        </div>

        <div>
          <label for="edit-description" class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="edit-description"
            v-model="description"
            rows="4"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-due-date" class="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              id="edit-due-date"
              type="date"
              v-model="due_date"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
            />
          </div>

          <div>
            <label for="edit-due-time" class="block text-sm font-medium text-gray-700 mb-2">
              Due Time
            </label>
            <input
              id="edit-due-time"
              type="time"
              v-model="due_time"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Subtasks
          </label>
          <div class="space-y-2 mb-2">
            <div 
              v-for="(subtask, index) in subtasks" 
              :key="index"
              class="flex items-center gap-2"
            >
              <input 
                type="checkbox" 
                v-model="subtask.done"
                class="cursor-pointer"
              />
              <input
                v-model="subtask.text"
                class="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none text-sm"
                placeholder="Subtask text..."
              />
              <button
                @click="removeSubtask(index)"
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                type="button"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <button
            @click="addSubtask"
            type="button"
            class="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            + Add Subtask
          </button>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            :disabled="loading"
            @click="save"
            class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  taskId: { required: true }
})
const emit = defineEmits(['close','saved'])

const name = ref('')
const description = ref('')
const due_date = ref('')
const due_time = ref('')
const subtasks = ref([])

const { loading, error, task, getTask, updateTask } = useTasks()

onMounted(async () => {
  try {
    await getTask(props.taskId)
    if (task.value) {
      name.value = task.value.name ?? ''
      description.value = task.value.description ?? ''
      // normalize date/time to empty string if null so inputs work correctly
      due_date.value = task.value.due_date ?? ''
      due_time.value = task.value.due_time ?? ''
      
      // Parse subtasks
      if (task.value.subtasks && Array.isArray(task.value.subtasks)) {
        subtasks.value = task.value.subtasks.map(item => {
          try {
            if (typeof item === 'string') {
              return JSON.parse(item)
            }
            return item
          } catch {
            return { text: item, done: false }
          }
        })
      }
    }
  } catch (e) {
    console.error('Failed to load task for edit', e)
  }
})

function addSubtask() {
  subtasks.value.push({ text: '', done: false })
}

function removeSubtask(index) {
  subtasks.value.splice(index, 1)
}

async function save() {
  try {
    // Convert subtasks to JSON strings for database storage
    const subtasksForDb = subtasks.value
      .filter(st => st.text.trim() !== '') // Only save non-empty subtasks
      .map(st => JSON.stringify(st))
    
    const payload = {
      name: name.value ?? '',
      description: description.value ?? '',
      due_date: due_date.value === '' ? null : due_date.value,
      due_time: due_time.value === '' ? null : due_time.value,
      subtasks: subtasksForDb.length > 0 ? subtasksForDb : null
    }

    const updated = await updateTask(props.taskId, payload)
    emit('saved', updated)
    close()
  } catch (e) {
    console.error('Failed to save task', e)
  }
}

function close() {
  emit('close')
}
</script>