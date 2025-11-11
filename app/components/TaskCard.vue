<template>
    <div class="bg-blue-100 w-[320px] h-[480px] flex flex-col justify-between border-2 px-[12px] py-[35px] rounded-lg" :class="colorClass" :style="{ transform: `rotate(${rotation}deg)` }">
        <div class="w-full">
            <h3 class="text-xl font-bold mb-2 text-center">
            {{ task.name || 'Untitled Task' }}
            </h3>
        </div>
        <div v-if="task.description" class="">
            <span class="text-sm">
                {{ task.description }}
            </span>
        </div>

        <div v-if="parsedSubtasks.length > 0" class="w-full space-y-1">
            <div 
                v-for="(subtask, index) in parsedSubtasks" 
                :key="index"
                class="flex items-start gap-2"
            >
                <input 
                    type="checkbox" 
                    :checked="subtask.done"
                    @change="toggleSubtask(index)"
                    class="mt-0.5 cursor-pointer"
                />
                <span class="text-xs" :class="{ 'line-through opacity-60': subtask.done }">
                    {{ subtask.text }}
                </span>
            </div>
        </div>        <div>
            <div v-if="task.due_date" class="">
                <span class="">
                    {{ formatDate(task.due_date) }}
                    <span v-if="task.due_time"> {{ task.due_time }}</span>
                </span>
            </div>
            <div class="flex flex-row justify-between mt-4 gap-2">
                <div>
                    <button @click="$emit('edit', task.id)" class="flex px-4 py-2 bg-orange-100 rounded-full">
                        bearbeiten
                    </button>
                </div>
                <div>
                    <button @click="$emit('delete', task.id)" class="flex items-center justify-center w-10 h-10 bg-red-100 hover:bg-red-200 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div>
                    <button @click="" class="flex px-4 py-2 bg-orange-100 rounded-full">
                        fokussieren
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
    // rotation range (degrees)
    minRotation: {
        type: Number,
        default: -6
    },
    maxRotation: {
        type: Number,
        default: 6
    }
})

const emit = defineEmits(['subtask-toggle', 'edit', 'delete'])

const rotation = ref(0)

// color style options (Tailwind classes) — each option includes a card and a matching button style
const colorOptions = [
    { card: 'bg-blue-100 border-blue-200 text-black', button: 'bg-blue-300 text-black' },
    { card: 'bg-red-100 border-red-200 text-black', button: 'bg-green-300 text-black' },
    { card: 'bg-yellow-100 border-yellow-200 text-black', button: 'bg-yellow-300 text-black' }
]
const colorClass = ref(colorOptions[0].card)
const buttonClass = ref(colorOptions[0].button)

// Parse subtasks from the database array format
const parsedSubtasks = computed(() => {
    if (!props.task.subtasks || !Array.isArray(props.task.subtasks)) {
        return []
    }
    
    return props.task.subtasks.map(item => {
        try {
            // If item is a string, try to parse it as JSON
            if (typeof item === 'string') {
                return JSON.parse(item)
            }
            // If it's already an object, use it directly
            return item
        } catch {
            // If parsing fails, treat it as a plain text subtask (not done)
            return { text: item, done: false }
        }
    })
})

function toggleSubtask(index) {
    emit('subtask-toggle', { taskId: props.task.id, subtaskIndex: index })
}

// pick a random rotation on the client only to avoid SSR hydration mismatches
onMounted(() => {
    const t = Math.random()
    rotation.value = props.minRotation + t * (props.maxRotation - props.minRotation)
    // pick a random color style on the client (card + matching button)
    const choice = colorOptions[Math.floor(Math.random() * colorOptions.length)]
    colorClass.value = choice.card
    buttonClass.value = choice.button
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
