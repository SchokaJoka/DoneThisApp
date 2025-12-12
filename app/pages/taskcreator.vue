<script setup>
const { categories } = useCategories();
const { userCategories } = useUserCategories();
const { groups } = useGroups();

// Audio recording composable
const {
  isRecording,
  errorMsg,
  startRecording,
  stopRecording,
  uploadAudio,
  getFileUrl,
  transcribeAudio,
  getAssistantDraft,
  cleanup,
} = useAudioRecorder();

// transcript
const userTranscript = ref([]);
const assistantResponse = ref({});
const assistantDraft = ref({});
const assistantMessage = ref([
  "Hallo! Erzähle mir von deiner Aufgabe. Ich helfe dir, sie zu erstellen.",
]);
const displayedText = ref("");
const isTyping = ref(false);
const typedMessage = ref("");

const userTask = ref({
  showDraft: false,
  name: "",
  description: "",
  categoryName: "",
  categoryUserName: "",
  groupName: "",
  group_id: "",
  category_id: "",
  due_date: "",
  due_time: "",
  status: 0,
  subTasks: [],
});

const showContent = ref(false);

watch(
  () => showContent.value,
  (newVal) => {
    if (newVal && assistantMessage.value.length > 0) {
      typeText(assistantMessage.value[0]);
    }
  }
);

const categoryColors = computed(() => {
  if (!userTask.value.category_id) {
    return { color: "#E8E8E8", color_light: "#FFFEEB", color_dark: "#C2C2C2" };
  }
  const category = categories.value.find(
    (cat) => cat.id === userTask.value.category_id
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

// Computed property to get the background image URL
const backgroundImageUrl = computed(() => {
  if (userTask.value?.group_id && userTask.value?.categoryName) {
    return `/img/bg-card/${userTask.value.group_id}/${userTask.value.categoryName}.webp`;
  } else if (userTask.value?.categoryName) {
    return `/img/bg-card/7fe28093-27dd-489b-b089-56109b2b4d14/${userTask.value.categoryName}.webp`;
  }
  return "/img/default.webp";
});

// Extract only color_name fields for the category dropdown
const categoryOptions = computed(() => {
  const options = {};
  if (userCategories.value) {
    Object.keys(userCategories.value).forEach((key) => {
      if (key.endsWith("_name")) {
        const colorKey = key.replace("_name", "");
        options[colorKey] = userCategories.value[key];
      }
    });
  }
  return options;
});

// Combined datetime for the input
const dateTimeLocal = computed({
  get() {
    if (!userTask.value.due_date) return "";
    const date = userTask.value.due_date;
    const time = userTask.value.due_time || "00:00";
    return `${date}T${time}`;
  },
  set(value) {
    if (!value) {
      userTask.value.due_date = "";
      userTask.value.due_time = "";
      return;
    }
    const [date, time] = value.split("T");
    userTask.value.due_date = date;
    userTask.value.due_time = time;
  },
});

// Typing animation function
function typeText(text, speed = 25) {
  return new Promise((resolve) => {
    isTyping.value = true;
    displayedText.value = "";
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        displayedText.value += text[index];
        index++;
      } else {
        clearInterval(interval);
        isTyping.value = false;
        resolve();
      }
    }, speed);
  });
}

// Watch for new messages and trigger typing animation
watch(
  () => assistantMessage.value.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength && newLength > 0) {
      const latestMessage =
        assistantMessage.value[assistantMessage.value.length - 1];
      await typeText(latestMessage);
    }
  }
);

// Watch for groupName changes and fetch the group_id
watch(
  () => userTask.value.groupName,
  async (newGroupName) => {
    if (!newGroupName) {
      userTask.value.group_id = "";
      return;
    }
    try {
      const groupId = await $fetch(
        `/api/groups/${encodeURIComponent(newGroupName)}`
      );
      userTask.value.group_id = groupId || "";
    } catch (e) {
      console.error("Failed to fetch group_id for groupName:", newGroupName, e);
      userTask.value.group_id = "";
    }
  }
);

// Watch for categoryUserName changes and update categoryName
watch(
  () => userTask.value.categoryUserName,
  (newCategoryUserName) => {
    if (!newCategoryUserName) {
      userTask.value.categoryName = "";
      return;
    }

    // Find the color key that matches the category name in categoryOptions
    // If the value is already a color key (e.g. assistant returns the key), use it directly
    if (categoryOptions.value && categoryOptions.value[newCategoryUserName]) {
      userTask.value.categoryName = newCategoryUserName;
      return;
    }

    // Otherwise try to find the color key by matching the display name
    const colorKey = Object.entries(categoryOptions.value).find(
      ([key, name]) => name && name.toLowerCase() === newCategoryUserName.toLowerCase()
    )?.[0];

    if (!colorKey) {
      userTask.value.categoryName = "";
      console.log("No matching color key found for:", newCategoryUserName);
      return;
    }

    userTask.value.categoryName = colorKey;
  }
);

