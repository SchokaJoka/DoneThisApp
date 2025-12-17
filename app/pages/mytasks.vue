<template>
  <div class="w-full h-full">
    <div class="bg-bg-surface w-full">
      <div class="flex flex-col w-full h-fit p-4 gap-4">
        <div class="w-full">
          <p class="overview-label text-text-secondary">Kategorien</p>
        </div>
      </div>
      <div class="flex w-full gap-4 overflow-x-scroll p-4">
        <div v-for="(category) in categories" :key="category.id">
          <CategoryCard :category="category" :is-active="selectedCategory === category.name" @click="selectCategory"/>
        </div>
      </div>
    </div>
    
    <div class="p-4 w-full">
    <div class="w-full">
      <div class="w-full flex flex-row h-fit justify-center mb-4 items-center sticky top-2 z-30">
        <p class="overview-label text-text-primary">{{ userCategoryName }}</p>
      </div>
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-700 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div v-if="filteredTasks?.length > 0" :key="selectedCategory" class="flex flex-col gap-[30vh] w-full min-h-screen">
          <div 
            v-for="(task, index) in filteredTasks" 
            :key="task.id" 
            class="w-full flex justify-center items-start sticky top-16"
          >
              <TaskCard 
              :taskId="task.id" 
              :enable-rotation="false" />
          </div>
          <div class="w-full h-[60vh]"/>
        </div>
        <div v-else class="w-full flex justify-center items-center snap-start">
          <h1 class="text-text-primary text-center">Keine Aufgaben vorhanden</h1>
        </div>
      </Transition>
    </div>
  </div>
  </div>
</template>
    
<script setup>

const { tasks, getTasks } = useTasks()
const { categories } = useCategories()

onMounted(async () => {
  if (!tasks.value.length) {
    console.log('Fetching tasks in MyTasks page...')
    await getTasks()
  }
})

const taskInbox = computed(() => {
  return tasks.value.filter(task => task.status === 0)
})

const selectedCategory = ref(null)
const userCategoryName = ref('Alle Aufgaben')

function selectCategory(categoryName, usCaNa) {
  // toggle selection: clicking active category deselects and shows all tasks
  if (!categoryName) {
    selectedCategory.value = null
    userCategoryName.value = 'Alle Aufgaben'
    return
  }

  if (selectedCategory.value === categoryName) {
    selectedCategory.value = null
    userCategoryName.value = 'Alle Aufgaben'
  } else {
    selectedCategory.value = categoryName
    userCategoryName.value = usCaNa || categoryName
  }
}

const filteredTasks = computed(() => {
  if (selectedCategory.value === 'Alle Aufgaben') {
    return taskInbox.value
  }
  const category = categories.value.find(c => c.name === selectedCategory.value)
  if (!category) return taskInbox.value
  return taskInbox.value.filter(task => task.category_id === category.id)
})

</script>
