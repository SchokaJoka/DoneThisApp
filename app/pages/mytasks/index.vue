<template>
  <div class="bg-bg-surface w-full">
    <div class="flex flex-col w-full h-fit p-4 gap-4">
      <div class="w-full">
        <p class="overview-label text-text-secondary">Kategorien</p>
      </div>
    </div>
    <div class="flex w-full gap-4 overflow-x-scroll p-4">
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
  
  <div class="p-4">
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
        <div 
          v-if="filteredTasks?.length > 0" 
          :key="selectedCategory" 
          ref="cardContainer"
          class="card-stack relative w-full h-[70vh]"
        >
          <div 
            v-for="(task, index) in filteredTasks" 
            :key="task.id" 
            class="absolute inset-0 w-full flex justify-center items-start transition-all duration-500 ease-out"
            :class="{ 'pointer-events-none': index !== currentCardIndex }"
            :style="getCardStyle(index)"
          >
            <TaskCard 
              :taskId="task.id" 
              :enable-rotation="false" 
            />
          </div>
          
          <!-- Card indicator -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            <button
              v-for="(task, index) in filteredTasks"
              :key="task.id"
              @click="goToCard(index)"
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="index === currentCardIndex ? 'bg-text-primary w-6' : 'bg-text-secondary/40'"
            />
          </div>
        </div>
        <div v-else class="w-full flex justify-center items-center snap-start">
          <h1 class="text-text-primary text-center">Keine Aufgaben vorhanden</h1>
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
const currentCardIndex = ref(0)
const isAnimating = ref(false)
const cardContainer = ref(null)

// Touch handling
const touchStartY = ref(0)
const touchDeltaY = ref(0)

function selectCategory(categoryName, usCaNa) {
  selectedCategory.value = categoryName
  userCategoryName.value = usCaNa
  currentCardIndex.value = 0
}

const filteredTasks = computed(() => {
  if (selectedCategory.value === 'Alle Aufgaben') {
    return tasks.value
  }
  const category = categories.value.find(c => c.name === selectedCategory.value)
  if (!category) return tasks.value
  return tasks.value.filter(task => task.category_id === category.id)
})

watch(filteredTasks, () => {
  currentCardIndex.value = 0
})

function getCardStyle(index) {
  const diff = index - currentCardIndex.value
  
  if (diff < 0) {
    // Cards that have been scrolled past - move up and fade out
    return {
      transform: `translateY(-100px) scale(0.95)`,
      opacity: 0,
      zIndex: index
    }
  } else if (diff === 0) {
    // Current card - on top
    return {
      transform: 'translateY(0) scale(1)',
      opacity: 1,
      zIndex: 30
    }
  } else {
    // Cards below - stacked underneath
    const offset = Math.min(diff, 4)
    return {
      transform: `translateY(${offset * 15}px) scale(${1 - offset * 0.02})`,
      opacity: Math.max(0, 1 - (diff - 1) * 0.3),
      zIndex: 20 - diff
    }
  }
}

// Handle wheel events on the card stack area
function handleWheel(event) {
  // Check if event originated from a scrollable subtask area
  if (isFromSubtaskScroll(event.target)) {
    return // Don't interfere with subtask scrolling
  }
  
  if (isAnimating.value) return
  
  const threshold = 30
  
  if (event.deltaY > threshold) {
    nextCard()
  } else if (event.deltaY < -threshold) {
    prevCard()
  }
}

function isFromSubtaskScroll(element) {
  let current = element
  while (current) {
    if (current.classList?.contains('subtask-scroll')) {
      return true
    }
    current = current.parentElement
  }
  return false
}

function handleTouchStart(event) {
  if (isFromSubtaskScroll(event.target)) return
  touchStartY.value = event.touches[0].clientY
  touchDeltaY.value = 0
}

function handleTouchMove(event) {
  if (isFromSubtaskScroll(event.target)) return
  touchDeltaY.value = touchStartY.value - event.touches[0].clientY
}

function handleTouchEnd(event) {
  if (isFromSubtaskScroll(event.target)) return
  if (isAnimating.value) return
  
  const threshold = 50
  
  if (touchDeltaY.value > threshold) {
    nextCard()
  } else if (touchDeltaY.value < -threshold) {
    prevCard()
  }
  
  touchDeltaY.value = 0
}

function nextCard() {
  if (currentCardIndex.value < filteredTasks.value.length - 1) {
    isAnimating.value = true
    currentCardIndex.value++
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }
}

function prevCard() {
  if (currentCardIndex.value > 0) {
    isAnimating.value = true
    currentCardIndex.value--
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }
}

function goToCard(index) {
  if (isAnimating.value || index === currentCardIndex.value) return
  isAnimating.value = true
  currentCardIndex.value = index
  setTimeout(() => {
    isAnimating.value = false
  }, 500)
}

// Set up event listeners
onMounted(() => {
  if (cardContainer.value) {
    cardContainer.value.addEventListener('wheel', handleWheel, { passive: false })
    cardContainer.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    cardContainer.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    cardContainer.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  if (cardContainer.value) {
    cardContainer.value.removeEventListener('wheel', handleWheel)
    cardContainer.value.removeEventListener('touchstart', handleTouchStart)
    cardContainer.value.removeEventListener('touchmove', handleTouchMove)
    cardContainer.value.removeEventListener('touchend', handleTouchEnd)
  }
})

</script>

<style scoped>
.card-stack {
  overflow: visible;
}
</style>