// Watch for categoryName changes and update category_id
watch(
  () => userTask.value.categoryName,
  (newCategoryName) => {
    if (!newCategoryName) {
      userTask.value.category_id = "";
      return;
    }

    // Find the category ID from categories using the color key
    const category = categories.value.find(
      (cat) => cat.name === newCategoryName
    );
    userTask.value.category_id = category?.id || "";
  }
);

onMounted(async () => {
});

async function handleUserAudio() {
  const filePath = await uploadAudio();
  if (filePath) {
    const signedUrl = await getFileUrl(filePath);

    const transcription = await transcribeAudio(signedUrl);
    userTranscript.value.push(transcription);

    if (!transcription) {
      errorMsg.value = "Failed to transcribe audio.";
      return;
    }
  } else {
    console.log("No file path returned from uploadAudio()");
    return;
  }
  // After audio transcription, call shared draft fetch
  await fetchAssistantDraft();
}

// Shared function to request a draft from the assistant based on current transcript and userTask
async function fetchAssistantDraft() {
  const draftTask = {
    name: userTask.value.name,
    description: userTask.value.description,
    category: userTask.value.categoryUserName,
    due_date: userTask.value.due_date,
    due_time: userTask.value.due_time,
    type: userTask.value.groupName,
    subtasks: userTask.value.subTasks.map((st) => st.name).filter((name) => name),
  };

  assistantResponse.value = await getAssistantDraft(
    userTranscript.value,
    draftTask,
    userCategories.value,
    groups.value,
    assistantMessage.value // pass assistant's previous messages so the draft API has context
  );

  assistantDraft.value = assistantResponse.value.draftResponse.task || {};
  if (assistantResponse.value.draftResponse.aiMessage) {
    assistantMessage.value.push(assistantResponse.value.draftResponse.aiMessage);
  }

  // Process subtasks from AI response
  const aiSubtasks = assistantResponse.value.draftResponse.subtasks;
  if (aiSubtasks) {
    const subtaskEntries = Object.entries(aiSubtasks);
    subtaskEntries.forEach(([key, name]) => {
      const exists = userTask.value.subTasks.some((st) => st.name === name);
      if (!exists) {
        userTask.value.subTasks.push({
          name: name,
          order: userTask.value.subTasks.length,
          status: 0,
        });
      }
    });
  }

  // Map AI-provided category to the select's display name.
  const aiCategory = assistantDraft.value.category || "";
  if (aiCategory) {
    // If AI returned a color key, look up the display name from `categoryOptions`.
    if (categoryOptions.value && categoryOptions.value[aiCategory]) {
      userTask.value.categoryUserName = categoryOptions.value[aiCategory];
    } else {
      // Otherwise assume AI returned the display name already.
      userTask.value.categoryUserName = aiCategory;
    }
  } else {
    userTask.value.categoryUserName = "";
  }
  userTask.value.description = assistantDraft.value.description || "";
  userTask.value.due_date = assistantDraft.value.due_date || "";
  userTask.value.due_time = assistantDraft.value.due_time || "";
  userTask.value.name = assistantDraft.value.name || "";
  userTask.value.groupName = assistantDraft.value.type || "";
  userTask.value.showDraft = true;
}

// Send manual typed message to the assistant (adds to transcript and requests draft)
async function sendTypedMessage() {
  const text = (typedMessage.value || "").trim();
  if (!text) return;
  userTranscript.value.push(text);
  typedMessage.value = "";
  await fetchAssistantDraft();
}

async function handleStopRecording() {
  await stopRecording();
  await handleUserAudio();
}

onBeforeUnmount(() => {
  cleanup();
});

function addSubtask() {
  userTask.value.subTasks.push({
    name: "",
    order: userTask.value.subTasks.length,
    status: 0,
  });
}

function removeSubtask(index) {
  userTask.value.subTasks.splice(index, 1);
  // Re-index order
  userTask.value.subTasks.forEach((st, idx) => {
    st.order = idx;
  });
}

function clearDraft() {
  userTask.value = {
    showDraft: false,
    name: "",
    description: "",
    categoryName: "",
    categoryUserName: "",
    groupName: "",
    group_id: "",
    category_id: "",
    due_date: "",
    due_time: "",
    status: 0,
    subTasks: [],
  };
  userTranscript.value = [];
  assistantDraft.value = {};
  assistantResponse.value = {};
  assistantMessage.value = [
    "Hallo! Erzähle mir von deiner Aufgabe. Ich helfe dir, sie zu erstellen.",
  ];
}

