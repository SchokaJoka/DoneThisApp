<template>
    <div
        class="relative rounded-2xl overflow-hidden bg-cover bg-center bg-no-repeat py-4 px-4"
        :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none' }"
    >
        <div class="relative flex flex-col gap-1">
            <h2 class="overflow-hidden text-2xl font-primary">{{ task.name }}</h2>
            <div class="flex flex-col gap-4 marker:text-text-primary marker:opacity-95">
                <div v-for="sub in sortedSubTasks" :key="sub.id || sub._id || sub.name" class="w-full text-text-primary text-xs overflow-hidden rounded-lg">
                    {{ sub.name || sub.title || sub }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const { tasks, task, updateTask, getTasks, getTask, getHasFocus, hasTaskInFocus } = useTasks()
const { loadingGroups, errorGroups, groups, getGroups, getGroup} = useGroups()
const { categories } = useCategories()
const { userCategories } = useUserCategories()
const { getSubTasks, subTasks, toggleSubTaskStatus } = useSubTasks()

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
    return '/img/default.webp'
    try {
        return `/img/bg-card/${group.value.id}/${category.value.name}-${randomNum}.png`
    } catch (e) {
        console.error('Error loading background image:', e)
        return ''
    }
})

const rotation = ref(0)
const isFlipped = ref(false)
const showFocusWarning = ref(false)
const subtasksContainer = ref(null)
let touchStartY = 0
let scrollStartTop = 0

// Recompute rotation if the task id changes (keeps rotation consistent per id)
watch(() => task.value?.id, (id) => {
    if (!props.enableRotation) return
    const seed = String(id || '')
    const t = hashToUnit(seed)
    rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
})

function editTask() {
    isFlipped.value = true
}

function cancelEdit() {
    isFlipped.value = false
}

function onEditSaved() {
    isFlipped.value = false
}

function onEditDeleted() {
    isFlipped.value = false
}

// Toggle subtask status on front card (immediate save)
async function handleToggleSubtask(subtask) {
    const newStatus = subtask.status ? 0 : 1
    await toggleSubTaskStatus(subtask.id, subtask.status)
    // Refresh subtasks to get updated order
    await getSubTasks(props.taskId)
}

// Mark task as complete (status = 2)
async function completeTask() {
    await updateTask(task.value.id, { status: 2 })
    // Remove from local tasks array
    tasks.value = tasks.value.filter(t => t.id !== task.value.id)
}

// Focus on task (status = 1) - only if no other task is focused
async function focusTask() {
    await getHasFocus()
    if (hasTaskInFocus.value) {
        showFocusWarning.value = true
    } else {
        await updateTask(task.value.id, { status: 1 })
        // Remove from local tasks array
        tasks.value = tasks.value.filter(t => t.id !== task.value.id)
        navigateTo('/focus')
    }
    
}

// Touch scroll handlers for iOS
function onTouchStart(e) {
    if (!subtasksContainer.value) return
    touchStartY = e.touches[0].clientY
    scrollStartTop = subtasksContainer.value.scrollTop
}

function onTouchMove(e) {
    if (!subtasksContainer.value) return
    const touchY = e.touches[0].clientY
    const deltaY = touchStartY - touchY
    subtasksContainer.value.scrollTop = scrollStartTop + deltaY
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
<!-- Tailwind utilities are used in the template; no scoped CSS required -->
