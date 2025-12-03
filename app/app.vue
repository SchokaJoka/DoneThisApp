
<template>
  <div class="l-svh w-lvw bg-bg">
    <NuxtPage />
    <Navigation v-if="user" />
  </div>
</template>

<script setup>
const user = useSupabaseUser()

const { tasks, getTasks } = useTasks()
const { categories, getCategories } = useCategories()
const { userCategories, getUserCategories } = useUserCategories()
const { groups, getGroups } = useGroups()

watch(user, async (newUser) => {
  if (newUser) {
    try {
      await Promise.all([getTasks(), getCategories(), getUserCategories(), getGroups()])
    } catch (e) {
      console.error('Error fetching global data:', e)
    }
    finally {
      console.log('Global data fetched:')
      console.log('tasks:', tasks.value)
      console.log('categories:', categories.value)
      console.log('userCategories:', userCategories.value)
      console.log('groups:', groups.value)
    }
  }
}, { immediate: true })

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