<template>
    <div class="flex w-fit h-fit">
        <USelect icon="i-heroicons-globe-alt" v-model="locale" :options="localesOptions" @change="onSelectChange" /> 
    </div>
</template>

<script lang="ts" setup>
const { t, locale, locales, setLocale } = useI18n();

const localesOptions = ref(locales.value.map((locale) => ({
    value: locale.code,
    label: t(`language.${locale.code}`)
})));

async function onSelectChange(value: string) {
    await setLocale(value);
    localesOptions.value = locales.value.map((locale) => ({
        value: locale.code,
        label: t(`language.${locale.code}`)
    }));
}

watch(() => locales.value, () => {
    localesOptions.value = locales.value.map((locale) => ({
        value: locale.code,
        label: t(`language.${locale.code}`)
    }));
});

</script>