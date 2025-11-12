export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    if(!user.value && to.path === '/dashboard') {
        return navigateTo('/login')
    } else if(user.value && to.path === '/login') {
        return navigateTo('/mytasks')
    } else if(user.value && to.path === '/') {
        return navigateTo('/mytasks')
    }
})