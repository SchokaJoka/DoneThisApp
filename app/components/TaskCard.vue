<template>
    <div class="w-full h-full perspective-1000 flex justify-center items-center">
        <div 
            class="w-full h-full transition-transform duration-700 transform-style-3d flex justify-center items-center"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card -->
            <div class="w-full h-full min-h-[70dvh] max-w-[400px] inset-0 backface-hidden flex flex-col justify-between items-start bg-cover bg-center p-[15px] rounded-[25px] gap-4 bg-bg-surface" :style="{ transform: `rotate(${rotation}deg)`, backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none'  }">

                <div class="w-full flex flex-col items-start gap-8">
                    <div class="w-full flex h-10 justify-between self-stretch ">
                        <div class="flex justify-center items-center">
                            <span class="text-md font-semibold text-text-primary">
                                {{ userCategory || '' }}
                            </span>
                        </div>
                        <div v-if="task.due_date" class="flex justify-center items-center gap-1">
                            <span class="text-md font-semibold text-text-primary">
                                {{ formatDate(task.due_date) }}
                                <span v-if="task.due_time"> {{ task.due_time }}</span>
                            </span>
                        </div>
                    </div>
                    <div class="w-full flex flex-col gap-4">
                        <div class="w-full">
                            <h1 class="text-4xl font-medium text-left">
                            {{ task.name || 'Untitled Task' }}
                            </h1>
                        </div>
                        <div class="w-full">
                            <p class="text-[20px] font-light text-left">
                            {{ task.description  || 'No description provided' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="w-full flex justify-center gap-[7px]">
                    <button @click.stop="isFlipped = true" class="flex px-[17px] py-[11px] bg-bg rounded-[10px]">
                        <div class="size-[24px] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <g clip-path="url(#clip0_2249_2354)">
                                    <path d="M12 15.0001L20.385 6.58511C20.7788 6.19126 21.0001 5.65709 21.0001 5.10011C21.0001 4.54312 20.7788 4.00895 20.385 3.61511C19.9912 3.22126 19.457 3 18.9 3C18.343 3 17.8088 3.22126 17.415 3.61511L9 12.0001V15.0001H12Z" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16 5L19 8" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.99992 7.07031C7.24571 7.32025 5.65156 8.22616 4.53904 9.6053C3.42651 10.9844 2.87841 12.7342 3.00528 14.5015C3.13216 16.2689 3.92457 17.9224 5.22269 19.1285C6.5208 20.3346 8.228 21.0035 9.99992 21.0003C11.6833 21.0005 13.3104 20.394 14.583 19.2921C15.8556 18.1901 16.6884 16.6664 16.9289 15.0003" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_2249_2354">
                                        <rect width="24" height="24" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </div>
                    </button>
                    <button @click="$emit('delete', task.id)" class="flex px-[17px] py-[11px] bg-bg rounded-[10px]">
                        <div class="size-[24px] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke="#FF8B0A" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </button>
                    <button class="flex px-[17px] py-[11px] bg-bg rounded-[10px]">
                        <div class="size-[24px] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <g clip-path="url(#clip0_2249_2379)">
                                    <path d="M5 12L10 17L20 7" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_2249_2379">
                                        <rect width="24" height="24" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </div>
                    </button>
                    <button class="flex w-full justify-center items-center self-stretch py-[11px] bg-bg rounded-[10px]">
                        <div class="size-[24px] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <g clip-path="url(#clip0_2249_2374)">
                                    <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="#FF8B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_2249_2374">
                                        <rect width="24" height="24" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Back of card (Edit form) -->
            <div class="absolute inset-0 backface-hidden flex flex-col justify-between items-start bg-orange-50 p-[11px] rounded-[21px]" style="transform: rotateY(180deg)">
                <div class="w-full h-full overflow-y-auto space-y-4 pb-4">
                    <h2 class="text-xl font-semibold mb-4">Edit Task</h2>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                        <input
                            v-model="editForm.name"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            v-model="editForm.description"
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                            <input
                                v-model="editForm.due_date"
                                type="date"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                            <input
                                v-model="editForm.due_time"
                                type="time"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
                        <div class="space-y-2">
                            <div v-for="(subtask, index) in editForm.subtasks" :key="index" class="flex gap-2">
                                <input
                                    v-model="subtask.text"
                                    type="text"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <button @click.stop="removeSubtask(index)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                    ✕
                                </button>
                            </div>
                            <button @click.stop="addSubtask" class="w-full px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200">
                                + Add Subtask
                            </button>
                        </div>
                    </div>
                </div>

                <div class="w-full flex gap-2">
                    <button @click.stop="cancelEdit" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button @click.stop="saveEdit" class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const { loadingCat, errorCat, categories, category, getCategories, getCategory } = useCategories()
const { loadingUserCat, errorUserCat, userCategory, getUserCategory } = useUserCategories()
const { loadingGroups, errorGroups, group, groups, getGroups, getGroup} = useGroups()

const props = defineProps({
    task: {
        type: Object,
        required: true
    },
    enableRotation: {
        type: Boolean,
        default: true
    },
    minRotation: {
        type: Number,
        default: -6
    },
    maxRotation: {
        type: Number,
        default: 6
    }
})

onMounted(async () => {
    if (props.enableRotation) {
        // deterministic rotation based on task id so it stays the same across reloads
        function hashToUnit(s) {
            if (!s) return Math.random()
            // FNV-1a 32-bit hash
            let h = 2166136261 >>> 0
            for (let i = 0; i < s.length; i++) {
                h ^= s.charCodeAt(i)
                h = Math.imul(h, 16777619) >>> 0
            }
            return (h >>> 0) / 4294967295
        }

        const seed = String(props.task && props.task.id ? props.task.id : '')
        const t = hashToUnit(seed)
        rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
    }

    await getCategory(props.task.category_id)
    await getGroup(props.task.group_id)
    await getUserCategory(category.value.name)

    editForm.value = {
        name: props.task.name || '',
        description: props.task.description || '',
        due_date: props.task.due_date || '',
        due_time: props.task.due_time || '',
    }
})

// Computed property to get the background image URL
const backgroundImageUrl = computed(() => {
    if (!category.value || !group.value.id) return ''
    try {
        // Use new URL with import.meta.url to properly resolve the asset path
        return new URL(`../assets/img/bg-card/${group.value.id}/${category.value.name}.webp`, import.meta.url).href
    } catch (e) {
        console.error('Error loading background image:', e)
        return ''
    }
})

const emit = defineEmits(['delete', 'save'])

const rotation = ref(0)
const isFlipped = ref(false)
const editForm = ref({
    name: '',
    description: '',
    due_date: '',
    due_time: '',
    subtasks: []
})

function cancelEdit() {
    isFlipped.value = false
    editForm.value = {
        name: props.task.name || '',
        description: props.task.description || '',
        due_date: props.task.due_date || '',
        due_time: props.task.due_time || '',
        subtasks: parsedSubtasks.value.map(st => ({ ...st }))
    }
}

// Recompute rotation if the task id changes (keeps rotation consistent per id)
watch(() => props.task && props.task.id, (id) => {
    if (!props.enableRotation) return
    function hashToUnit(s) {
        if (!s) return Math.random()
        let h = 2166136261 >>> 0
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i)
            h = Math.imul(h, 16777619) >>> 0
        }
        return (h >>> 0) / 4294967295
    }
    const seed = String(id || '')
    const t = hashToUnit(seed)
    rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
})

function saveEdit() {
    emit('save', {
        taskId: props.task.id,
        updates: {
            name: editForm.value.name,
            description: editForm.value.description,
            due_date: editForm.value.due_date || null,
            due_time: editForm.value.due_time || null,
        }
    })
    isFlipped.value = false
}

function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date)) return ''
    return date.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}
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
