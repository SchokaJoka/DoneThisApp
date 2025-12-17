<template>
  <div class="flex flex-col items-center justify-center">
    <div class="w-full h-[10vh] flex justify-center items-center bg-nav-bg">
      <p> {{ doneTasks.length }} abgeschlossene Tasks</p>
    </div>
    <div class="max-w-[600px] mt-4 px-4 grid grid-cols-2 gap-1">
      <ArchiveCard
        v-for="task in doneTasks"
        :taskId="task.id"
      />
    </div>
  </div>
</template>

<script setup>
const { tasks } = useTasks();

const doneTasks = computed(() => {
  return tasks.value.filter(task => task.status === 2);
});

const logout = async () => {
  const { error } = await useSupabaseClient().auth.signOut();
  if (error) {
    console.error("Error logging out: ", error.message);
  } else {
    console.log("Logged out successfully.");
    navigateTo("/login");
  }
};
</script>