const triedAdd = ref(false);

async function addTask() {
  triedAdd.value = true;
  let hasError = false;
  if (!userTask.value.name) {
    hasError = true;
  }
  if (!userTask.value.categoryName) {
    hasError = true;
  }
  if (hasError) return;
  const { createTask } = useTasks();
  const { createSubTasks } = useSubTasks();
  const createdTask = await createTask(userTask.value);
  console.log("Created Task:", createdTask);
  console.log("userTask.subTasks:", userTask.value.subTasks);
  console.log("subTasks length:", userTask.value.subTasks.length);
  // Create subtasks if any exist
  if (createdTask?.id && userTask.value.subTasks.length > 0) {
    console.log("Condition met: createdTask.id exists and subTasks.length > 0");
    const validSubTasks = userTask.value.subTasks.filter(st => st.name && st.name.trim())
    console.log("validSubTasks:", validSubTasks);
    if (validSubTasks.length > 0) {
      const createdSubTasks = await createSubTasks(
        createdTask.id,
        validSubTasks
      );
      console.log("Created Subtasks:", createdSubTasks);
    } else {
      console.log("No valid subtasks to create.");
    }
  } else {
    console.log("Condition not met: createdTask.id =", createdTask?.id, "subTasks.length =", userTask.value.subTasks.length);
  }
  navigateTo("/mytasks");
}
</script>

