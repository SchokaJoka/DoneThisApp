<template>
  <div class="p-4 h-[10vh]">
    <div class="flex items-center justify-between mb-4">
      <div class="flex flex-col">
        <h1 class="text-2xl font-bold">My Tasks</h1>
        <p class="text-sm">Single test task</p>
      </div>
      <div class="pr-4">
        <NuxtLink
          to="/taskcreator"
          aria-label="Create task"
          class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>

  <div class="h-[90vh] p-4">
    <div ref="scrollContainer" class="h-[150vh] p-4 w-full scroll-smooth snap-y snap-mandatory">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="snap-start snap-always h-[75vh] w-full top-16 flex flex-col items-center"
      >
        <TaskCard
          :task="task"
          :enable-rotation="false"
          @delete="() => verifyDelete(task.id)"
          @subtask-toggle="handleSubtaskToggle"
          @save="handleSave"
        />
      </div>
      <div class="snap-start snap-always h-[75vh] w-full sticky top-16 flex flex-col items-center"/>
    </div>
  </div>
  <TaskEditOverlay v-if="editingTaskId" :task-id="editingTaskId" @close="closeEditor" />

</template>
    
<script setup>
const editingTaskId = ref(null)
const scrollContainer = ref(null)

const { loading, error, tasks, getTasks, deleteTask, updateTask } = useTasks()

onMounted(async () => {
  await getTasks()
  // Ensure scroll starts at top instantly
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'instant' })
  }
})

function verifyDelete(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId).then(() => {
            getTasks()
        })
    }
}

async function handleSubtaskToggle({ taskId, subtaskIndex }) {
    // Find the task
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || !task.subtasks) return
    
    // Parse the subtasks
    const parsedSubtasks = task.subtasks.map(item => {
        try {
            if (typeof item === 'string') {
                return JSON.parse(item)
            }
            return item
        } catch {
            return { text: item, done: false }
        }
    })
    
    // Toggle the subtask
    if (parsedSubtasks[subtaskIndex]) {
        parsedSubtasks[subtaskIndex].done = !parsedSubtasks[subtaskIndex].done
    }
    
    // Convert back to JSON strings
    const subtasksForDb = parsedSubtasks.map(st => JSON.stringify(st))
    
    // Update the task
    await updateTask(taskId, { subtasks: subtasksForDb })
    
    // Refresh tasks
    await getTasks()
}

async function handleSave({ taskId, updates }) {
    await updateTask(taskId, updates)
    await getTasks()
}
</script>
