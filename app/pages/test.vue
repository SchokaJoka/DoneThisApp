<template>
    <ul v-if="tasks">
        <li v-for="task in tasks" :key="task.id" class="mb-2 p-4 border rounded shadow">
            <h3 class="font-bold text-lg">{{ task.name }}</h3>
            <p v-if="task.description">{{ task.description }}</p>
        </li>
    </ul>
</template>

<script setup>

const { loading, error, tasks, getTasks } = useTasks()

onMounted(getTasks)
</script>