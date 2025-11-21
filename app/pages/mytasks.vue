<template>
  <div class="pt-8 px-8 h-[10dvh] flex items-center justify-center">
    <div class="w-full max-w-[400px] flex items-center justify-between mb-4">
      <div class="w-full flex flex-col">
        <h1 class="text-2xl font-bold text-center">My Tasks</h1>

      </div>
      <div class="pr-4">
      </div>
    </div>
  </div>

  <div class="p-8 h-[90dvh] overflow-x-hidden overflow-y-scroll">
    <div class="w-full flex flex-col gap-8">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="w-full min-h-[70dvh] flex justify-center items-center"
      >
        <TaskCard
          :task="task"
          :enable-rotation="false"
          @delete="() => verifyDelete(task.id)"
          @subtask-toggle="handleSubtaskToggle"
          @save="handleSave"
        />
      </div>

    </div>
    <div class="snap-start snap-always h-[75vh] w-full sticky top-16 flex flex-col items-center"/>
  </div>
  <TaskEditOverlay v-if="editingTaskId" :task-id="editingTaskId" @close="closeEditor" />

</template>
    
<script setup>
const editingTaskId = ref(null)
const scrollContainer = ref(null)

const { loadingTask, errorTask, tasks, getTasks, deleteTask, updateTask } = useTasks()
const { loadingCat, errorCat, categories, categoryName, categoryImgSrc, getCategoryName, getCategoryImgSrc, getCategoryNames } = useCategories()

onMounted(async () => {
  await getTasks()
  await getCategoryNames()

  console.log("CategoryNames: ", categories.value)
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
