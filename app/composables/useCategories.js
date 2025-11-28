export function useCategories() {

  const loading = ref(false)
  const error = ref(null)
  const categories = ref([])
  const category = ref('')
  
  async function getCategories() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/categories', { method: 'GET' })
    categories.value = response

    loading.value = false

    console.log('Fetched categories:', categories.value)
  }

  async function getCategory(categoryId) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/categories/${categoryId}`, { method: 'GET' })
    category.value = response    
    loading.value = false
  }
  
  return { loading, error, categories, category, getCategories, getCategory }
}