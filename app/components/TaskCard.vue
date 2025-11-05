<template>
    <div class="rounded-xl p-6 border-2 border-black flex flex-col bg-orange-100">
        <div v-for="(value, key) in task" :key="key" class="mb-2">
            <template v-if="key === 'name'">
            <span class="text-xl font-bold block">{{ value }}</span>
            </template>
            <template v-else>
            <div class="flex flex-row items-center">
                <span class="font-semibold text-red-700 mr-2">{{ key }}</span>
                <span class="text-slate-700">{{ value }}</span>
            </div>
            </template>
        </div>

        <div class="flex items-center gap-2">
            <button
            @click="$emit('edit', task.id)"
            class="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
            aria-label="Edit task"
            >
            Edit
            </button>
            <button
            @click="$emit('delete', task.id)"
            class="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
            aria-label="Delete task"
            >
            Delete
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