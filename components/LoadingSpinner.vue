<template>
    <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
</template>

<style>
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}
</style>