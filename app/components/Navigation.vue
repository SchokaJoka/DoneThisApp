<template>
    <!-- iPhone-style bottom tab bar -->
    <nav
        class="nav-bar fixed bottom-5 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md rounded-full px-3 py-2 shadow-xl border border-gray-200/60 flex justify-between items-center backdrop-blur-md"
        aria-label="Primary"
    >
        <!-- Create -->
        <NuxtLink
            to="/taskcreator"
            class="nav-btn flex-1 relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors duration-200 ease-out"
            :class="{ active: currentRoute === '/taskcreator' }"
            aria-label="Create"
            @click="startTransition"
        >
            <div
                class="icon w-10 h-10 flex items-center justify-center rounded-full transition-transform duration-200"
                :class="{ active: currentRoute === '/taskcreator' }"
            >
                <!-- Plus icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" />
                </svg>
            </div>
            <span class="text-[11px] leading-none transition-opacity duration-200" :class="isNavigating ? 'opacity-70' : 'opacity-100'">Create</span>
        </NuxtLink>

        <!-- MyTasks -->
        <NuxtLink
            to="/mytasks"
            class="nav-btn flex-1 relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors duration-200 ease-out"
            :class="{ active: currentRoute === '/mytasks' }"
            aria-label="My Tasks"
            @click="startTransition"
        >
            <div
                class="icon w-10 h-10 flex items-center justify-center rounded-full transition-transform duration-200"
                :class="{ active: currentRoute === '/mytasks' }"
            >
                <!-- List icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
            </div>
            <span class="text-[11px] leading-none transition-opacity duration-200" :class="isNavigating ? 'opacity-70' : 'opacity-100'">My Tasks</span>
        </NuxtLink>

        <!-- Dashboard -->
        <NuxtLink
            to="/dashboard"
            class="nav-btn flex-1 relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors duration-200 ease-out"
            :class="{ active: currentRoute === '/dashboard' }"
            aria-label="Dashboard"
            @click="startTransition"
        >
            <div
                class="icon w-10 h-10 flex items-center justify-center rounded-full transition-transform duration-200"
                :class="{ active: currentRoute === '/dashboard' }"
            >
                <!-- Chart icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M12 17V9M18 17V5M6 17v-4" />
                </svg>
            </div>
            <span class="text-[11px] leading-none transition-opacity duration-200" :class="isNavigating ? 'opacity-70' : 'opacity-100'">Dashboard</span>
        </NuxtLink>
    </nav>
</template>

<script setup>
const route = useRoute()
const currentRoute = computed(() => route.path)

// navigation animation state
const isNavigating = ref(false)

// start animation immediately when a nav link is clicked
function startTransition() {
    isNavigating.value = true
    setTimeout(() => {
        isNavigating.value = false
    }, 350)
}

// also play the animation whenever the route actually changes
watch(
    () => route.path,
    () => {
        isNavigating.value = true
        setTimeout(() => {
            isNavigating.value = false
        }, 300)
    }
)
</script>

<style scoped>
/* Define primary / secondary variables on the nav bar.
   Change these two groups to retheme the buttons. */
.nav-bar {
    /* primary (active) */
    --primary-text: #2563eb;           /* tailwind blue-600 */
    --primary-icon-bg: rgba(219, 234, 254, 1); /* tailwind blue-100 */

    /* secondary (inactive) */
    --secondary-text: #4b5563;         /* tailwind gray-600 */
    --secondary-icon-bg: transparent;

    /* nav chrome */
    --nav-bg: rgba(255, 255, 255, 0.95);
    --nav-border: rgba(255, 255, 255, 0.6);
    --overlay: rgba(219, 234, 254, 0.4);

    background-color: var(--nav-bg);
    border-color: var(--nav-border);
}

/* button (link) text color uses variables */
.nav-btn {
    color: var(--secondary-text);
    transition: color 200ms ease-out;
}
.nav-btn.active {
    color: var(--primary-text);
}

/* icon circle */
.icon {
    background: var(--secondary-icon-bg);
    transition: transform 200ms, background-color 200ms, box-shadow 200ms;
}
.icon.active {
    background: var(--primary-icon-bg);
    transform: scale(1.10);
    box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);
}
</style>