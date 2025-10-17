<template>
  <NuxtPage />
  <Navigation />
  <TestComponent v-if="user" />
</template>

<script setup>
  const user = useSupabaseUser()


</script>
