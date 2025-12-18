<template>
  <div class="w-full h-full">
    <div :class="[ 'bg-nav-bg w-full flex flex-col fixed top-0 z-40 transition-all duration-300 overflow-visible', isCollapsed ? 'h-16' : 'h-75' ]">
      <div class="flex flex-col w-full">
        <div class="w-full p-4">
          <p class="overview-label text-text-primary">{{ userCategoryName }}</p>
        </div>
      </div>
      <div v-show="!isCollapsed" class="flex w-full h-full pl-4 py-4 gap-4 overflow-x-scroll overflow-y-visible">
        <div v-for="(category) in categories" :key="category.id">
          <CategoryCard :category="category" :is-active="selectedCategory === category.name" @click="selectCategory"/>
        </div>
      </div>
      <div :class="[ 'cursor-pointer absolute left-1/2 transform -translate-x-1/2 z-50 -bottom-6 transition-transform duration-300', !isCollapsed ? 'rotate-180' : '' ]" @click="toggleCollapse">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 30 30" fill="none">
          <g clip-path="url(#clip0_2646_11630)">
            <rect width="30" height="30" rx="15" class="fill-nav-bg"/>
            <path d="M10 15L15 20" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 10V20" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 15L15 20" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_2646_11630">
              <rect width="30" height="30" rx="15" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
    
    <div class="mt-20 p-4 w-full">
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
        <div v-if="filteredTasks?.length > 0" :key="selectedCategory" class="flex flex-col gap-[20vh] w-full min-h-screen">
          <div 
            v-for="(task, index) in filteredTasks" 
            :key="task.id" 
            class="w-full flex justify-center items-start sticky top-32"
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

const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

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
