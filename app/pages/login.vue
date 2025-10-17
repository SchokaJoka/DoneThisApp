<script setup lang="ts">
definePageMeta({
    middleware: ['auth']
})

const supabase = useSupabaseClient()
const email = ref('')

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: 'http://localhost:3000/confirm',
    }
  })
  if (error) console.log(error)
}
</script>
<template>
  <div>
    <button @click="signInWithOtp">
      Sign In with E-Mail
    </button>
    <input
      v-model="email"
      type="email"
    />
  </div>
  <div>
    <button class="rounded-sm bg-red-500 p-2 pt-3 ">
      <span>
        Sign In with Google (Not implemented yet)
      </span>
    </button>
  </div>
</template>

