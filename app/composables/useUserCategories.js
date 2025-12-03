// Shared state outside the function - singleton pattern
const loading = ref(false)
const error = ref(null)
const userCategories = ref({})

export function useUserCategories() {
  const userCategory = ref('')

  async function getUserCategories() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/userCategories', { method: 'GET' })
    userCategories.value = response

    loading.value = false
  }

  async function getUserCategory(colorName) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/userCategories/${colorName}`, { method: 'GET' })
    userCategory.value = response 
    loading.value = false
  }

  async function updateUserCategory(color, newName) {
    error.value = null
    loading.value = true
    
    await $fetch(`/api/userCategories/${color}`, {
      method: 'PATCH',
      body: {
        newName: newName
      }
    })    

    loading.value = false
  }
  
  return { loading, error, userCategories, userCategory, getUserCategories, getUserCategory, updateUserCategory }
}