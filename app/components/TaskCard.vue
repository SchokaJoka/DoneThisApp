<template>
    <div :style="{ transform: `rotate(${rotation}deg)` }" :class="[colorClass, 'border-2 sticky top-4 flex mb-200 flex-col place-content-between items-center w-full p-5 py-10 text-black min-h-[500px] rounded-sm shadow-sm']">
        <div class="w-full">
            <h3 class="text-2xl font-bold text-center">
                {{ task.name || 'Untitled Task' }}
            </h3>
        </div>
        <div v-if="task.description" class="w-full">
            <span class="text-sm text-left text-black">
                {{ task.description }}
            </span>
        </div>
        <div v-if="task.due_date" class="w-full">
            <span class="text-sm text-left text-black">
                {{ formatDate(task.due_date) }}
                <span v-if="task.due_time"> {{ task.due_time }}</span>
            </span>
        </div>


            <!-- <button
                @click="$emit('delete', task.id)"
                aria-label="Delete task"
            >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
            </button> -->
        <div class="flex w-full justify-between">
            <div>
                <button @click="$emit('edit', task.id)" :class="['flex px-4 py-2 rounded-full', buttonClass]">
                    bearbeiten
                </button>
            </div>
            <div>
                <button @click="" :class="['flex px-4 py-2 rounded-full', buttonClass]">
                    fokussieren
                </button>
            </div>
            
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    task: {
        type: Object,
        required: true
    },
    // rotation range (degrees)
    minRotation: {
        type: Number,
        default: -2
    },
    maxRotation: {
        type: Number,
        default: 2
    }
})

const rotation = ref(0)

// color style options (Tailwind classes) — each option includes a card and a matching button style
const colorOptions = [
    { card: 'bg-blue-100 text-black border-blue-200', button: 'bg-orange-200 text-black' },
    { card: 'bg-red-100 text-black border-red-200', button: 'bg-green-200 text-black' },
    { card: 'bg-yellow-100 text-black border-yellow-200', button: 'bg-violet-200 text-black' }
]
const colorClass = ref(colorOptions[0].card)
const buttonClass = ref(colorOptions[0].button)

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