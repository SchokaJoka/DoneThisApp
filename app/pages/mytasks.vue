<template>
    <div class="min-h-screen p-4">
      <div class="max-w-md mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p class="text-gray-600 mt-1">Manage and organize your tasks</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-600">{{ error }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!tasks || tasks.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p class="text-gray-600 mb-4">Get started by creating your first task</p>
          <NuxtLink
            to="/taskcreator"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Task
          </NuxtLink>
        </div>

        <!-- Tasks Grid -->
        <div v-else class="grid grid-cols-1 gap-3">
          <TaskCard
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            @edit="openEditor"
            @delete="verifyDelete"
          />
        </div>

        <TaskEditOverlay
          v-if="editingTaskId"
          :task-id="editingTaskId"
          @close="closeEditor"
        />
      </div>
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
