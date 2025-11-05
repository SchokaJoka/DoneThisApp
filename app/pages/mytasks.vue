<template>
    <div>
      <div class="flex flex-row flex-wrap gap-4">
          <div v-for="task in tasks" :key="task.id" class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <TaskCard :task="task" @edit="openEditor" @delete="verifyDelete"/>
          </div>
      </div>

      <TaskEditOverlay
        v-if="editingTaskId"
        :task-id="editingTaskId"
        @close="closeEditor"
      />
    </div>
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
