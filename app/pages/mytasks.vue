<template>
  <div class="bg-bg-surface">
    <div class="flex flex-col w-screen h-fit p-4 gap-4">
      <div>
        <h1 class="text-2xl">Kategorien</h1>
      </div>
    </div>
    <div class="flex w-screen gap-4 overflow-x-auto p-4">
      <div v-for="(category) in categories" :key="category.id">
        <CategoryCard :category="category" :userCategoryName="userCategoryName(category.name)" />
      </div>
    </div>
  </div>

  
    <div class="flex w-screen p-4 sticky top-0">
      <h1 class="text-2xl font-bold">Alle Aufgaben</h1>
    </div>

  <div class="p-8">
    <div class="w-full flex flex-col gap-8">
      <div
        v-for="task in tasks" :key="task.id" class="w-full min-h-[70dvh] flex justify-center items-center sticky top-16">
        <TaskCard :task="task" :enable-rotation="false" />
      </div>

    </div>
    <div class="snap-start snap-always h-[75vh] w-full sticky top-16 flex flex-col items-center"></div>
  </div>
</template>
    
<script setup>
const editingTaskId = ref(null)
const scrollContainer = ref(null)

// Use injected global refs populated by `app.vue` (fetched only when authenticated)
const tasks = inject('tasks')
const categories = inject('categories')
const userCategories = inject('userCategories')
const userCategoryName = (categoryName) => {
  const userCategory = userCategories.value?.[`${categoryName}_name`]
  console.log('userCategory:', userCategory)
  console.log('categoryName:', categoryName)
  console.log('userCategories full:', userCategories.value)
  return userCategory ? userCategory : categoryName

}

onMounted(async () => {
  // Ensure scroll starts at top instantly
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'instant' })
  }
})
</script>
