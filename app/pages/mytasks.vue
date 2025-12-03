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
        }"/>
      </div>
      <div v-for="(category) in categories" :key="category.id">
        <CategoryCard :category="category"/>
      </div>

    </div>
  </div>

  
  <div class="flex flex-col w-full h-fit p-4 gap-4 sticky top-0">
    <div class="w-full">
      <p class="overview-label text-text-primary">Alle Kategorien</p>
    </div>
  </div>

  <div class="p-8">
    <div class="w-full flex flex-col gap-8">
      <div
        v-for="task in tasks" :key="task.id" class="w-full min-h-[70dvh] flex justify-center items-center sticky top-16">
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

</script>
