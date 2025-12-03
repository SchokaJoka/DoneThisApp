<template>
    <nav
        class="z-1 fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 p-2 backdrop-blur bg-bg-surface"
    >
        <div class="flex items-center justify-around">
            <NuxtLink
                to="/taskcreator"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/taskcreator', 'text-gray-600': currentRoute !== '/taskcreator' }"
                aria-label="Create"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" class="stroke-primary fill-bg-fill">
                    <g clip-path="url(#clip0_2492_8628)">
                        <path d="M12 3C19.2 3 21 4.8 21 12C21 19.2 19.2 21 12 21C4.8 21 3 19.2 3 12C3 4.8 4.8 3 12 3Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M15 12H9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 9V15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_2492_8628">
                        <rect width="40" height="40" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </NuxtLink>

            <NuxtLink
                to="/mytasks"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/mytasks', 'text-gray-600': currentRoute !== '/mytasks' }"
                aria-label="My Tasks"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" class="stroke-bg-fill fill-primary">
                    <g clip-path="url(#clip0_2492_8623)">
                        <path d="M3.6041 7.1964L10.7421 4.0874C10.8599 4.03692 10.9866 4.01052 11.1147 4.00978C11.2429 4.00904 11.3699 4.03396 11.4882 4.08308C11.6066 4.13219 11.7139 4.20451 11.8039 4.29576C11.8939 4.38701 11.9647 4.49536 12.0121 4.6144L16.9361 16.5164C17.0385 16.7577 17.0419 17.0296 16.9458 17.2735C16.8497 17.5174 16.6616 17.7138 16.4221 17.8204L9.2851 20.9294C9.16726 20.98 9.04047 21.0066 8.91222 21.0074C8.78396 21.0082 8.65684 20.9833 8.53836 20.9342C8.41988 20.8851 8.31245 20.8127 8.2224 20.7214C8.13236 20.63 8.06153 20.5216 8.0141 20.4024L3.0901 8.4994C2.98775 8.25805 2.98427 7.98617 3.08041 7.74228C3.17654 7.49839 3.3646 7.303 3.6041 7.1964Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M15 4H16C16.2652 4 16.5196 4.10536 16.7071 4.29289C16.8946 4.48043 17 4.73478 17 5V8.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20 6C20.264 6.112 20.52 6.217 20.768 6.315C21.0121 6.41859 21.2051 6.6149 21.3045 6.86075C21.4039 7.1066 21.4015 7.38187 21.298 7.626L19 13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_2492_8623">
                        <rect width="40" height="40"/>
                        </clipPath>
                    </defs>
                </svg>
                
            </NuxtLink>

            <NuxtLink
                to="/mytasks"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/mytasks', 'text-gray-600': currentRoute !== '/mytasks' }"
                aria-label="My Tasks"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" class="stroke-primary fill-bg-fill">
                    <g clip-path="url(#clip0_2492_8653)">
                        <path d="M7 4V20L20 12L7 4Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_2492_8653">
                            <rect width="40" height="40" fill="white"/>
                        </clipPath>
                    </defs>
                    
                </svg>
            </NuxtLink>

            <NuxtLink
                to="/dashboard"
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-md"
                :class="{ 'text-blue-600': currentRoute === '/dashboard', 'text-gray-600': currentRoute !== '/dashboard' }"
                aria-label="Dashboard"
                @click="startTransition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" class="stroke-bg-fill fill-primary">
                    <g clip-path="url(#clip0_2492_8648)">
                        <path d="M3 6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H19C19.5304 4 20.0391 4.21071 20.4142 4.58579C20.7893 4.96086 21 5.46957 21 6C21 6.53043 20.7893 7.03914 20.4142 7.41421C20.0391 7.78929 19.5304 8 19 8H5C4.46957 8 3.96086 7.78929 3.58579 7.41421C3.21071 7.03914 3 6.53043 3 6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M5 8V18C5 18.5304 5.21071 19.0391 5.58579 19.4142C5.96086 19.7893 6.46957 20 7 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 12H14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_2492_8648">
                        <rect width="40" height="40" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
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