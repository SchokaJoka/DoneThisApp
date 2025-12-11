<template>
    <div 
        class="w-full max-w-[370px] h-[600px] max-h-[75vh] flex flex-col justify-between items-start py-4 px-6 rounded-2xl" 
        :class="isBackOfCard ? 'absolute backface-hidden' : ''"
        :style="{ 
            transform: isBackOfCard ? 'rotateY(180deg)' : 'none', 
            backgroundColor: categoryColor 
        }"
    >
        <div class="w-full h-full overflow-y-auto space-y-4 pb-4">
            <h2 class="text-xl font-semibold mb-4">Edit Task</h2>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                <input
                    v-model="localEditForm.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                    v-model="localEditForm.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                        v-model="localEditForm.due_date"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                    <input
                        v-model="localEditForm.due_time"
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
                            v-model="localEditSubTasks[subtask.originalIndex].name"
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

        <div class="flex flex-row justify-between items-center w-full mb-4 gap-4">
            <button @click.stop="$emit('cancel')" class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
                Cancel
            </button>
            <button 
                @click.stop="confirmDelete" 
                class="flex w-full justify-center cursor-pointer p-4 rounded-lg transition-colors duration-300"
                :class="deleteConfirm ? 'bg-red-500 text-white' : 'bg-bg'"
            >
                {{ deleteConfirm ? 'Sure?' : 'Delete' }}
            </button>
            <button 
                @click.stop="handleSave" 
                :disabled="isSaving"
                class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg"
            >
                <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="stroke-text-primary">
                    <g clip-path="url(#clip0_2523_8899)">
                        <path d="M5 12L10 17L20 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_2523_8899">
                            <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>

                <svg v-if="isSaving" class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    task: {
        type: Object,
        required: true
    },
    subTasks: {
        type: Array,
        default: () => []
    },
    categoryColor: {
        type: String,
        default: '#FFF7ED'
    },
    isBackOfCard: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['cancel', 'save', 'delete'])

const { updateTask, deleteTask, tasks, getTask } = useTasks()
const { createSubTask, createSubTasks, updateSubTask, deleteSubTask, getSubTasks } = useSubTasks()

const isSaving = ref(false)
const deleteConfirm = ref(false)

// Local edit state
const localEditForm = ref({
    name: '',
    description: '',
    due_date: '',
    due_time: ''
})

const localEditSubTasks = ref([])
const deletedSubTaskIds = ref([])
const originalSubTasks = ref([])

// Initialize form when task changes
watch(() => props.task, (newTask) => {
    if (newTask) {
        localEditForm.value = {
            name: newTask.name || '',
            description: newTask.description || '',
            due_date: newTask.due_date || '',
            due_time: newTask.due_time || ''
        }
    }
}, { immediate: true })

// Initialize subtasks when they change
watch(() => props.subTasks, (newSubTasks) => {
    if (newSubTasks) {
        localEditSubTasks.value = newSubTasks.map(st => ({ ...st }))
        originalSubTasks.value = newSubTasks.map(st => ({ ...st }))
        deletedSubTaskIds.value = []
    }
}, { immediate: true })

// Sort edit subtasks: incomplete first, then completed (with original index preserved)
const sortedEditSubTasks = computed(() => {
    if (!localEditSubTasks.value) return []
    return localEditSubTasks.value
        .map((st, index) => ({ ...st, originalIndex: index }))
        .sort((a, b) => {
            if (a.status !== b.status) return a.status - b.status
            return (a.order ?? 0) - (b.order ?? 0)
        })
})

// Check if task fields have changed
function hasTaskChanged() {
    return localEditForm.value.name !== (props.task.name || '') ||
           localEditForm.value.description !== (props.task.description || '') ||
           localEditForm.value.due_date !== (props.task.due_date || '') ||
           localEditForm.value.due_time !== (props.task.due_time || '')
}

// Check if a subtask has changed compared to original
function hasSubtaskChanged(editedSt) {
    if (editedSt.isNew) return true
    const original = originalSubTasks.value.find(st => st.id === editedSt.id)
    if (!original) return true
    return editedSt.name !== original.name || editedSt.status !== original.status
}

async function handleSave() {
    if (isSaving.value) return
    isSaving.value = true
    
    try {
        const promises = []
        
        // Only update main task if something changed
        if (hasTaskChanged()) {
            promises.push(updateTask(props.task.id, {
                name: localEditForm.value.name,
                description: localEditForm.value.description,
                due_date: localEditForm.value.due_date,
                due_time: localEditForm.value.due_time,
            }))
        }
        
        // Delete removed subtasks
        for (const id of deletedSubTaskIds.value) {
            promises.push(deleteSubTask(id))
        }
        
        // Collect new subtasks for batch creation
        const newSubTasks = localEditSubTasks.value.filter(st => st.isNew && st.name && st.name.trim())
        
        // Update existing subtasks (only if changed)
        for (const st of localEditSubTasks.value) {
            if (!st.isNew && hasSubtaskChanged(st)) {
                promises.push(updateSubTask(st.id, { name: st.name, status: st.status }))
            }
        }
        
        // Run delete and update operations in parallel
        if (promises.length > 0) {
            await Promise.all(promises)
        }
        
        // Batch create new subtasks
        if (newSubTasks.length > 0) {
            await createSubTasks(props.task.id, newSubTasks)
        }
        
        // Refresh data if we made changes
        if (promises.length > 0 || newSubTasks.length > 0) {
            await Promise.all([
                getTask(props.task.id),
                getSubTasks(props.task.id)
            ])
        }
        
        // Clear edit state
        localEditSubTasks.value = []
        originalSubTasks.value = []
        deletedSubTaskIds.value = []
        
        emit('save')
    } finally {
        isSaving.value = false
    }
}

async function handleDelete() {
    const taskId = props.task.id
    await deleteTask(taskId)
    // Remove from local tasks array
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    deleteConfirm.value = false
    emit('delete')
}

function confirmDelete() {
    if (deleteConfirm.value) {
        handleDelete()
    } else {
        deleteConfirm.value = true
        // Reset after 3 seconds if not confirmed
        setTimeout(() => { deleteConfirm.value = false }, 3000)
    }
}

function addSubtask() {
    localEditSubTasks.value.push({
        id: `temp-${Date.now()}`,
        name: '',
        order: localEditSubTasks.value.length,
        status: 0,
        isNew: true
    })
}

function removeSubtask(index) {
    const subtask = localEditSubTasks.value[index]
    // If it's an existing subtask, mark for deletion
    if (subtask && !subtask.isNew && subtask.id) {
        deletedSubTaskIds.value.push(subtask.id)
    }
    localEditSubTasks.value.splice(index, 1)
    // Re-index order
    localEditSubTasks.value.forEach((st, idx) => {
        st.order = idx
    })
}

// Toggle subtask status in edit mode (local only, saved on Save)
function toggleEditSubtaskStatus(index) {
    const subtask = localEditSubTasks.value[index]
    subtask.status = subtask.status ? 0 : 1
}
</script>

<style scoped>
.backface-hidden {
    backface-visibility: hidden;
}
</style>
