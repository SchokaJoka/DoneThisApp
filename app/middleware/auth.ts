export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    if(!user.value && to.path === '/dashboard') {
        return navigateTo('/login')
    } else if(user.value && to.path === '/login') {
        return navigateTo('/dashboard')
    } else if(user.value && to.path === '/') {
        return navigateTo('/dashboard')
    }
})