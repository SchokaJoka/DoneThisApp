export function useUserCategories() {

  const loading = ref(false)
  const error = ref(null)
  const userCategories = ref({})
  const userCategory = ref('')

  async function getUserCategories() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/userCategories', { method: 'GET' })
    userCategories.value = response

    loading.value = false

    console.log('UserCategories:', userCategories.value)
  }

  async function getUserCategory(colorName) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/userCategories/${colorName}`, { method: 'GET' })
    userCategory.value = response 
    loading.value = false
  }

  async function updateUserCategory(categoryId, userLabel) {
    error.value = null
    loading.value = true
    
    await $fetch(`/api/userCategories/${categoryId}`, {
      method: 'PATCH',
      body: userLabel
    })    

    loading.value = false
  }
  
  return { loading, error, userCategories, userCategory, getUserCategories, getUserCategory, updateUserCategory }
}