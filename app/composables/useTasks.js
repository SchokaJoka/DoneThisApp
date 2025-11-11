// composables/useTasks.js
export function useTasks() {

  const loading = ref(false)
  const error = ref(null)
  const tasks = ref([])
  const task = ref({})
  
  async function getTasks() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/tasks', { method: 'GET' })
    tasks.value = response

    loading.value = false
  }

  async function getTask(taskId) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/tasks/${taskId}`, { method: 'GET' })
    task.value = response
    
    loading.value = false
  }

  async function createTask(properties) {
    error.value = null
    loading.value = true
    try {
      const body = {
        name: properties.name,
        description: properties.description || null,
        effort: properties.effort || null,
        due_date: properties.due_date || null,
        due_time: properties.due_time || null,
        subtasks: properties.subtasks || null
      }

      const created = await $fetch('/api/tasks', {
        method: 'POST',
        body
      })

      if (created && created.id) {
        tasks.value.unshift(created)
      }
      return created
    } catch (err) {
      error.value = err?.message || String(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(taskId) {
    error.value = null
    loading.value = true
    
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
    
    loading.value = false
  }

  async function updateTask(taskId, updates) {
    error.value = null
    loading.value = true
    
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: { updates }
    })    

    loading.value = false
  }
  
  return { loading, error, task, tasks, getTasks, getTask, createTask, deleteTask, updateTask}
}