export function useCategories() {

  const loading = ref(false)
  const error = ref(null)
  const categories = ref([])
  const categoryName = ref('')
  const categoryImgSrc = ref('')
  
  async function getCategories() {
    error.value = null
    loading.value = true

    const response = await $fetch('/api/categories', { method: 'GET' })
    categories.value = response

    loading.value = false
  }

  async function getCategoryName(categoryId) {
    error.value = null
    loading.value = true

    const response = await $fetch(`/api/categories/${categoryId}`, { method: 'GET' })
    categoryName.value = response.name    
    loading.value = false
  }

  async function getCategoryImgSrc(categoryId) {
    error.value = null
    loading.value = true

    try {
      const response = await $fetch(`/api/categories/${categoryId}`, { method: 'GET' })
      categoryImgSrc.value = response.src
    } catch (err) {
      console.error('Error fetching category:', err)
      categoryImgSrc.value = ''
    }
    
    loading.value = false
  }

  // async function createCategory(properties) {
  //   error.value = null
  //   loading.value = true
  //   try {
  //     const body = {
  //       name: properties.name,
  //       description: properties.description || null,
  //       due_date: properties.due_date || null,
  //       due_time: properties.due_time || null,
  //       subtasks: properties.subtasks || null
  //     }

  //     const created = await $fetch('/api/categories', {
  //       method: 'POST',
  //       body
  //     })

  //     if (created && created.id) {
  //       categories.value.unshift(created)
  //     }
  //     return created
  //   } catch (err) {
  //     error.value = err?.message || String(err)
  //     return null
  //   } finally {
  //     loading.value = false
  //   }
  // }

  // async function deleteCategory(categoryId) {
  //   error.value = null
  //   loading.value = true
    
  //   await $fetch(`/api/categories/${categoryId}`, {
  //     method: 'DELETE'
  //   })
    
  //   loading.value = false
  // }

  // async function updateCategory(categoryId, updates) {
  //   error.value = null
  //   loading.value = true
    
  //   await $fetch(`/api/categories/${categoryId}`, {
  //     method: 'PATCH',
  //     body: { updates }
  //   })    

  //   loading.value = false
  // }
  
  return { loading, error, categoryName, categoryImgSrc, categories, getCategories, getCategoryName, getCategoryImgSrc}
}