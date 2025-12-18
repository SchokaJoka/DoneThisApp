<template>
    <div class="w-full h-full flex justify-center items-center">
        <div
          class="w-full h-full flex flex-col justify-between items-center bg-cover bg-center bg-bg-fill"
          :style="{
            backgroundImage: backgroundImageUrl
              ? `url(${backgroundImageUrl})`
              : 'none',
          }"
        >
            <div v-if="focusedTask && focusedTask.id" class="w-full h-full bg-bg-overlay py-4 px-4 flex justify-center">
                <div class="flex flex-col w-full max-w-[600px]">
                  <div class="flex flex-row justify-between items-center mb-6 shrink-0">
                    <div class="text-white">
                      <span>
                        {{ userCategoryName }}
                      </span>
                    </div>
                    <div v-if="focusedTask.due_date" class="text-white">
                      <span>
                        {{ formatDate(focusedTask.due_date) }}
                        <span v-if="focusedTask.due_time"> {{ formatTime(focusedTask.due_time) }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-4 mb-6">
                    <div class="text-white">
                      <h1>
                        {{ focusedTask.name }}
                      </h1>
                    </div>
                    <div class="text-white">
                      <p>
                        {{ focusedTask.description }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="subTasks && subTasks.length > 0"
                    class="w-full text-white overflow-y-auto max-h-[60vh]"
                  >
                    <TransitionGroup 
                      name="subtask-list" 
                      tag="div" 
                      class="flex flex-col gap-4 pb-2"
                    >
                      <div
                        v-for="(subtask, index) in sortedSubTasks"
                        :key="subtask.id"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300 ease-in-out"
                        :class="subtask.id === focusedSubtaskId ? 'bg-white/10' : ''"
                        @click.stop="focusSubtask(subtask)"
                      >
                        <input
                          type="checkbox"
                          :checked="subtask.status"
                          class="shrink-0 cursor-pointer custom-checkbox transition-all duration-300 ease-in-out"
                          :class="subtask.id === focusedSubtaskId ? 'w-6 h-6' : 'w-4 h-4'"
                          :style="{ accentColor: categoryColors.color }"
                          @click.stop="handleToggleSubtask(subtask)"
                        />
                        <h5 
                          class="transition-all duration-300 ease-in-out"
                          :class="[
                            subtask.status ? 'line-through opacity-50' : '',
                            subtask.id === focusedSubtaskId ? 'text-2xl font-normal' : 'text-sm font-normal'
                          ]"
                        >
                          {{ subtask.name }}
                        </h5>
                      </div>
                    </TransitionGroup>
                  </div>
                </div>
                <div class="fixed bottom-16 left-0 right-0 flex justify-center items-center w-full p-4 gap-4">
                    <div class="w-full max-w-[600px] flex flex-row justify-between items-center gap-4">
                        <button
                            class="flex w-full h-16 justify-center items-center cursor-pointer p-4 rounded-full shadow-md"
                            :style="{ backgroundColor: categoryColors.color_dark}"
                            @click.stop="handlePause"
                        >
                            <div class="size-6 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" :style="{ stroke: categoryColors.color_light }">
                                    <g clip-path="url(#clip0_2565_9049)">
                                        <path d="M6 6C6 5.73478 6.10536 5.48043 6.29289 5.29289C6.48043 5.10536 6.73478 5 7 5H9C9.26522 5 9.51957 5.10536 9.70711 5.29289C9.89464 5.48043 10 5.73478 10 6V18C10 18.2652 9.89464 18.5196 9.70711 18.7071C9.51957 18.8946 9.26522 19 9 19H7C6.73478 19 6.48043 18.8946 6.29289 18.7071C6.10536 18.5196 6 18.2652 6 18V6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M14 6C14 5.73478 14.1054 5.48043 14.2929 5.29289C14.4804 5.10536 14.7348 5 15 5H17C17.2652 5 17.5196 5.10536 17.7071 5.29289C17.8946 5.48043 18 5.73478 18 6V18C18 18.2652 17.8946 18.5196 17.7071 18.7071C17.5196 18.8946 17.2652 19 17 19H15C14.7348 19 14.4804 18.8946 14.2929 18.7071C14.1054 18.5196 14 18.2652 14 18V6Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_2565_9049">
                                            <rect width="24" height="24" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        </button>
                        <button
                            class="flex w-full justify-center cursor-pointer p-4 rounded-full h-16 items-center shadow-md"
                            :style="{ backgroundColor: categoryColors.color_dark}"
                            @click.stop="completeTask"
                        >
                            <div class="size-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" :style="{ stroke: categoryColors.color_light }">
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

                    </div>
                </div>
              </div>
              <div v-else class="w-full h-full py-4 px-4 flex flex-col justify-center items-center text-center gap-4">
                <div class="max-w-[600px]">
                  <h2 class="text-text-primary text-2xl mb-2">Keine Aufgabe im Fokus</h2>
                  <p class="text-text-primary/80 mb-4">Es ist derzeit keine Aufgabe für den Fokus ausgewählt.</p>
                </div>
              </div>
        </div>
    </div>
</template>

<script setup>
const {
  tasks,
  task,
  updateTask,
  deleteTask,
  getTasks,
  getTask,
  getFocusTask,
  hasTaskInFocus,
  getHasFocus,
} = useTasks();
const { loadingGroups, errorGroups, groups, getGroups, getGroup } = useGroups();
const { categories } = useCategories();
const { userCategories } = useUserCategories();
const {
  getSubTasks,
  subTasks,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  toggleSubTaskStatus,
} = useSubTasks();

// Track subtask changes during edit
const editSubTasks = ref([]);
const deletedSubTaskIds = ref([]);
const focusedSubtaskId = ref(null);

// Ensure we handle the case where `task.value` may be an array (API returned rows)
const focusedTask = computed(() => {
  if (!task.value) return null
  if (Array.isArray(task.value)) return task.value[0] || null
  return task.value || null
})

const category = computed(() => {
  return (
    categories.value.find((cat) => cat.id === focusedTask.value?.category_id) || null
  );
});

const userCategoryName = computed(() => {
  if (!category.value) return null;
  const catName = category.value.name;
  return userCategories.value[`${catName}_name`] || null;
});

const group = computed(() => {
  return groups.value.find((g) => g && g.id === focusedTask.value?.group_id) || null;
});

const categoryColors = computed(() => {
  if (!focusedTask.value?.category_id) {
    return { color: '#E8E8E8', color_light: '#FFFEEB', color_dark: '#C2C2C2' }
  }
  const cat = categories.value.find((c) => c.id === focusedTask.value.category_id)
  if (!cat) {
    return { color: '#E8E8E8', color_light: '#FFFEEB', color_dark: '#C2C2C2' }
  }
  return {
    color: cat.color,
    color_light: cat.color_light,
    color_dark: cat.color_dark
  }
})

// Sort subtasks: incomplete first, then completed
const sortedSubTasks = computed(() => {
  if (!subTasks.value) return [];
  return [...subTasks.value].sort((a, b) => {
    // Sort by status first (0 = incomplete comes before 1 = complete)
    if (a.status !== b.status) return a.status - b.status;
    // Then by order
    return (a.order ?? 0) - (b.order ?? 0);
  });
});

onMounted(async () => {
  await getFocusTask();
  // Only load subtasks when a focus task exists
  if (focusedTask.value) {
    console.log("task in focus:", focusedTask.value);
    await getSubTasks(focusedTask.value.id);
    // Set the first incomplete subtask as focused by default
    const firstIncomplete = sortedSubTasks.value.find((st) => !st.status);
    if (firstIncomplete) {
      focusedSubtaskId.value = firstIncomplete.id;
    }
  } else {
    console.log("No focus task found.");
  }
});

// Computed property to get the background image URL
const backgroundImageUrl = computed(() => {
  const randomNum = Math.floor(Math.random() * 20) + 1;
  if (!category.value?.name || !group.value?.id) return null;
  try {
    return `/img/bg-card/${group.value.id}/${category.value.name}-${randomNum}.png`;
  } catch (e) {
    console.error("Error loading background image:", e);
    return null;
  }
});
// Toggle subtask status on front card (immediate save)
async function handleToggleSubtask(subtask) {
  const newStatus = subtask.status ? 0 : 1;
  await toggleSubTaskStatus(subtask.id, subtask.status);
  // Refresh subtasks to get updated order
  await getSubTasks(focusedTask.value.id);
  // If completed subtask was focused, move focus to next incomplete
  if (focusedSubtaskId.value === subtask.id && newStatus === 1) {
    const nextIncomplete = sortedSubTasks.value.find(st => !st.status);
    focusedSubtaskId.value = nextIncomplete ? nextIncomplete.id : null;
  }
}

function focusSubtask(subtask) {
  focusedSubtaskId.value = subtask.id;
}

async function handlePause() {
  await updateTask(focusedTask.value.id, { status: 0 });
    await getTasks();
    await navigateTo("/mytasks");
}

async function completeTask() {
  await updateTask(focusedTask.value.id, { status: 2 });
    await getTasks();
    await navigateTo("/archive");
}

function formatDate(dateString) {
  if (!dateString) return "";

  // Parse date string as local date (avoids timezone issues with YYYY-MM-DD format)
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Relative dates for nearby days
  const relativeDates = {
    "-1": "Gestern",
    0: "Heute",
    1: "Morgen",
    2: "Übermorgen",
  };

  if (relativeDates[diffDays] !== undefined) {
    return relativeDates[diffDays];
  }

  // Show weekday for dates within the next 7 days
  if (diffDays > 0 && diffDays <= 7) {
    return date.toLocaleDateString("de-CH", { weekday: "long" });
  }

  // Full date for everything else
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  return `${parts[0]}:${parts[1]} Uhr`;
}
</script>

<style scoped>
.subtask-list-move {
  transition: transform 0.5s ease 0.5s;
}

.subtask-list-enter-active {
  transition: all 0.5s ease 0.5s;
}

.subtask-list-leave-active {
  transition: all 0.5s ease;
  position: absolute;
}

.subtask-list-enter-from,
.subtask-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
