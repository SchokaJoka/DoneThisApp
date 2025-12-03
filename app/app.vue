
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
const { groups, getGroups } = useGroups()

onMounted(async () => {
  if (user.value) {
    try {
      await Promise.all([getTasks(), getCategories(), getUserCategories(), getGroups()])
    } catch (e) {
      console.error('Error fetching global data on mount:', e)
    }
    finally {
      console.log('Global data fetched on mount:')
      console.log('tasks:', tasks.value)
      console.log('categories:', categories.value)
      console.log('userCategories:', userCategories.value)
      console.log('groups:', groups.value)
    }
  }
})

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