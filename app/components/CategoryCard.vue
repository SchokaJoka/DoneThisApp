<template>
    <div class="w-30 h-50 perspective-1000 flex justify-center items-center cursor-pointer" @click="handleClick">
        <div
            class="w-full h-full transition-transform duration-700 transform-style-3d flex justify-center items-center"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card (existing content) -->
            <div 
                class="shadow-md w-30 h-50 rounded-2xl flex flex-col justify-between items-center p-4 backface-hidden hover:scale-105 transition-all duration-300 ring-offset-nav-bg"
                :class="props.isActive ? 'ring-4 ring-btn-primary ring-offset-4' : 'ring-0 ring-transparent ring-offset-0'"
                :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none', backgroundSize: 'cover' }"
            >
                <div></div>
                <h2 class="text-lg text-text-primary text-center font-semibold mb-2">{{ categoryName }}</h2>
                <div class="w-full flex justify-center gap-2 mt-2">
                    <button v-if="(props.category && props.category.id !== 0)" @click.stop="edit"  class="fixed top-0 right-0 flex justify-center items-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
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
            <div class="shadow-md absolute inset-0 backface-hidden flex flex-col justify-between items-start p-2 rounded-2xl ring-offset-bg-surface" :style="{ transform: 'rotateY(180deg)', backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none', backgroundSize: 'cover' }" :class="props.isActive ? 'ring-4 ring-btn-primary ring-offset-4' : 'ring-0 ring-transparent ring-offset-0'">
                <div class="w-full">
                    <div class="mb-3 w-full">
                        <input v-model="input" type="text" class="w-full p-2 bg-white/80 border-border rounded-lg" />
                    </div>
                </div>

                <div class="w-full flex flex-col gap-2 mt-2">
                    <button @click.stop="cancelEdit" class="flex items-center justify-center px-4 py-2 bg-bg rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                            <g clip-path="url(#clip0_2600_10946)">
                                <path d="M18 6L6 18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M6 6L18 18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_2600_10946">
                                <rect width="24" height="24" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                    </button>
                    <button @click.stop="saveEdit" class="flex items-center justify-center px-4 py-2 bg-bg rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                            <g clip-path="url(#clip0_2752_12820)">
                                <path d="M5 12L10 17L20 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_2752_12820">
                                <rect width="24" height="24" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                    </button>
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
    },
    isActive: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

const input = ref("")
const isFlipped = ref(false)

function handleClick() {
    if (!isFlipped.value) {
        emit('click', props.category.name, categoryName.value)
    }
}

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
    if (props.category.id === 0) {
        try {
            return `/img/default.webp`
        } catch (e) {
            console.error('Error loading background image:', e)
            return ''
        }
    }
    try {
        return `/img/bg-card/7fe28093-27dd-489b-b089-56109b2b4d14/${props.category.name}.webp`
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