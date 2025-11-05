<script setup lang="ts">
const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
      return navigateTo('/dashboard')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="text-center space-y-4">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900">Confirming your email...</h2>
      <p class="text-gray-600">Please wait while we verify your account</p>
    </div>
  </div>
</template>
