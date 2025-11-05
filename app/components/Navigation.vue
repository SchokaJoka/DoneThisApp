<template>
    <nav
        class="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200/60 px-2 py-2 shadow-sm backdrop-blur"
        aria-label="Primary"
    >
        <div class="flex items-center justify-around">
            <NuxtLink
                to="/taskcreator"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/taskcreator', 'text-gray-600': currentRoute !== '/taskcreator' }"
                aria-label="Create"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12M6 12h12" />
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
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M12 17V9M18 17V5M6 17v-4" />
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