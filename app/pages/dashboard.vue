<template>
<button @click="logout()">Logout</button>

    <h1>dashboard</h1>
    <p>text lorem ispum</p>

</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth']
})

// const user = useSupabaseUser()
// onMounted(() => {
//     watchEffect(() => {
//         if(!user.value) {
//             navigateTo('/login')
//         }
//     })

// })


const logout = async () => {
    const { error } = await useSupabaseClient().auth.signOut()
    if (error) {
        console.error("Error logging out: ", error.message)
    } else {
        console.log("Logged out successfully.")
        navigateTo('/')
    }
}

</script>