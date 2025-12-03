
const loading = ref(false)
const error = ref(null)
const categories = ref([])

export function useCategories() {
  const category = ref('')
  
  async function getCategories() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/categories', { method: 'GET' })
    categories.value = response

    loading.value = false
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