<template>
    <div
        class="relative rounded-2xl overflow-hidden bg-cover bg-center bg-no-repeat py-4 px-4"
        :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'url(/img/default.webp)' }"
    >
        <div class="relative flex flex-col gap-1">
            <h2 class="overflow-hidden text-2xl font-primary">{{ task.name }}</h2>
            <div class="flex flex-col gap-4 marker:text-text-primary marker:opacity-95">
                <div v-for="sub in sortedSubTasks" :key="sub.id || sub._id || sub.name" class="w-full text-text-primary text-xs overflow-hidden rounded-lg">
                    {{ sub.name || sub.title || sub }}
                </div>
            </div>
            <div class="mt-3 flex justify-end">
                <button
                    @click.stop="resetTask"
                    :disabled="isResetting"
                    class="px-3 py-2 rounded-lg bg-bg hover:bg-bg/90 text-sm"
                >
                    <span v-if="!isResetting">Reset</span>
                    <span v-else>Resetting...</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
const { task, updateTask, getTasks, getTask } = useTasks()
const { groups } = useGroups()
const { categories } = useCategories()
const { getSubTasks, subTasks } = useSubTasks()

const props = defineProps({
    taskId: {
        type: String,
        required: true
    }
})

const category = computed(() => {
    return categories.value.find(cat => cat.id === task.value.category_id) || null
})

const group = computed(() => {
    return groups.value.find(g => g && g.id === task.value.group_id) || null
})

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
    getTask(props.taskId)
    getSubTasks(props.taskId)
})

const backgroundImageUrl = computed(() => {
    const randomNum = Math.floor(Math.random() * 20) + 1
    if (!group.value || !category.value || !group.value.id || !category.value.name) {
        return '/img/default.webp'
    }
    return `/img/bg-card/${group.value.id}/${category.value.name}-${randomNum}.png`
})

const isResetting = ref(false)

async function resetTask() {
    if (!task.value || isResetting.value) return
    isResetting.value = true
    try {
        await updateTask(task.value.id, { status: 0 })
        await getTasks()
        await navigateTo('/mytasks')
    } finally {
        isResetting.value = false
    }
}
</script>