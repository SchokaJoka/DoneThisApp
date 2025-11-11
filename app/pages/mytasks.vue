<template>
  <div class="bg-violet-600 w-screen h-screen flex flex-col items-center grow shrink-0 basis-0 self-stretch">
    <div class="flex max-w-[500px] flex-col items-center gap-1 bg-orange-600">
      <h1 class="text-3xl font-bold text-gray-900">My Tasks</h1>
      <p class="text-gray-600">Manage and organize your tasks</p>
    </div>

    <div class="w-screen">
      <div class="bg-green-500">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @edit="openEditor"
          @delete="verifyDelete"
        />
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
