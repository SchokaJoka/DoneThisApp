<template>
    <div :class="{ completing: isCompleting }" class="perspective-1000 w-full flex justify-center items-center">
        <div 
            class="transition-transform ease-in-out duration-300 transform-style-3d w-full flex justify-center items-center"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card -->
            <div class="w-full max-w-[370px] h-[500px] max-h-[75vh] backface-hidden py-4 px-6 flex flex-col justify-between items-center bg-cover bg-center rounded-2xl bg-bg-fill" :style="{ transform: `rotate(${rotation}deg)`, backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none'  }">

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
                    <div 
                        v-if="subTasks && subTasks.length > 0" 
                        ref="subtasksContainer"
                        class="subtasks-scroll w-full flex-1 min-h-0 overflow-y-auto"
                        @touchstart.passive="onTouchStart"
                        @touchmove.prevent="onTouchMove"
                    >
                        <div class="flex flex-col gap-4 pb-2">
                            <div 
                                v-for="subtask in sortedSubTasks" 
                                :key="subtask.id" 
                                class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
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
                    <button @click.stop="completeTask" class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
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
                    <button @click.stop="focusTask" class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg">
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

            <!-- Completion overlay: simple text animation -->
            <div v-if="isCompleting" class="complete-overlay">
                <div class="complete-text" aria-hidden>You did it!</div>
            </div>

            <!-- Focus warning overlay -->
            <Transition name="fade">
                <div 
                    v-if="showFocusWarning" 
                    class="fixed bg-bg-overlay w-full max-w-[370px] h-[600px] max-h-[75vh] pt-4 px-6 pb-4 flex flex-col justify-center items-center rounded-2xl"
                    @click.stop="showFocusWarning = false"
                >
                    <div class="bg-bg p-4 rounded-xl text-center" @click.stop>
                        <div class="text-4xl mb-4">🎯</div>
                        <h3 class="text-2xl font-semibold text-text-primary mb-2">Du hast bereits eine Aufgabe im Fokus</h3>
                        <h3 class="text-text-primary text-lg mb-4">Versuche nicht, alles gleichzeitig zu machen.</h3> 
                        <button 
                            @click.stop="showFocusWarning = false"
                            class="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                        >
                            Verstanden
                        </button>
                    </div>
                </div>
            </Transition>

            <!-- Back of card (Edit form) -->
            <EditCard 
                :task="task"
                :sub-tasks="subTasks"
                :category-colors="categoryColors"
                @cancel="cancelEdit"
                @save="onEditSaved"
                @delete="onEditDeleted"
            />
        </div>
    </div>
</template>

<script setup>
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

const { tasks, task: taskRef, updateTask, getTasks, getTask, getHasFocus, hasTaskInFocus } = useTasks()

// Prefer the task from the tasks array so changes to `tasks` propagate here.
const task = computed(() => {
    const found = tasks.value && tasks.value.find(t => t.id === props.taskId)
    return found || taskRef.value || {}
})
const { loadingGroups, errorGroups, groups, getGroups, getGroup} = useGroups()
const { categories } = useCategories()
const { userCategories } = useUserCategories()
const { getSubTasks, subTasks, toggleSubTaskStatus } = useSubTasks()


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
const showFocusWarning = ref(false)
const subtasksContainer = ref(null)
const isCompleting = ref(false)
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
    if (isCompleting.value) return
    isCompleting.value = true
    // wait for the text animation to play
    await new Promise((res) => setTimeout(res, 800))
    await updateTask(task.value.id, { status: 2 })
    // Remove from local tasks array
    tasks.value = tasks.value.filter(t => t.id !== task.value.id)
    await getTasks()
    isCompleting.value = false
    navigateTo('/archive')
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


const categoryColors = computed(() => {
  if (!task.value.category_id) {
    return { color: "#E8E8E8", color_light: "#FFFEEB", color_dark: "#C2C2C2" };
  }
  const category = categories.value.find(
    (cat) => cat.id === task.value.category_id
  );
  if (!category) {
    return { color: "#E8E8E8", color_light: "#FFFEEB", color_dark: "#C2C2C2" };
  }
  return {
    color: category.color,
    color_light: category.color_light,
    color_dark: category.color_dark,
  };
});
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
    overscroll-behavior-y: contain;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Completion animation styles */
.perspective-1000 {
    position: relative;
}
.perspective-1000.completing {
    pointer-events: none;
}
.complete-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}


/* Text completion animation */
.complete-text {
    font-size: 30px;
    font-weight: 700;
    color: #fff;
    padding: 18px 28px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(0,0,0,1), rgba(0,0,0,1));
    box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    transform: translateY(8px) scale(0.95) rotate(-4deg);
    animation: pop-text 800ms cubic-bezier(.16,.84,.24,1) forwards;
}

@keyframes pop-text {
    0% { opacity: 0; transform: translateY(20px) scale(0.9) }
    40% { opacity: 1; transform: translateY(-6px) scale(1.06) }
    100% { opacity: 1; transform: translateY(0px) scale(1) }
}
</style>
