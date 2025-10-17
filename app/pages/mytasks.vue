<template>
    <div>
      <div class="flex flex-row flex-wrap gap-4">
          <div v-for="task in tasks" :key="task.id" class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <TaskCard :task="task" @edit="openEditor" />
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
const tasks = ref([])
const error = ref(null)
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const editingTaskId = ref(null)

onMounted(fetchTasks)

async function fetchTasks() {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return

    const { data, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.user.id)
    .order('id', { ascending: false })

    if (fetchError) {
        error.value = fetchError.message
    } else {
        tasks.value = data || []
    }
}   

function openEditor(taskId) {
  editingTaskId.value = taskId
}

function closeEditor() {
    fetchTasks()
    editingTaskId.value = null
}

</script>