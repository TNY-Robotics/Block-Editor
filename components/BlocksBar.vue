<template>
    <div class="z-50 flex flex-col sticky top-0 w-full h-fit p-1 pb-1 bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-200 dark:border-slate-800">
        <div class="relative flex w-full h-fit justify-between pr-1">
            <div class="flex w-12 justify-center items-center">
                <UIcon name="i-heroicons-code-bracket" class="w-6 h-6" />
            </div>
            <div class="flex w-fit h-full items-center justify-center my-auto">
                <p class="font-main">TNY - EDITOR</p>
            </div>
            <div class="w-12">
                <UButton variant="ghost" color="gray" size="lg" icon="i-heroicons-bars-3" @click="toggleOptions" />
            </div>
            <div v-show="showOptions" id="options" class="show-down absolute bottom-0 right-0 w-0 h-0">
                <div class="absolute w-fit h-fit min-w-[15em] right-0 top-4 p-2 bg-slate-50 dark:bg-slate-700 border border-b-4 border-slate-400 dark:border-slate-900 rounded-lg shadow-xl space-y-2">
                    <UButton v-for="button in buttons" :key="button.key" @click="() => { button.callback(); showOptions = false; }" variant="ghost" color="gray" size="lg" class="w-full" :icon="button.icon">
                        {{ button.label }}
                    </UButton>
                </div>
            </div>
        </div>
    </div>
    <UModal v-model="connectPopup" title="Connect to device" @close="connectPopup = false">
        <div class="flex flex-col justify-center p-4 space-y-8">
            <div class="flex flex-col space-y-2">
                <h2 class="text-2xl font-semibold"> {{ $t('blocks.connectionPopup.title') }} </h2>
                <p> {{ $t('blocks.connectionPopup.message') }} </p>
            </div>

            <div class="flex space-x-1 md:space-x-2 mt-4 justify-center items-center">
                <input id="ip_1" type="text" class="w-[3.5em] md:w-[4em] px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-lg text-center outline-primary focus:outline" @input="onIpChange" />
                <p class="font-semibold text-xl">.</p>
                <input id="ip_2" type="text" class="w-[3.5em] md:w-[4em] px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-lg text-center outline-primary focus:outline" @input="onIpChange" />
                <p class="font-semibold text-xl">.</p>
                <input id="ip_3" type="text" class="w-[3.5em] md:w-[4em] px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-lg text-center outline-primary focus:outline" @input="onIpChange" />
                <p class="font-semibold text-xl">.</p>
                <input id="ip_4" type="text" class="w-[3.5em] md:w-[4em] px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-lg text-center outline-primary focus:outline" @input="onIpChange" @keydown="checkForEnter" />
            </div>

            <div class="flex flex-col w-full h-fit">
                <div class="flex w-full h-fit justify-start py-1">
                    <div v-show="websocketStatus === TnyRemote.STATUS_CONNECTING" class="flex space-x-2 items-center text-yellow-500">
                        <LoadingSpinner />
                        <p> {{ $t('blocks.connectionPopup.connecting') }} </p>
                    </div>
                    <div v-show="websocketStatus === TnyRemote.STATUS_CONNECTED" class="flex space-x-2 items-center text-green-500">
                        <UIcon name="i-heroicons-check" class="w-6 h-6" />
                        <p>  {{ $t('blocks.connectionPopup.connected') }}  </p>
                    </div>
                    <div v-show="websocketStatus === TnyRemote.STATUS_DISCONNECTED" class="flex space-x-2 items-center text-red-500">
                        <UIcon name="i-heroicons-x-circle" class="w-6 h-6" />
                        <p>  {{ $t('blocks.connectionPopup.disconnected') }}  </p>
                    </div>
                    <div v-show="websocketStatus === TnyRemote.STATUS_ERROR" class="flex space-x-2 items-center text-orange-500">
                        <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6" />
                        <p>  {{ $t('blocks.connectionPopup.error') }}  </p>
                    </div>
                </div>
                <span class="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
                <div class="flex w-full justify-between mt-4">
                    <UButton color="gray" size="lg" @click="connectPopup = false"> {{ $t('verbs.cancel') }} </UButton>
                    <UButton color="primary" size="lg" @click="connectIp"> {{ $t('verbs.connect') }} </UButton>
                </div>
            </div>
        </div>
    </UModal>
