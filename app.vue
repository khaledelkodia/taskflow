<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()

// Watch for locale changes and update html lang and dir
useHead(() => {
  const currentLocale = (locales.value as any[]).find((l) => l.code === locale.value)
  const dir = currentLocale?.dir || 'ltr'
  return {
    htmlAttrs: {
      lang: locale.value,
      dir: dir
    }
  }
})
</script>
