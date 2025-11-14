<template>
    <div class="w-full h-[60vh] perspective-1000">
        <div 
            class="relative w-full h-full transition-transform duration-700 transform-style-3d"
            :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
            <!-- Front of card -->
            <div class="absolute inset-0 backface-hidden flex flex-col justify-between items-start bg-[url(assets/img/bg-card/yellow-circle.png)] bg-cover p-[11px] rounded-[21px]" :class="colorClass" :style="{ transform: `rotate(${rotation}deg)` }">
        
                <div class="w-full flex flex-col items-start gap-[11px]">
                    <div class="w-full flex h-[40px] justify-between self-stretch ">
                        <button class="flex px-[17px] justify-center items-center rounded-[10px] bg-orange-100">
                            <span class="text-md font-[600] text-orange-500">
                                Kategorie
                            </span>
                        </button>
                        <button v-if="task.due_date" class="flex px-[17px] justify-center items-center rounded-[10px] bg-orange-100 gap-[4px]">
                            <div class="size-[24px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <g clip-path="url(#clip0_2249_2344)">
                                        <path d="M5 13C5 13.9193 5.18106 14.8295 5.53284 15.6788C5.88463 16.5281 6.40024 17.2997 7.05025 17.9497C7.70026 18.5998 8.47194 19.1154 9.32122 19.4672C10.1705 19.8189 11.0807 20 12 20C12.9193 20 13.8295 19.8189 14.6788 19.4672C15.5281 19.1154 16.2997 18.5998 16.9497 17.9497C17.5998 17.2997 18.1154 16.5281 18.4672 15.6788C18.8189 14.8295 19 13.9193 19 13C19 12.0807 18.8189 11.1705 18.4672 10.3212C18.1154 9.47194 17.5998 8.70026 16.9497 8.05025C16.2997 7.40024 15.5281 6.88463 14.6788 6.53284C13.8295 6.18106 12.9193 6 12 6C11.0807 6 10.1705 6.18106 9.32122 6.53284C8.47194 6.88463 7.70026 7.40024 7.05025 8.05025C6.40024 8.70026 5.88463 9.47194 5.53284 10.3212C5.18106 11.1705 5 12.0807 5 13Z" stroke="#F72900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M12 10V13H14" stroke="#F72900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M7 4L4.25 6" stroke="#F72900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M17 4L19.75 6" stroke="#F72900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_2249_2344">
                                            <rect width="24" height="24" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <span class="text-md font-[600] font-display text-red-600">
                                {{ formatDate(task.due_date) }}
                                <span v-if="task.due_time"> {{ task.due_time }}</span>
                            </span>
                        </button>
                    </div>
                    <div class="w-full">
                        <h1 class="text-[24px] font-[500] text-left">
                        {{ task.name || 'Untitled Task' }}
                        </h1>
                    </div>
                    <div class="w-full">
                        <p class="text-[20px] font-[300] text-left">
                        {{ task.description  || 'No description provided' }}
                        </p>
                    </div>
                </div>
                <div class="w-full">
                    <div v-if="parsedSubtasks.length > 0" class="w-full space-y-1">
                        <div v-for="(subtask, index) in parsedSubtasks" 
                             :key="index"
                             class="w-full px-[17px] py-[11px] bg-orange-100 rounded-[10px] flex items-start gap-2"
                        >
                            <label
                                :for="`subtask-${task.id}-${index}`"
                                class="flex items-center gap-3 w-full cursor-pointer rounded-md transition-colors focus-within:ring-2 focus-within:ring-orange-300"
                            >
                                <input
                                    type="checkbox"
                                    :id="`subtask-${task.id}-${index}`"
                                    class="sr-only"
                                    :checked="subtask.done"
                                    @change="toggleSubtask(index)"
                                />
                                <span
                                    class="w-5 h-5 flex items-center justify-center rounded-md border-2 transition-all"
                                    :class="subtask.done
                                        ? 'bg-orange-500 border-orange-500'
                                        : 'bg-white border-gray-300'"
                                    aria-hidden="true"
                                >
                                    <svg v-if="subtask.done" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8.5 12.086 4.707 8.293a1 1 0 10-1.414 1.414l4.5 4.5a1 1 0 001.414 0l7.5-7.5a1 1 0 000-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span class="text-sm flex-1" :class="{ 'line-through opacity-60': subtask.done }">
                                    {{ subtask.text }}
                                </span>
                            </label>
                        </div>
                    </div>  
                </div>
                <div class="w-full flex justify-center gap-[7px]">
                    <button @click.stop="isFlipped = true" class="flex px-[17px] py-[11px] bg-orange-100 rounded-[10px]">
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
                    <button @click="$emit('delete', task.id)" class="flex px-[17px] py-[11px] bg-orange-100 rounded-[10px]">
                        <div class="size-[24px] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke="#FF8B0A" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </button>
                    <button class="flex px-[17px] py-[11px] bg-orange-100 rounded-[10px]">
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
                    <button class="flex w-full justify-center items-center self-stretch py-[11px] bg-orange-100 rounded-[10px]">
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
import { ref, onMounted, computed } from 'vue'

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

const emit = defineEmits(['subtask-toggle', 'delete', 'save'])

const rotation = ref(0)
const isFlipped = ref(false)
const editForm = ref({
    name: '',
    description: '',
    due_date: '',
    due_time: '',
    subtasks: []
})

const colorOptions = [
    { card: 'bg-blue-100 border-blue-200 text-black', button: 'bg-blue-300 text-black' },
    { card: 'bg-red-100 border-red-200 text-black', button: 'bg-green-300 text-black' },
    { card: 'bg-yellow-100 border-yellow-200 text-black', button: 'bg-yellow-300 text-black' }
]
const colorClass = ref(colorOptions[0].card)
const buttonClass = ref(colorOptions[0].button)

const parsedSubtasks = computed(() => {
    if (!props.task.subtasks || !Array.isArray(props.task.subtasks)) {
        return []
    }
    
    return props.task.subtasks.map(item => {
        try {
            if (typeof item === 'string') {
                return JSON.parse(item)
            }
            return item
        } catch {
            return { text: item, done: false }
        }
    })
})

function toggleSubtask(index) {
    emit('subtask-toggle', { taskId: props.task.id, subtaskIndex: index })
}

function addSubtask() {
    editForm.value.subtasks.push({ text: '', done: false })
}

function removeSubtask(index) {
    editForm.value.subtasks.splice(index, 1)
}

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

function saveEdit() {
    emit('save', {
        taskId: props.task.id,
        updates: {
            name: editForm.value.name,
            description: editForm.value.description,
            due_date: editForm.value.due_date || null,
            due_time: editForm.value.due_time || null,
            subtasks: editForm.value.subtasks
                .filter(st => st.text.trim() !== '')
                .map(st => JSON.stringify(st))
        }
    })
    isFlipped.value = false
}

onMounted(() => {
    if (props.enableRotation) {
        const t = Math.random()
        rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
    }
    const choice = colorOptions[Math.floor(Math.random() * colorOptions.length)]
    colorClass.value = choice.card
    buttonClass.value = choice.button
    
    editForm.value = {
        name: props.task.name || '',
        description: props.task.description || '',
        due_date: props.task.due_date || '',
        due_time: props.task.due_time || '',
        subtasks: parsedSubtasks.value.map(st => ({ ...st }))
    }
})

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
    perspective: 1000px;
}

.transform-style-3d {
    transform-style: preserve-3d;
}

.backface-hidden {
    backface-visibility: hidden;
}
</style>
