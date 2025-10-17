<template>
    <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
        @click="handleButton"
    >
        {{ buttonText }}
    </button>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
    buttonText: {
        type: String,
        default: 'Click Me'
    },
    src: {
        type: String,
        required: false
    }
})

const handleButton = () => {
    if (props.src)
    window.location.href = props.src
    else {
        console.log('Button clicked, but no src provided.')
    }
}
</script>
