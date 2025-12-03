<template>
  <div class="min-h-screen p-4">
    <div class="max-w-md mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-1">Overview of your tasks and progress</p>
        </div>
        <button
          @click="logout()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>

    <h1>DoneThisApp</h1>
    <h2>DoneThisApp</h2>
    <h3>DoneThisApp</h3>
    <h4>DoneThisApp</h4>
  </div>



</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
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
