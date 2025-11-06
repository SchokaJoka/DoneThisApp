<template>
    <nav
        class="z-1 fixed bottom-0 left-0 right-0 p-2 backdrop-blur rounded-full m-4 bg-white/50"
    >
        <div class="flex items-center justify-around">
            <NuxtLink
                to="/taskcreator"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/taskcreator', 'text-gray-600': currentRoute !== '/taskcreator' }"
                aria-label="Create"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span class="text-[11px]">Create</span>
            </NuxtLink>

            <NuxtLink
                to="/mytasks"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/mytasks', 'text-gray-600': currentRoute !== '/mytasks' }"
                aria-label="My Tasks"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
                <span class="text-[11px]">My Tasks</span>

                
            </NuxtLink>

            <NuxtLink
                to="/dashboard"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/dashboard', 'text-gray-600': currentRoute !== '/dashboard' }"
                aria-label="Dashboard"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span class="text-[11px]">Dashboard</span>
            </NuxtLink>
        </div>
    </nav>
</template>

<script setup>
const route = useRoute()
const currentRoute = computed(() => route.path)
const isNavigating = ref(false)

function startTransition() {
    isNavigating.value = true
    setTimeout(() => {
        isNavigating.value = false
    }, 300)
}

watch(
    () => route.path,
    () => {
        isNavigating.value = true
        setTimeout(() => {
            isNavigating.value = false
        }, 200)
    }
)
</script>