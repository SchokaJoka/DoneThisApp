<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="close"></div>

    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
      <h3 class="text-lg font-semibold mb-4">Edit Task</h3>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input v-model="name" class="mt-1 block w-full rounded-md border-gray-200 p-2" />
      </label>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Description</span>
        <textarea v-model="description" rows="3" class="mt-1 block w-full rounded-md border-gray-200 p-2"></textarea>
      </label>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-700">Effort</span>
        <input v-model="effort" class="mt-1 block w-full rounded-md border-gray-200 p-2" />
      </label>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">Due date</span>
          <input type="date" v-model="due_date" class="mt-1 block w-full rounded-md border-gray-200 p-2" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Due time</span>
          <input type="time" v-model="due_time" class="mt-1 block w-full rounded-md border-gray-200 p-2" />
        </label>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="close" class="px-3 py-1 rounded border">Cancel</button>
        <button :disabled="loading" @click="save" class="px-4 py-1 bg-sky-600 text-white rounded disabled:opacity-50">
          <span v-if="loading">loading...</span>
          <span v-else>Save</span>
        </button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
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
const effort = ref('')
const due_date = ref('')
const due_time = ref('')

const { loading, error, task, getTask, updateTask } = useTasks()

onMounted(async () => {
  try {
    await getTask(props.taskId)
    if (task.value) {
      name.value = task.value.name ?? ''
      description.value = task.value.description ?? ''
      effort.value = task.value.effort ?? ''
      // normalize date/time to empty string if null so inputs work correctly
      due_date.value = task.value.due_date ?? ''
      due_time.value = task.value.due_time ?? ''
    }
  } catch (e) {
    console.error('Failed to load task for edit', e)
  }
})

async function save() {
  try {
    const payload = {
      name: name.value ?? '',
      description: description.value ?? '',
      effort: effort.value ?? '',
      due_date: due_date.value === '' ? null : due_date.value,
      due_time: due_time.value === '' ? null : due_time.value
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