<template>
    <div class="flex flex-col grow bg-slate-50 dark:bg-slate-700">
        <BlocksBar />
        <div class="flex grow h-full w-full">
            <BlocklyPlayground />
        </div>
    </div>
</template>

<script lang="ts" setup>
import '~/assets/style.css';
const route = useRoute();
const electron = useElectron();
</script>