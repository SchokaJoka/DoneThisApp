<template>
    <div class="perspective-1000 w-full flex justify-center items-center">
        <div 
            class="transition-transform ease-in-out duration-300 transform-style-3d w-full flex justify-center items-center"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card -->
            <div class="w-full max-w-[370px] h-[600px] max-h-[75vh] backface-hidden pt-4 px-6 pb-4 flex flex-col justify-between items-center bg-cover bg-center rounded-2xl bg-bg-fill" :style="{ transform: `rotate(${rotation}deg)`, backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none'  }">

                <div class="flex flex-col w-full flex-1 min-h-0 overflow-hidden">
                    <div class="flex flex-row justify-between items-center mb-6 shrink-0">
                        <div class="">
                            <span>
                                {{ userCategoryName }}
                            </span>
                        </div>
                        <div v-if="task.due_date" class="">
                            <span>
                                {{ formatDate(task.due_date) }}
                                <span v-if="task.due_time"> {{ formatTime(task.due_time) }}</span>
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4 mb-6 shrink-0">
                        <div class="">
                            <h1>
                            {{ task.name }}
                            </h1>
                        </div>
                        <div class="">
                            <p>
                            {{ task.description }}
                            </p>
                        </div>
                    </div>
                    <div v-if="subTasks && subTasks.length > 0" class="subtasks-scroll w-full flex-1 min-h-0 flex flex-col space-y-4 overflow-y-scroll">
                        <div 
                            v-for="subtask in sortedSubTasks" 
                            :key="subtask.id" 
                            class="flex items-center gap-2 p-2 bg-bg rounded-lg cursor-pointer hover:bg-bg-fill transition-colors shrink-0"
                            @click.stop="handleToggleSubtask(subtask)"
                        >
                            <input 
                                type="checkbox" 
                                :checked="subtask.status" 
                                class="w-4 h-4 shrink-0 cursor-pointer accent-orange-500"
                                @click.stop="handleToggleSubtask(subtask)"
                            />
                            <span :class="subtask.status ? 'line-through opacity-50' : ''">
                                {{ subtask.name }}
                            </span>
                        </div>
                    </div>

                </div>

                <div class="flex flex-row justify-between items-center w-full mb-4 gap-4">
                    <button @click.stop="editTask" class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
                        <div class="size-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                                <g clip-path="url(#clip0_2523_8883)">
                                    <path d="M12 15.0001L20.385 6.58511C20.7788 6.19126 21.0001 5.65709 21.0001 5.10011C21.0001 4.54312 20.7788 4.00895 20.385 3.61511C19.9912 3.22126 19.457 3 18.9 3C18.343 3 17.8088 3.22126 17.415 3.61511L9 12.0001V15.0001H12Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16 5L19 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.99992 7.07031C7.24571 7.32025 5.65156 8.22616 4.53904 9.6053C3.42651 10.9844 2.87841 12.7342 3.00528 14.5015C3.13216 16.2689 3.92457 17.9224 5.22269 19.1285C6.5208 20.3346 8.228 21.0035 9.99992 21.0003C11.6833 21.0005 13.3104 20.394 14.583 19.2921C15.8556 18.1901 16.6884 16.6664 16.9289 15.0003" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_2523_8883">
                                        <rect width="24" height="24" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </div>
                    </button>
                    <button class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
                        <div class="size-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                            <g clip-path="url(#clip0_2523_8899)">
                                <path d="M5 12L10 17L20 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_2523_8899">
                                    <rect width="24" height="24" fill="white"/>
                                </clipPath>
                            </defs>
                            </svg>
                        </div>
                    </button>
                    <button class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
                        <div class="size-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                            <g clip-path="url(#clip0_2492_8653)">
                                <path d="M7 4V20L20 12L7 4Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_2492_8653">
                                    <rect width="24" height="24" fill="white"/>
                                </clipPath>
                            </defs>
                            </svg>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Back of card (Edit form) -->
            <div class="absolute inset-0 backface-hidden flex flex-col justify-between items-start p-[11px] rounded-[21px]" :style="{ transform: 'rotateY(180deg)', backgroundColor: category?.color || '#FFF7ED' }">
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
                            <div v-for="subtask in sortedEditSubTasks" :key="subtask.id" class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    :checked="subtask.status"
                                    @change="toggleEditSubtaskStatus(subtask.originalIndex)"
                                    class="w-5 h-5 shrink-0 cursor-pointer accent-orange-500"
                                />
                                <input
                                    v-model="editSubTasks[subtask.originalIndex].name"
                                    type="text"
                                    placeholder="Subtask name..."
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    :class="{ 'line-through text-gray-400': subtask.status }"
                                />
                                <button @click.stop="removeSubtask(subtask.originalIndex)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                    ✕
                                </button>
                            </div>
                            <button @click.stop="addSubtask" class="w-full px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200">
                                + Add subtask
                            </button>
                        </div>
                    </div>
                </div>

                <div class="w-full flex gap-2">
                    <button @click.stop="cancelEdit" class="flex-1 px-4 py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button @click.stop="handleDelete" class="flex-1 px-4 py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Delete
                    </button>
                    <button 
                        @click.stop="saveEdit" 
                        :disabled="isSaving"
                        class="flex-1 px-4 py-2 cursor-pointer bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg v-if="isSaving" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {{ isSaving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const { tasks, task, updateTask, deleteTask, getTasks, getTask} = useTasks()
const { loadingGroups, errorGroups, groups, getGroups, getGroup} = useGroups()
const { categories } = useCategories()
const { userCategories } = useUserCategories()
const { getSubTasks, subTasks, createSubTask, updateSubTask, deleteSubTask, toggleSubTaskStatus } = useSubTasks()

// Track subtask changes during edit
const editSubTasks = ref([])
const deletedSubTaskIds = ref([])

const props = defineProps({
    taskId: {
        type: String,
        required: true
    },
    enableRotation: {
        type: Boolean,
        default: true
    },
    minRotation: {
        type: Number,
        default: -4
    },
    maxRotation: {
        type: Number,
        default: 4
    }
})

const category = computed(() => {
    return categories.value.find(cat => cat.id === task.value.category_id) || null
})

const userCategoryName = computed(() => {
    if (!category.value) return null
    const catName = category.value.name
    return userCategories.value[`${catName}_name`] || null
})

const group = computed(() => {
    return groups.value.find(g => g && g.id === task.value.group_id) || null
})

// Sort subtasks: incomplete first, then completed
const sortedSubTasks = computed(() => {
    if (!subTasks.value) return []
    return [...subTasks.value].sort((a, b) => {
        // Sort by status first (0 = incomplete comes before 1 = complete)
        if (a.status !== b.status) return a.status - b.status
        // Then by order
        return (a.order ?? 0) - (b.order ?? 0)
    })
})

// Sort edit subtasks: incomplete first, then completed (with original index preserved)
const sortedEditSubTasks = computed(() => {
    if (!editSubTasks.value) return []
    return editSubTasks.value
        .map((st, index) => ({ ...st, originalIndex: index }))
        .sort((a, b) => {
            if (a.status !== b.status) return a.status - b.status
            return (a.order ?? 0) - (b.order ?? 0)
        })
})

onMounted(async () => {
    if (props.enableRotation) {
        const seed = String(task.value?.id || '')
        const t = hashToUnit(seed)
        rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
    }
    getTask(props.taskId)
    getSubTasks(props.taskId)
})

// Computed property to get the background image URL
const backgroundImageUrl = computed(() => {
    const randomNum = Math.floor(Math.random() * 20) + 1
    if (!category.value?.name || !group.value?.id) return '/img/default.webp'
    try {
        return `/img/bg-card/${group.value.id}/${category.value.name}-${randomNum}.png`
    } catch (e) {
        console.error('Error loading background image:', e)
        return ''
    }
})

const rotation = ref(0)
const isFlipped = ref(false)
const isSaving = ref(false)
const editForm = ref({
    name: '',
    description: '',
    due_date: '',
    due_time: ''
})

// Recompute rotation if the task id changes (keeps rotation consistent per id)
watch(() => task.value?.id, (id) => {
    if (!props.enableRotation) return
    const seed = String(id || '')
    const t = hashToUnit(seed)
    rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
})

async function handleDelete() {
    const taskId = task.value.id
    await deleteTask(taskId)
    // Remove from local tasks array to prevent re-fetch of deleted task
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    isFlipped.value = false
}

// Store original subtasks for comparison
const originalSubTasks = ref([])

function editTask() {
    editForm.value = {
        name: task.value.name || '',
        description: task.value.description || '',
        due_date: task.value.due_date || '',
        due_time: task.value.due_time || ''
    }
    // Deep copy subtasks for editing and store originals for comparison
    editSubTasks.value = subTasks.value.map(st => ({ ...st }))
    originalSubTasks.value = subTasks.value.map(st => ({ ...st }))
    deletedSubTaskIds.value = []
    isFlipped.value = true
}

function cancelEdit() {
    isFlipped.value = false
    editForm.value = {
        name: task.value.name,
        description: task.value.description,
        due_date: task.value.due_date,
        due_time: task.value.due_time,
    }
    // Reset subtask edits
    editSubTasks.value = []
    originalSubTasks.value = []
    deletedSubTaskIds.value = []
}

// Check if task fields have changed
function hasTaskChanged() {
    return editForm.value.name !== (task.value.name || '') ||
           editForm.value.description !== (task.value.description || '') ||
           editForm.value.due_date !== (task.value.due_date || '') ||
           editForm.value.due_time !== (task.value.due_time || '')
}

// Check if a subtask has changed compared to original
function hasSubtaskChanged(editedSt) {
    if (editedSt.isNew) return true
    const original = originalSubTasks.value.find(st => st.id === editedSt.id)
    if (!original) return true
    return editedSt.name !== original.name || editedSt.status !== original.status
}

async function saveEdit() {
    if (isSaving.value) return
    isSaving.value = true
    
    try {
        const promises = []
        
        // Only update main task if something changed
        if (hasTaskChanged()) {
            promises.push(updateTask(task.value.id, {
                name: editForm.value.name,
                description: editForm.value.description,
                due_date: editForm.value.due_date,
                due_time: editForm.value.due_time,
            }))
        }
        
        // Delete removed subtasks
        for (const id of deletedSubTaskIds.value) {
            promises.push(deleteSubTask(id))
        }
        
        // Create or update subtasks (only if changed)
        for (const st of editSubTasks.value) {
            if (st.isNew) {
                // Create new subtask
                promises.push(createSubTask(task.value.id, {
                    name: st.name,
                    order: st.order,
                    status: st.status || 0
                }))
            } else if (hasSubtaskChanged(st)) {
                // Only update if subtask actually changed
                promises.push(updateSubTask(st.id, { name: st.name, status: st.status }))
            }
        }
        
        // Run all operations in parallel
        if (promises.length > 0) {
            await Promise.all(promises)
            // Only refresh if we made changes
            await Promise.all([
                getTask(props.taskId),
                getSubTasks(props.taskId)
            ])
        }
        
        // Clear edit state
        editSubTasks.value = []
        originalSubTasks.value = []
        deletedSubTaskIds.value = []
        isFlipped.value = false
    } finally {
        isSaving.value = false
    }
}

function addSubtask() {
    editSubTasks.value.push({
        id: `temp-${Date.now()}`,
        name: '',
        order: editSubTasks.value.length,
        status: 0,
        isNew: true
    })
}

function removeSubtask(index) {
    const subtask = editSubTasks.value[index]
    // If it's an existing subtask, mark for deletion
    if (subtask && !subtask.isNew && subtask.id) {
        deletedSubTaskIds.value.push(subtask.id)
    }
    editSubTasks.value.splice(index, 1)
    // Re-index order
    editSubTasks.value.forEach((st, idx) => {
        st.order = idx
    })
}

// Toggle subtask status on front card (immediate save)
async function handleToggleSubtask(subtask) {
    const newStatus = subtask.status ? 0 : 1
    await toggleSubTaskStatus(subtask.id, subtask.status)
    // Refresh subtasks to get updated order
    await getSubTasks(props.taskId)
}

// Toggle subtask status in edit mode (local only, saved on Save)
function toggleEditSubtaskStatus(index) {
    const subtask = editSubTasks.value[index]
    subtask.status = subtask.status ? 0 : 1
}

function formatDate(dateString) {
    if (!dateString) return ''
    
    // Parse date string as local date (avoids timezone issues with YYYY-MM-DD format)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return ''
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    // Relative dates for nearby days
    const relativeDates = {
        '-1': 'Gestern',
        '0': 'Heute',
        '1': 'Morgen',
        '2': 'Übermorgen'
    }
    
    if (relativeDates[diffDays] !== undefined) {
        return relativeDates[diffDays]
    }
    
    // Show weekday for dates within the next 7 days
    if (diffDays > 0 && diffDays <= 7) {
        return date.toLocaleDateString('de-CH', { weekday: 'long' })
    }
    
    // Full date for everything else
    return date.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

function formatTime(timeString) {
    if (!timeString) return ''
    const parts = timeString.split(':')
    if (parts.length < 2) return timeString
    return `${parts[0]}:${parts[1]} Uhr`
}

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

.subtasks-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    touch-action: pan-y;
}
</style>
