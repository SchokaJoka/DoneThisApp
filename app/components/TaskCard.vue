<template>
    <div class="rounded-xl p-6 border-2 border-black flex flex-col">
        <span class="text-xl font-bold mb-3">{{ task.name }}</span>
        <div class="flex flex-row items-center mb-2" v-for="(value, key) in task" :key="key">
            <span class="font-semibold text-red-700 mr-2">{{ key }}</span>
            <span class="text-slate-700">{{ value }}</span>
        </div>
        <div class="flex items-center gap-2">
            <button
                @click="$emit('edit', task.id)"
                class="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
                aria-label="Edit task"
            >
            Edit
            </button>
        </div>
    </div>
</template>

<script setup >
    defineProps({
        task: {
            type: Object,
            required: true
        }
    })
</script>