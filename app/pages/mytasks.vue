<template>
  <div>
    <div class="sticky top-0 z-50 w-full flex flex-col items-center gap-1 bg-orange-600">
      <h1 class="text-3xl font-bold text-gray-900">My Tasks</h1>
      <p class="text-gray-600">Manage and organize your tasks</p>
    </div>

    <div class="bg-green-500 w-full flex justify-center">
      <div class="bg-red-500 w-full max-w-2xl px-4 py-6 flex flex-col items-center gap-4">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="w-full sticky top-16 flex justify-center"
        >
          <TaskCard
            :task="task"
            @edit="openEditor"
            @delete="verifyDelete"
          />
        </div>
      </div>
    </div>
  </div>
  <TaskEditOverlay v-if="editingTaskId" :task-id="editingTaskId" @close="closeEditor" />

</template>
    
<script setup>
const editingTaskId = ref(null)

const { loading, error, tasks, getTasks, deleteTask } = useTasks()

onMounted(getTasks)

function openEditor(taskId) {
  editingTaskId.value = taskId
}

function closeEditor() {
    getTasks()
    editingTaskId.value = null
}

function verifyDelete(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId).then(() => {
            getTasks()
        })
    }
}
</script>

<script>
// async function fetchTasks() {
//     const { data: user } = await supabase.auth.getUser()
//     if (!user?.user) return

//     const { data, error: fetchError } = await supabase
//     .from('tasks')
//     .select('*')
//     .eq('user_id', user.user.id)
//     .order('id', { ascending: false })

//     if (fetchError) {
//         error.value = fetchError.message
//     } else {
//         tasks.value = data || []
//     }
// } 
</script>
