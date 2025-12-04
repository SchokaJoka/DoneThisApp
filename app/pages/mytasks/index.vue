<template>
  <div class="bg-bg-surface w-screen">
    <div class="flex flex-col w-full h-fit p-4 gap-4">
      <div class="w-full">
        <p class="overview-label text-text-secondary">Kategorien</p>
      </div>
    </div>
    <div class="flex w-screen gap-4 overflow-x-auto p-4">
      <div>
        <CategoryCard :category="{
          id: 0,
          name: 'Alle Aufgaben',
          color: '#9CA3AF'
        }"
        :is-active="selectedCategory === 'Alle Aufgaben'"
        @click="selectCategory"
        />
      </div>
      <div v-for="(category) in categories" :key="category.id">
        <CategoryCard :category="category" :is-active="selectedCategory === category.name" @click="selectCategory"/>
      </div>

    </div>
  </div>

  
  <div class="flex flex-col w-full h-fit p-4 gap-4 sticky top-0">
    <div class="w-full">
      <p class="overview-label text-text-primary">{{ userCategoryName }}</p>
    </div>
  </div>

  <div class="p-8">
    <div class="w-full flex flex-col gap-8">
      <div
        v-for="task in filteredTasks" :key="task.id" class="w-full min-h-[70dvh] flex justify-center items-center sticky top-16">
        <TaskCard 
        :taskId="task.id" 
        :enable-rotation="false" />
      </div>

    </div>
    <div class="snap-start snap-always h-[75vh] w-full sticky top-16 flex flex-col items-center"></div>
  </div>
</template>
    
<script setup>

const { tasks } = useTasks()
const { categories } = useCategories()

const selectedCategory = ref('Alle Aufgaben')
const userCategoryName = ref('Alle Aufgaben')

function selectCategory(categoryName, userCategoryName) {
  selectedCategory.value = categoryName
  userCategoryName.value = userCategoryName
}

const filteredTasks = computed(() => {
  if (selectedCategory.value === 'Alle Aufgaben') {
    return tasks.value
  }
  const category = categories.value.find(c => c.name === selectedCategory.value)
  if (!category) return tasks.value
  return tasks.value.filter(task => task.category_id === category.id)
})

</script>
