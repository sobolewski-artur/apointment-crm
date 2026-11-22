<script setup lang="ts">
const { t } = useI18n()

useHead({ title: () => t('booking.title') })
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
    <h1 class="font-serif text-3xl font-medium text-stone-900 sm:text-4xl">{{ t('booking.title') }}</h1>
    <p class="mt-3 text-stone-600">{{ t('booking.subtitle') }}</p>

    <!-- Depends on the browser: saved cart, local date/time, Firestore -->
    <ClientOnly>
      <BookingFlow class="mt-6 sm:mt-10" />
      <template #fallback>
        <div class="mt-10 animate-pulse text-sm text-stone-500">{{ t('booking.loading') }}</div>
      </template>
    </ClientOnly>
  </div>
</template>