</template>

<script lang="ts" setup>
import * as Blockly from 'blockly';
import { TnyRemote } from '~/assets/scripts/TnyRemote';
const { t } = useI18n();

function onIpChange(ev: any) {
    ev.target.value = ev.target.value.replace(/[^0-9]/g, '');
    if (ev.data === '.') { // focus next input
        const id = ev.target.id.split('_')[1];
        if (id === '4') return;
        const next = document.getElementById(`ip_${parseInt(id) + 1}`);
        next?.focus();
    }
}

function checkForEnter(ev: any) {
    if (ev.key === 'Enter') {
        connectIp();
    }
}

const websocketStatus = ref(TnyRemote.getInstance().status);
function connectIp() {
    const ip1 = document.getElementById('ip_1') as HTMLInputElement;
    const ip2 = document.getElementById('ip_2') as HTMLInputElement;
    const ip3 = document.getElementById('ip_3') as HTMLInputElement;
    const ip4 = document.getElementById('ip_4') as HTMLInputElement;
    const ip = `${ip1.value}.${ip2.value}.${ip3.value}.${ip4.value}`;

    const updateInterval = setInterval(() => {
        websocketStatus.value = TnyRemote.getInstance().status;
        if (websocketStatus.value === TnyRemote.STATUS_CONNECTED) {
            clearInterval(updateInterval);
        }
    }, 100);

    TnyRemote.getInstance().connect(ip).then((success) => {
        clearInterval(updateInterval);
        if (success) {
            websocketStatus.value = TnyRemote.STATUS_CONNECTED;
            setTimeout(() => { connectPopup.value = false; }, 2000);
        } else {
            websocketStatus.value = TnyRemote.STATUS_ERROR;
        }
    });
}

const connectPopup = ref(false);
const buttons = [
    {
        key: 'new',
        icon: 'i-heroicons-document-plus',
        callback: () => {
            window.location.reload();
        },
        label: t('blocks.new')
    },
    {
        key: 'load',
        icon: 'i-heroicons-folder-open',
        callback: () => {
            // select file
            const select = document.createElement('input');
            select.type = 'file';
            select.accept = '.tnyblk';
            select.onchange = (event: any) => {
                const file = event.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    const json = event.target?.result;
                    const workspace = Blockly.getMainWorkspace();
                    const blocks = JSON.parse(json as string);
                    Blockly.serialization.workspaces.load({blocks: {blocks: blocks, languageVersion: 0}}, workspace);
                };
                reader.readAsText(file);
            };
            select.click();
        },
        label: t('blocks.load')
    },
    {
        key: 'save',
        icon: 'i-heroicons-arrow-down-tray',
        callback: () => {
            const workspace = Blockly.getMainWorkspace();
            const content = Blockly.serialization.workspaces.save(workspace);
            const blocks = content.blocks.blocks;
            const json = JSON.stringify(blocks);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a') as HTMLAnchorElement;
            link.style.display = 'none';
            link.href = url;
            link.download = 'My project.tnyblk';
            document.body.appendChild(link);
            link.click();
        },
        label: t('blocks.save')
    },
    {
        key: 'connect',
        icon: 'i-heroicons-link',
        callback: () => {
            connectPopup.value = true;
            websocketStatus.value = TnyRemote.getInstance().status;
        },
        label: t('blocks.connect')
    }
];

const showOptions = ref(false);
function toggleOptions() {
    showOptions.value = !showOptions.value;
}

</script>

<style>

</style>