<template>
  <div class="h-[93vh] w-full fixed top-0 left-0 flex flex-col justify-center items-center">
    <div class="w-full flex flex-col items-center">
      <TransitionGroup 
        name="move-animation"
      >
      <div
        v-if="!userTask.showDraft && !showContent"
        key="lottie-intro"
        class="w-full max-h-[30vh] flex items-center justify-center"
      >
        <div class="w-full h-full max-h-[30vh]">
          <Lottie name="playing-cards" width="100%" height="100%" :autoplay="true" :loop="false" :speed="2" :pause-animation="false" :play-on-hover="false" direction="1" @onComplete="showContent = true" />
        </div>
      
      </div>
      <div
        v-if="userTask.showDraft"
        key="user-task"
        class="w-full max-h-[60vh] z-1 flex justify-center items-start px-4 pt-4"
      >
        <div
          class="w-[360px] max-h-[60vh] flex flex-col justify-start items-start bg-bg-surface p-4 rounded-[21px] gap-4 overflow-hidden"
          :style="{ backgroundColor: categoryColors.color }"
        >
          <div
            class="w-full flex flex-row flex-wrap justify-between items-center gap-2"
          >
            <div class="">
              <select
                v-model="userTask.categoryUserName"
                class="h-10 px-4 rounded-lg text-text-primary transition-colors duration-300"
                :style="{
                  backgroundColor: categoryColors.color_light,
                  border:
                    triedAdd && !userTask.categoryName
                      ? '2px solid #ef4444'
                      : '2px solid ' + categoryColors.color_light,
                }"
                @change="triedAdd = false"
              >
                <option value="" disabled selected>Kategorie</option>
                <option
                  v-for="(name, key) in categoryOptions"
                  :key="key"
                  :value="name"
                >
                  {{ name }}
                </option>
              </select>
            </div>

            <div class="shrink-0">
              <input
                type="datetime-local"
                v-model="dateTimeLocal"
                class="h-10 px-2 rounded-lg text-sm max-w-[180px]"
                :style="{ backgroundColor: categoryColors.color_light }"
              />
            </div>
          </div>

          <div class="w-full">
            <input
              type="text"
              v-model="userTask.name"
              placeholder="Name"
              :class="[
                'w-full px-4 py-2 rounded-lg text-2xl font-bold outline-none placeholder-text-primary transition-colors duration-300',
              ]"
              :style="{
                fontFamily: 'var(--font-primary)',
                backgroundColor: categoryColors.color_light,
                border:
                  triedAdd && (!userTask.name || !userTask.name.trim())
                    ? '2px solid #ef4444'
                    : '2px solid ' + categoryColors.color_light,
              }"
              @input="triedAdd = false"
            />
          </div>
          <div class="w-full">
            <textarea
              v-model="userTask.description"
              placeholder="Description"
              rows="3"
              class="w-full px-4 py-3 text-base bg-bg-fill rounded-lg border-none placeholder-text-primary"
              :style="{
                fontFamily: 'var(--font-secondary)',
                backgroundColor: categoryColors.color_light,
              }"
            />
          </div>

          <!-- Subtasks -->
          <div class="w-full flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
            <div
              v-for="(subtask, index) in userTask.subTasks"
              :key="index"
              class="flex items-center gap-2 px-4 py-3 rounded-lg"
              :style="{ backgroundColor: categoryColors.color_light }"
            >
              <input
                v-model="userTask.subTasks[index].name"
                type="text"
                placeholder="Subtask name..."
                class="flex-1 bg-transparent border-none outline-none text-text-primary placeholder-text-primary/50"
                :style="{ fontFamily: 'var(--font-secondary)' }"
              />
              <button
                @click.stop="removeSubtask(index)"
                class="p-1 text-text-primary/50 hover:text-text-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
            <button
              @click.stop="addSubtask"
              class="w-full px-4 py-3 rounded-lg text-text-primary font-medium transition-colors sticky bottom-0"
              :style="{ backgroundColor: categoryColors.color_dark }"
            >
              + Add Subtask
            </button>
          </div>

          <div
            class="flex flex-row justify-between items-center w-full gap-4"
          >
            <button
              @click.stop="clearDraft"
              class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg"
            >
              <div class="size-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_2565_9051)">
                    <path
                      d="M18 6L6 18"
                      stroke="#2B2B2B"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M6 6L18 18"
                      stroke="#2B2B2B"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2565_9051">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </button>
            <button
              @click.stop="addTask()"
              class="flex w-full justify-center cursor-pointer p-4 bg-bg rounded-lg"
            >
              <div class="size-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  class="stroke-text-primary"
                >
                  <g clip-path="url(#clip0_2523_8899)">
                    <path
                      d="M5 12L10 17L20 7"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2523_8899">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="showContent"
        key="ai-message"
        class="w-full h-full overflow-hidden overflow-y-auto flex justify-center items-start px-4 pb-4"
      >
        <div class="w-full max-w-[500px] flex flex-col items-center gap-4">
          <!-- Error message -->
          <div
            v-if="errorMsg"
            class="w-full bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ errorMsg }}
          </div>
            <div
              v-if="assistantMessage.length > 0"
              class="w-full flex flex-col rounded-2xl px-4 py-4 items-center text-left gap-4"
            >
              <div class="w-15 h-15">
                <Lottie
                  name="Eyes"
                  :pause-animation="!isRecording && !isTyping"
                  height="100%"
                  :speed="1"
                />
              </div>

              <div class="w-full">
                <p
                  class="text-gray-800 text-lg"
                  style="font-family: 'Roboto', sans-serif"
                >
                  {{ displayedText }}
                  <span
                    v-if="isTyping"
                    class="inline-block w-0.5 h-4 bg-gray-800 ml-0.5 animate-pulse"
                  ></span>
                </p>
              </div>
            </div>
        </div>
      </div>

      <!-- Recording button -->
      <div
        key="recording-section"
        class="w-full max-w-[500px] flex justify-center items-center p-4 mb-8"
      >
          <TransitionGroup
            v-if="showContent"
            tag="div"
            class="flex w-full justify-center items-center gap-4"
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-500 ease-in absolute"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75"
          >
            <div class="relative h-16 w-full max-w-[480px]" key="user-input">
              <input
                v-model="typedMessage"
                @keyup.enter="sendTypedMessage()"
                :placeholder="'Beschreibe deine Aufgabe...'
                "
                class="w-full h-full pr-12 pl-4 rounded-lg outline-none text-text-primary placeholder-text-primary transition-colors bg-primary/50"
              />
              <button
                @click="sendTypedMessage()"
                aria-label="Senden"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-btn-primary hover:bg-btn-primary-hover text-text-secondary transition-all z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" class="stroke-current">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <button
              key="mic-btn"
              @click="isRecording ? handleStopRecording() : startRecording()"
              :class="[
                'flex items-center justify-center w-16 h-16 rounded-full shrink-0 transition-all',
                isRecording
                  ? 'bg-accent hover:bg-accent-hover animate-pulse text-white'
                  : 'bg-btn-primary hover:bg-btn-primary-hover text-text-secondary',
              ]"
            >
              <template v-if="!isRecording">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                  />
                  <path
                    d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                  />
                </svg>
              </template>
              <template v-else>
                <div class="w-3 h-3 bg-white rounded-full"></div>
              </template>
            </button>
          </TransitionGroup>
      </div>

      </TransitionGroup>

    </div>
  </div>
</template>

<style scoped>
  .move-animation-move, 
  .move-animation-enter-active,
  .move-animation-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .move-animation-enter-from,
  .move-animation-leave-to {
    opacity: 0;
  }

  /* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
  .move-animation-leave-active {
    position: absolute;
    width: 100%;
    height: 30vh;
  }
</style>