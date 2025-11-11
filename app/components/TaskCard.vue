<template>
    <div
        :style="{ transform: `rotate(${rotation}deg)` }"
        :class="[colorClass, 'border-2 flex flex-col items-center self-stretch max-w-[400px] min-h-[500px] px-[20px] py-[30px] gap-[98.7px] rotate-[1.956deg]']"
    >
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

        <div class="flex w-full justify-between">
            <div>
                <button @click="$emit('edit', task.id)" class="flex px-4 py-2 bg-orange-100 rounded-full">
                    bearbeiten
                </button>
            </div>
            <div>
                <button @click="" class="flex px-4 py-2 bg-orange-100 rounded-full">
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
        default: -3
    },
    maxRotation: {
        type: Number,
        default: 3
    }
})

const rotation = ref(0)

// color style options (Tailwind classes) — each option includes a card and a matching button style
const colorOptions = [
    { card: 'bg-blue-100 border-blue-200 text-black', button: 'bg-blue-300 text-black' },
    { card: 'bg-red-100 border-red-200 text-black', button: 'bg-green-300 text-black' },
    { card: 'bg-yellow-100 border-yellow-200 text-black', button: 'bg-yellow-300 text-black' }
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