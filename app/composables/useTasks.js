// composables/useTasks.js
const loading = ref(false)
const error = ref(null)
const tasks = ref([])
const hasTaskInFocus = ref(false)

export function useTasks() {

  const task = ref({})
  
  async function getTasks() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/tasks', { method: 'GET' })
    tasks.value = response

    loading.value = false
  }

  async function getFocusTask() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/tasks/focus', { method: 'GET' })
    task.value = response

    loading.value = false
  }

  async function getHasFocus() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/tasks/hasFocus', { method: 'GET' })
    hasTaskInFocus.value = response

    loading.value = false
  }

  async function getTask(taskId) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/tasks/${taskId}`, { method: 'GET' })
    task.value = response
    
    loading.value = false
  }

  async function getFilteredTasks(categoryId) {
    error.value = null
    loading.value = true

    const queryString = new URLSearchParams(categoryId).toString()
    const response = await $fetch(`/api/tasks?${queryString}`, { method: 'GET' })
    tasks.value = response

    loading.value = false
  }

  async function createTask(properties) {
    error.value = null
    loading.value = true
    const created = ref()
    try {
      const body = {
        name: properties.name,
        description: properties.description || null,
        due_date: properties.due_date || null,
        due_time: properties.due_time || null,
        category_id: properties.category_id || null,
        group_id: properties.group_id || 'e4418205-e9e9-4753-8d4e-e639e8827f2d', // default to "actions" group
        status: properties.status || 0,
      }

      created.value = await $fetch('/api/tasks', {
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
      return created
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
  
  return { loading, error, task, tasks, getTasks, getTask, createTask, deleteTask, updateTask, getFocusTask, hasTaskInFocus, getHasFocus }
}