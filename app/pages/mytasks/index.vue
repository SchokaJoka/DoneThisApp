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
    <div class="w-full">
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-700 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div v-if="filteredTasks?.length > 0" :key="selectedCategory" class="flex flex-col">
          <div 
            v-for="(task, index) in filteredTasks" 
            :key="task.id" 
            class="w-full flex justify-center items-start sticky top-16 -bottom-110 mt-[100px] first:mt-0"
          >
              <TaskCard 
              :taskId="task.id" 
              :enable-rotation="true" />
          </div>
          <div class="h-[60vh]"/>
        </div>
        <div v-else class="w-full flex justify-center items-center snap-start">
          <h1 class="text-text-primary text-center">Keine Aufgaben in {{ userCategoryName }}.</h1>
        </div>
      </Transition>
    </div>
  </div>
</template>
    
<script setup>

const { tasks } = useTasks()
const { categories } = useCategories()

const selectedCategory = ref('Alle Aufgaben')
const userCategoryName = ref('Alle Aufgaben')

function selectCategory(categoryName, usCaNa) {
  selectedCategory.value = categoryName
  userCategoryName.value = usCaNa
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
