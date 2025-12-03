<template>
    <div class="w-30 h-50 perspective-1000 flex justify-center items-center">
        <div
            class="w-full h-full transition-transform duration-700 transform-style-3d flex justify-center items-center"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card (existing content) -->
            <div class="w-30 h-50 rounded-2xl flex flex-col justify-between items-center p-4 backface-hidden" :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none', backgroundSize: 'cover' }">
                <div></div>
                <h2 class="text-md text-center font-semibold mb-2">{{ categoryName }}</h2>
                <div class="w-full flex justify-center gap-2 mt-2">
                    <button @click.stop="edit"  class="flex justify-center items-center p-4 py-2 rounded-2xl bg-bg-fill">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-black">
                            <g clip-path="url(#clip0_2249_2354)">
                                <path d="M12 15.0001L20.385 6.58511C20.7788 6.19126 21.0001 5.65709 21.0001 5.10011C21.0001 4.54312 20.7788 4.00895 20.385 3.61511C19.9912 3.22126 19.457 3 18.9 3C18.343 3 17.8088 3.22126 17.415 3.61511L9 12.0001V15.0001H12Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16 5L19 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8.99992 7.07031C7.24571 7.32025 5.65156 8.22616 4.53904 9.6053C3.42651 10.9844 2.87841 12.7342 3.00528 14.5015C3.13216 16.2689 3.92457 17.9224 5.22269 19.1285C6.5208 20.3346 8.228 21.0035 9.99992 21.0003C11.6833 21.0005 13.3104 20.394 14.583 19.2921C15.8556 18.1901 16.6884 16.6664 16.9289 15.0003" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_2249_2354">
                                    <rect width="24" height="24" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Back of card (Edit form) -->
            <div class="absolute inset-0 backface-hidden flex flex-col justify-between items-start p-2 rounded-2xl" :style="{ transform: 'rotateY(180deg)', backgroundColor: category.color }">
                <div class="w-full">
                    <div class="mb-3 w-full">
                        <input v-model="input" type="text" class="w-full p-2 bg-bg border border-border rounded-lg" />
                    </div>
                </div>

                <div class="w-full flex flex-col gap-2 mt-2">
                    <button @click.stop="cancelEdit" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
                    <button @click.stop="saveEdit" class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg">Save</button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>

const { userCategories, updateUserCategory, getUserCategories } = useUserCategories()

const props = defineProps({
    category: {
        type: Object,
        required: true
    }
})

const input = ref("")
const isFlipped = ref(false)

const categoryName = computed(() => {
    return userCategories.value[`${props.category.name}_name`] || props.category.name
})

function edit() {
    input.value = categoryName.value
    isFlipped.value = true
}

function cancelEdit() {
    isFlipped.value = false
    input.value = ""
}

async function saveEdit() {
    isFlipped.value = false
    await updateUserCategory(props.category.name, input.value)
    await getUserCategories()
}

const backgroundImageUrl = computed(() => {
    if (!props.category) return ''
    try {
        return new URL(`../assets/img/bg-card/7fe28093-27dd-489b-b089-56109b2b4d14/${props.category.name}.png`, import.meta.url).href
    } catch (e) {
        console.error('Error loading background image:', e)
        return ''
    }
})
</script>

<style scoped>
.perspective-1000 {
    perspective: 10000px;
}

.transform-style-3d {
    transform-style: preserve-3d;
}

.backface-hidden {
    backface-visibility: hidden;
}
</style>