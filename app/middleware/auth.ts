export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    // Pages that require authentication
    const protectedRoutes = ['/archive', '/mytasks', '/focus', '/taskcreator', '/dashboard']

    if(!user.value && protectedRoutes.some(route => to.path.startsWith(route))) {
        return navigateTo('/login')
    } else if(user.value && to.path === '/login') {
        return navigateTo('/mytasks')
    } else if(user.value && to.path === '/') {
        return navigateTo('/mytasks')
    }
})