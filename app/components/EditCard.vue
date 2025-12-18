<template>
    <div 
        class="w-full max-w-[370px] h-[600px] max-h-[75vh] overflow-x-hidden overflow-y-auto flex flex-col justify-between items-start py-4 px-4 rounded-2xl" 
        :class="isBackOfCard ? 'absolute backface-hidden' : ''"
        :style="{ 
            transform: isBackOfCard ? 'rotateY(180deg)' : 'none', 
            backgroundColor: categoryColors.color 
        }"
    >
        <div class="w-full h-full flex flex-col gap-4 rounded-lg overflow-y-auto mb-2"> 
            
            <div class="flex flex-row gap-2 w-full">
                <div class="w-full">
                    <select
                        v-model="localCategoryUserName"
                        class="w-full p-4 rounded-lg text-sm"
                        :style="{ backgroundColor: categoryColors.color_light }"
                    >
                        <option value="" disabled selected>Kategorie</option>
                        <option v-for="(name, key) in categoryOptions" :key="key" :value="name">{{ name }}</option>
                    </select>
                </div>

                <div class="w-full max-w-[60%]">
                    <input
                        v-model="dateTimeLocal"
                        type="datetime-local"
                        class="w-full p-4 rounded-lg outline-none text-sm"
                        :style="{ backgroundColor: categoryColors.color_light }"
                    />
                </div>
            </div>

            <div>
                <input
                    v-model="localEditForm.name"
                    type="text"
                    class="w-full p-4 rounded-lg outline-none"
                    :style="{ 
                        backgroundColor: categoryColors.color_light
                    }"
                />
            </div>

            <div>
                <textarea
                    v-model="localEditForm.description"
                    rows="3"
                    class="w-full p-4 rounded-lg outline-none"
                    :style="{ 
                        backgroundColor: categoryColors.color_light
                    }"
                />
            </div>

            <div>
                <div class="space-y-2">
                    <div v-for="subtask in sortedEditSubTasks" :key="subtask.id" class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            :checked="subtask.status"
                            @change="toggleEditSubtaskStatus(subtask.originalIndex)"
                            class="w-5 h-5 shrink-0 cursor-pointer"
                            :style="{ 
                                backgroundColor: categoryColors.color_light,
                                accentColor: categoryColors.color_dark 
                            }"

                        />
                        <input
                            v-model="localEditSubTasks[subtask.originalIndex].name"
                            type="text"
                            placeholder="Subtask name..."
                            class="w-full p-4 rounded-lg outline-none"
                            :style="{ 
                                backgroundColor: categoryColors.color_light
                            }"
                            :class="{ 'line-through text-gray-400': subtask.status }"
                        />
                        <button @click.stop="removeSubtask(subtask.originalIndex)" :style="{ backgroundColor: categoryColors.color_dark}" class="cursor-pointer p-4 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="stroke-text-primary" fill="none">
                                <g clip-path="url(#clip0_2767_11732)">
                                    <path d="M4 7H20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10 11V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14 11V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_2767_11732">
                                    <rect width="24" height="24"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </button>
                    </div>
                    <button @click.stop="addSubtask" class="w-full p-4 rounded-lg outline-none" :style="{ backgroundColor: categoryColors.color_dark}">
                        + Add subtask
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-row justify-between items-center w-full mb-4 gap-4">
            <button @click.stop="$emit('cancel')" class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
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
    categoryColors: {
        type: Object,
        required: true
    },
    isBackOfCard: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['cancel', 'save', 'delete'])

const { updateTask, deleteTask, tasks, getTask, getTasks } = useTasks()
const { createSubTask, createSubTasks, updateSubTask, deleteSubTask, getSubTasks } = useSubTasks()

// categories and user display names (for the select)
const { categories } = useCategories()
const { userCategories } = useUserCategories()

const categoryOptions = computed(() => {
    const options = {}
    if (userCategories.value) {
        Object.keys(userCategories.value).forEach((key) => {
            if (key.endsWith('_name')) {
                const colorKey = key.replace('_name', '')
                options[colorKey] = userCategories.value[key]
            }
        })
    }
    return options
})

// local select value (display name). This mirrors taskcreator's `categoryUserName` behavior.
const localCategoryUserName = ref('')

// Local edit state (declared early so watchers can reference it)
const localEditForm = ref({
    name: '',
    description: '',
    due_date: '',
    due_time: ''
})

// ensure localEditForm includes category fields
if (!localEditForm.value.categoryName) localEditForm.value.categoryName = ''
if (!localEditForm.value.category_id) localEditForm.value.category_id = ''

// when select changes, update localEditForm.categoryName (color key) similar to taskcreator
watch(() => localCategoryUserName.value, (newVal) => {
    if (!newVal) {
        localEditForm.value.categoryName = ''
        return
    }

    // if the selected value matches a key in categoryOptions (i.e. user chose the color key display), use it
    if (categoryOptions.value && categoryOptions.value[newVal]) {
        localEditForm.value.categoryName = newVal
        return
    }

    // otherwise try to find the color key by matching the display name
    const colorKey = Object.entries(categoryOptions.value).find(
        ([key, name]) => name && name.toLowerCase() === newVal.toLowerCase()
    )?.[0]

    if (!colorKey) {
        localEditForm.value.categoryName = ''
        return
    }

    localEditForm.value.categoryName = colorKey
})

// keep a category_id in sync when categoryName changes
watch(() => localEditForm.value.categoryName, (newName) => {
    if (!newName) {
        localEditForm.value.category_id = ''
        return
    }
    const cat = categories.value.find(c => c.name === newName)
    localEditForm.value.category_id = cat?.id || ''
})

const isSaving = ref(false)
const deleteConfirm = ref(false)

// Combined datetime for the input (matches taskcreator behavior)
const dateTimeLocal = computed({
    get() {
        if (!localEditForm.value.due_date) return ''
        const date = localEditForm.value.due_date
        const time = localEditForm.value.due_time || '00:00'
        return `${date}T${time}`
    },
    set(value) {
        if (!value) {
            localEditForm.value.due_date = ''
            localEditForm.value.due_time = ''
            return
        }
        const [date, time] = value.split('T')
        localEditForm.value.due_date = date
        localEditForm.value.due_time = time
    }
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
            due_time: newTask.due_time || '',
            categoryName: newTask.categoryName || '',
            category_id: newTask.category_id || newTask.categoryId || ''
        }

        // initialize select display name from userCategories mapping if available
        const displayName = userCategories.value?.[`${localEditForm.value.categoryName}_name`]
        localCategoryUserName.value = displayName || localEditForm.value.categoryName || ''
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
           localEditForm.value.due_time !== (props.task.due_time || '') ||
           localEditForm.value.category_id !== (props.task.category_id || props.task.categoryId || '')
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
            const updates = {
                name: localEditForm.value.name,
                description: localEditForm.value.description,
                due_date: localEditForm.value.due_date,
                due_time: localEditForm.value.due_time,
            }
            if (localEditForm.value.category_id) updates.category_id = localEditForm.value.category_id
            promises.push(updateTask(props.task.id, updates))
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
                getTasks(),
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
