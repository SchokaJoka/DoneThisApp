<template>
    <div class="w-30 h-50 rounded-2xl flex justify-center items-center" :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none', backgroundSize: 'cover' }">
        <h2 class="text-md font-semibold mb-2">{{ category.name }}</h2>
    </div>


</template>

<script setup>

const props = defineProps({
    category: {
        type: Object,
        required: true
    }
})
const backgroundImageUrl = computed(() => {
    // Use the passed-in category's `src` property. Fall back if missing.
    if (!props.category) return ''
    try {
        // Resolve the asset path relative to this file
        return new URL(`../assets/img/bg-card/7fe28093-27dd-489b-b089-56109b2b4d14/${props.category.src}.png`, import.meta.url).href
    } catch (e) {
        console.error('Error loading background image:', e)
        return ''
    }
})
</script>