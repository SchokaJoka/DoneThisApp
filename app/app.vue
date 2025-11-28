
<template>
  <div class="l-svh w-lvw bg-bg">
    <NuxtPage />
    <Navigation />
  </div>
</template>

<script setup>
const user = useSupabaseUser()

const { tasks, getTasks } = useTasks()
const { categories, getCategories } = useCategories()
const { userCategories, getUserCategories } = useUserCategories()

onMounted(async () => {
  if (user.value) {
    try {
      await Promise.all([getTasks(), getCategories(), getUserCategories()])
    } catch (e) {
      console.error('Error fetching global data on mount:', e)
    }
  }
  console.log('app.vue tasks: ', tasks)
  console.log('app.vue categories: ', categories)
  console.log('app.vue userCategories: ', userCategories)
})

// data for descendant components for inject
provide('tasks', tasks)
provide('categories', categories)
provide('userCategories', userCategories)

</script>

<style>
  .page-enter-active,
  .page-leave-active {
    transition: all 0.4s;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    filter: blur(1rem);
  }
</style>