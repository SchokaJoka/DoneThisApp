// composables/useSubTasks.js
const loadingSubTasks = ref(false)
const errorSubTasks = ref(null)

export function useSubTasks() {
    const subTasks = ref([])
    
    async function getSubTasks(taskId) {
    errorSubTasks.value = null
    loadingSubTasks.value = true

    try {
      const response = await $fetch(`/api/subTasks/${taskId}`, { method: 'GET' })
      subTasks.value = response
      return response
    } catch (err) {
      errorSubTasks.value = err?.message || String(err)
      return []
    } finally {
      loadingSubTasks.value = false
      console.log('Fetched subtasks:', subTasks.value)
    }
  }

  async function createSubTask(taskId, properties) {
    errorSubTasks.value = null
    loadingSubTasks.value = true

    try {
      const body = {
        name: properties.name || null,
        order: properties.order ?? subTasks.value.length,
        status: properties.status ?? 0,
      }

      const created = await $fetch(`/api/subTasks/${taskId}`, {
        method: 'POST',
        body: [body] // Send as array, get first item back
      })

      if (created && created.length > 0) {
        subTasks.value.push(created[0])
        return created[0]
      }
      return null
    } catch (err) {
      errorSubTasks.value = err?.message || String(err)
      return null
    } finally {
      loadingSubTasks.value = false
    }
  }

  // Batch create multiple subtasks for a task
  async function createSubTasks(taskId, subtasksArray) {
    if (!subtasksArray || subtasksArray.length === 0) return []
    
    errorSubTasks.value = null
    loadingSubTasks.value = true

    try {
      const body = subtasksArray.map((st, index) => ({
        name: st.name || null,
        order: st.order ?? index,
        status: st.status ?? 0,
      }))

      const created = await $fetch(`/api/subTasks/${taskId}`, {
        method: 'POST',
        body
      })

      if (created && created.length > 0) {
        subTasks.value.push(...created)
      }
      return created || []
    } catch (err) {
      errorSubTasks.value = err?.message || String(err)
      return []
    } finally {
      loadingSubTasks.value = false
    }
  }

  async function updateSubTask(subTaskId, updates) {
    errorSubTasks.value = null
    loadingSubTasks.value = true

    try {
      const response = await $fetch(`/api/subTasks/${subTaskId}`, {
        method: 'PATCH',
        body: { updates }
      })

      // update local state
      const index = subTasks.value.findIndex(st => st.id === subTaskId)
      if (index !== -1 && response) {
        subTasks.value[index] = response
      }

      // if order was updated, re-sort the array
      if (updates.order !== undefined) {
        subTasks.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      }

      return response
    } catch (err) {
      errorSubTasks.value = err?.message || String(err)
      return null
    } finally {
      loadingSubTasks.value = false
    }
  }

  async function deleteSubTask(subTaskId) {
    errorSubTasks.value = null
    loadingSubTasks.value = true

    try {
      await $fetch(`/api/subTasks/${subTaskId}`, {
        method: 'DELETE'
      })

      // remove from local state
      subTasks.value = subTasks.value.filter(st => st.id !== subTaskId)

      // re-index order locally
      subTasks.value.forEach((st, idx) => {
        st.order = idx
      })

      return true
    } catch (err) {
      errorSubTasks.value = err?.message || String(err)
      return false
    } finally {
      loadingSubTasks.value = false
    }
  }

  async function reorderSubTask(subTaskId, newOrder) {
    return await updateSubTask(subTaskId, { order: newOrder })
  }

  async function toggleSubTaskStatus(subTaskId, currentStatus) {
    const newStatus = currentStatus === 0 ? 1 : 0
    return await updateSubTask(subTaskId, { status: newStatus })
  }

  function clearSubTasks() {
    subTasks.value = []
  }

  return {
    loadingSubTasks,
    errorSubTasks,
    subTasks,
    getSubTasks,
    createSubTask,
    createSubTasks,
    updateSubTask,
    deleteSubTask,
    reorderSubTask,
    toggleSubTaskStatus,
    clearSubTasks
  }
}
