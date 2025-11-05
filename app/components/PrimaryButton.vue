<template>
    <button
        :class="buttonClass"
        @click="handleButton"
    >
        {{ buttonText }}
    </button>
</template>

<script setup>

const props = defineProps({
    buttonText: {
        type: String,
        default: 'Click Me'
    },
    src: {
        type: String,
        required: false
    },
    type: {
        type: String,
        default: 'primary',
        validator: value => ['primary', 'secondary'].includes(value)
    }
})

const buttonClass = computed(() => {
    if (props.type === 'secondary') {
        return 'bg-orange-100 hover:bg-orange-600 text-black font-bold py-2 px-4 rounded transition duration-200'
    }
    return 'bg-orange-600 hover:bg-orange-700 text-black font-bold py-2 px-4 rounded transition duration-200'
})

const handleButton = () => {
    if (props.src)
        window.location.href = props.src
    else {
        console.log('Button clicked, but no src provided.')
    }
}
</script>
