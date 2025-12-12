
<template>
  <div class="h-svh w-dvw bg-bg overflow-x-hidden">
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

const hasFetched = ref(false)

// Only fetch data on client-side to ensure session is properly established
onMounted(() => {
  watch(user, async (newUser) => {
    if (newUser && !hasFetched.value) {
      hasFetched.value = true
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
    } else if (!newUser) {
      // Reset flag when user logs out so data can be fetched again on next login
      hasFetched.value = false
    }
  }, { immediate: true })
})

</script>

<style>
</style>