<script setup lang="ts">
const { t } = useI18n()
const localeHead = useLocaleHead()

useHead({
  htmlAttrs: { lang: () => localeHead.value.htmlAttrs?.lang },
  link: () => localeHead.value.link ?? [],
  meta: () => localeHead.value.meta ?? [],
  titleTemplate: title => (title ? `${title} · ${t('brand')}` : t('brand')),
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
