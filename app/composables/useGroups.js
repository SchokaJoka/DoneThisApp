const loading = ref(false)
const error = ref(null)
const groups = ref([])

export function useGroups() {

  const group = ref('')
  
  async function getGroups() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/groups', { method: 'GET' })
    groups.value = response
    // groups.value = response.map(category => category.name)

    loading.value = false
  }

  async function getGroup(groupId) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/groups/${groupId}`, { method: 'GET' })
    group.value = response    
    loading.value = false
  }
  
  return { loading, error, group, groups, getGroups, getGroup }
}